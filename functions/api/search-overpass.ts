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
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_TIMEOUT_MS = 28_000;

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

    let overpassResponse: Response;
    try {
      overpassResponse = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: query,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!overpassResponse.ok) {
      return jsonResponse(
        { error: `Overpass respondió con error (${overpassResponse.status}).` },
        502,
      );
    }

    overpassData = await overpassResponse.json();
  } catch {
    return jsonResponse({ error: 'No se pudo contactar a Overpass API.' }, 502);
  }

  if (!overpassData || !Array.isArray(overpassData.elements)) {
    return jsonResponse({ error: 'Overpass devolvió una respuesta inesperada.' }, 502);
  }

  const named = overpassData.elements.filter(hasName);
  const encontrados = named.length;

  if (encontrados === 0) {
    return jsonResponse({ encontrados: 0, insertados: 0, duplicados_omitidos: 0 }, 200);
  }

  const { data: existingProspects, error: existingError } = await supabaseAdmin
    .from('prospects')
    .select('fuente_ids')
    .eq('campaign_id', campaignId);

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

  const newElements = named.filter((element) => !existingOsmIds.has(String(element.id)));
  const duplicadosOmitidos = named.length - newElements.length;

  if (newElements.length === 0) {
    return jsonResponse({ encontrados, insertados: 0, duplicados_omitidos: duplicadosOmitidos }, 200);
  }

  const rowsToInsert: TablesInsert<'prospects'>[] = newElements.map((element) => ({
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
  }));

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
    },
    200,
  );
};
