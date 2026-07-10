import { createClient } from '@supabase/supabase-js';
import type { Database, TablesInsert } from '../../src/types/database';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface SearchOverpassBody {
  campaign_id: string;
  osm_tag: string;
  bbox: [number, number, number, number];
}

interface OverpassElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface Coords {
  lat: number;
  lon: number;
}

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const OVERPASS_USER_AGENT = 'ProspectaAura/1.0 (contacto: jpgamboa1309@gmail.com)';
const OVERPASS_TIMEOUT_MS = 10_000;
const EARTH_RADIUS_METERS = 6_371_000;

// 2km: suficientemente grande para cubrir sedes reales de una misma cadena en la
// misma zona comercial, suficientemente chico para no fusionar negocios distintos
// que comparten un nombre genérico (ej. "Barber Shop") pero están dispersos por
// la ciudad.
const DEDUP_RADIUS_METERS = 2000;

class OverpassFetchError extends Error {
  attempts: string[];

  constructor(attempts: string[]) {
    super('Todos los mirrors de Overpass fallaron.');
    this.name = 'OverpassFetchError';
    this.attempts = attempts;
  }
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isValidBbox(bbox: unknown): bbox is [number, number, number, number] {
  return Array.isArray(bbox) && bbox.length === 4 && bbox.every((n) => typeof n === 'number' && Number.isFinite(n));
}

function parseOsmTag(osmTag: string): { key: string; value: string } | null {
  const eqIndex = osmTag.indexOf('=');
  if (eqIndex <= 0 || eqIndex === osmTag.length - 1) {
    return null;
  }
  return {
    key: osmTag.slice(0, eqIndex),
    value: osmTag.slice(eqIndex + 1),
  };
}

function escapeOverpassValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function hasName(
  element: OverpassElement,
): element is OverpassElement & { tags: Record<string, string> & { name: string } } {
  return typeof element.tags?.name === 'string' && element.tags.name.trim().length > 0;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getElementCoords(element: OverpassElement): Coords | null {
  if (element.type === 'node') {
    if (typeof element.lat === 'number' && typeof element.lon === 'number') {
      return { lat: element.lat, lon: element.lon };
    }
    return null;
  }

  if (typeof element.center?.lat === 'number' && typeof element.center?.lon === 'number') {
    return { lat: element.center.lat, lon: element.center.lon };
  }

  return null;
}

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

async function fetchOverpassWithFallback(
  query: string,
): Promise<{ data: OverpassResponse; mirrorUrl: string }> {
  const requestHeaders = {
    'Content-Type': 'text/plain;charset=UTF-8',
    'User-Agent': OVERPASS_USER_AGENT,
  };

  const attempts: string[] = [];

  for (const mirrorUrl of OVERPASS_MIRRORS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

    console.log('[search-overpass] intentando mirror', { mirrorUrl, headers: requestHeaders, query });

    try {
      const response = await fetch(mirrorUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: query,
        signal: controller.signal,
      });

      if (!response.ok) {
        const bodyText = await response.text();
        console.error('[search-overpass] mirror respondió con error', {
          mirrorUrl,
          status: response.status,
          bodyText,
        });
        attempts.push(`${mirrorUrl} → HTTP ${response.status}: ${bodyText.slice(0, 500)}`);
        continue;
      }

      const data = (await response.json()) as OverpassResponse;
      console.log('[search-overpass] mirror respondió OK', { mirrorUrl });
      return { data, mirrorUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      console.error('[search-overpass] excepción consultando mirror', { mirrorUrl, message });
      attempts.push(`${mirrorUrl} → excepción: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new OverpassFetchError(attempts);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

  if (!token) {
    return jsonResponse({ error: 'Falta el header Authorization con el token de sesión.' }, 401);
  }

  const supabaseAdmin = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Token inválido o expirado.' }, 401);
  }
  const userId = userData.user.id;

  let body: SearchOverpassBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'El body debe ser JSON válido.' }, 400);
  }

  const { campaign_id: campaignId, osm_tag: osmTag, bbox } = body;

  if (!campaignId || typeof osmTag !== 'string' || !isValidBbox(bbox)) {
    return jsonResponse(
      { error: 'Faltan campos requeridos: campaign_id, osm_tag y bbox (4 números).' },
      400,
    );
  }

  const parsedTag = parseOsmTag(osmTag);
  if (!parsedTag) {
    return jsonResponse({ error: 'osm_tag debe tener el formato "clave=valor".' }, 400);
  }

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (campaignError) {
    return jsonResponse({ error: 'No se pudo validar la campaña.' }, 500);
  }

  if (!campaign) {
    return jsonResponse({ error: 'La campaña no existe o no te pertenece.' }, 403);
  }

  const [south, west, north, east] = bbox;
  const query = `[out:json][timeout:25];\nnwr["${parsedTag.key}"="${escapeOverpassValue(parsedTag.value)}"](${south},${west},${north},${east});\nout center tags;`;

  let overpassData: OverpassResponse;
  try {
    const result = await fetchOverpassWithFallback(query);
    overpassData = result.data;
  } catch (error) {
    if (error instanceof OverpassFetchError) {
      return jsonResponse(
        {
          error: 'No se pudo consultar Overpass en ningún mirror.',
          detalles: error.attempts,
        },
        502,
      );
    }
    return jsonResponse({ error: 'No se pudo contactar a Overpass API.' }, 502);
  }

  if (!overpassData || !Array.isArray(overpassData.elements)) {
    return jsonResponse({ error: 'Overpass devolvió una respuesta inesperada.' }, 502);
  }

  const named = overpassData.elements.filter(hasName);
  const encontrados = named.length;

  if (encontrados === 0) {
    return jsonResponse({ encontrados: 0, insertados: 0, duplicados_omitidos: 0, sedes_agrupadas: 0 }, 200);
  }

  const { data: existingProspects, error: existingError } = await supabaseAdmin
    .from('prospects')
    .select('fuente_ids, nombre_negocio, lat, lon')
    .eq('owner_id', userId);

  if (existingError) {
    return jsonResponse({ error: 'No se pudieron revisar los prospectos existentes.' }, 500);
  }

  const existingOsmIds = new Set(
    (existingProspects ?? [])
      .map((prospect) => {
        const fuenteIds = prospect.fuente_ids as { osm_id?: number | string } | null;
        return fuenteIds?.osm_id !== undefined ? String(fuenteIds.osm_id) : null;
      })
      .filter((id): id is string => id !== null),
  );

  // Nombre normalizado -> ubicaciones conocidas con ese nombre (existentes + las que
  // se van agregando de este mismo batch, a medida que se procesa cada elemento).
  const nameLocations = new Map<string, Coords[]>();

  for (const prospect of existingProspects ?? []) {
    const normalized = normalizeName(prospect.nombre_negocio);
    const locations = nameLocations.get(normalized) ?? [];
    if (typeof prospect.lat === 'number' && typeof prospect.lon === 'number') {
      locations.push({ lat: prospect.lat, lon: prospect.lon });
    }
    nameLocations.set(normalized, locations);
  }

  const newElements: (OverpassElement & { tags: Record<string, string> & { name: string } })[] = [];
  let duplicadosOmitidos = 0;
  let sedesAgrupadas = 0;

  for (const element of named) {
    if (existingOsmIds.has(String(element.id))) {
      duplicadosOmitidos += 1;
      continue;
    }

    const normalizedName = normalizeName(element.tags.name);
    const elementCoords = getElementCoords(element);
    const knownLocations = nameLocations.get(normalizedName);

    if (knownLocations !== undefined && elementCoords && knownLocations.length > 0) {
      const isNearby = knownLocations.some(
        (coords) =>
          haversineDistanceMeters(elementCoords.lat, elementCoords.lon, coords.lat, coords.lon) <=
          DEDUP_RADIUS_METERS,
      );

      if (isNearby) {
        sedesAgrupadas += 1;
        continue;
      }
    }
    // Nombre repetido sin coordenadas de un lado u otro (no se puede confirmar
    // cercanía) o todas las ubicaciones conocidas superan el radio: se trata como
    // un negocio distinto y se inserta.

    const locations = nameLocations.get(normalizedName) ?? [];
    if (elementCoords) {
      locations.push(elementCoords);
    }
    nameLocations.set(normalizedName, locations);

    newElements.push(element);
  }

  if (newElements.length === 0) {
    return jsonResponse(
      { encontrados, insertados: 0, duplicados_omitidos: duplicadosOmitidos, sedes_agrupadas: sedesAgrupadas },
      200,
    );
  }

  const rowsToInsert: TablesInsert<'prospects'>[] = newElements.map((element) => {
    const coords = getElementCoords(element);
    return {
      owner_id: userId,
      campaign_id: campaignId,
      nombre_negocio: element.tags.name,
      categoria: osmTag,
      contacto: {
        email: element.tags.email ?? null,
        telefono: element.tags.phone ?? element.tags['contact:phone'] ?? null,
        web: element.tags.website ?? element.tags['contact:website'] ?? null,
      },
      fuente: 'overpass',
      fuente_ids: { osm_id: element.id, osm_type: element.type },
      estado: 'encontrado',
      lat: coords?.lat ?? null,
      lon: coords?.lon ?? null,
    };
  });

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('prospects')
    .insert(rowsToInsert)
    .select('id');

  if (insertError) {
    return jsonResponse({ error: 'No se pudieron guardar los prospectos encontrados.' }, 500);
  }

  return jsonResponse(
    {
      encontrados,
      insertados: inserted?.length ?? rowsToInsert.length,
      duplicados_omitidos: duplicadosOmitidos,
      sedes_agrupadas: sedesAgrupadas,
    },
    200,
  );
};
