import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../../src/types/database';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GOOGLE_PLACES_API_KEY: string;
}

interface EnrichProspectsBody {
  prospect_ids: unknown;
}

interface ProspectRow {
  id: string;
  nombre_negocio: string;
  contacto: unknown;
  lat: number | null;
  lon: number | null;
}

interface ErrorEntry {
  prospect_id: string;
  nombre_negocio: string;
  motivo: string;
}

const MAX_PROSPECTS_PER_REQUEST = 10;
const EXTERNAL_FETCH_TIMEOUT_MS = 25_000;
const PLACES_TEXT_SEARCH_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_LOCATION_BIAS_RADIUS_METERS = 2000;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function getContactoField(contacto: unknown, field: 'email' | 'telefono' | 'web'): string | null {
  if (!contacto || typeof contacto !== 'object' || Array.isArray(contacto)) {
    return null;
  }
  const value = (contacto as Record<string, unknown>)[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

// --- Google Places Text Search (New) -----------------------------------------
// Field mask y forma del request/response confirmados contra la documentacion
// vigente de Places API (New) antes de escribir esto (ver commit): websiteUri e
// internationalPhoneNumber son campos top-level de cada elemento de `places`.

interface PlacesTextSearchResponse {
  places?: {
    websiteUri?: string;
    internationalPhoneNumber?: string;
  }[];
}

interface PlaceResult {
  websiteUri: string;
  internationalPhoneNumber: string | null;
}

async function searchPlaceWebsite(
  nombreNegocio: string,
  lat: number,
  lon: number,
  apiKey: string,
): Promise<PlaceResult | null> {
  const response = await fetchWithTimeout(
    PLACES_TEXT_SEARCH_ENDPOINT,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.websiteUri,places.internationalPhoneNumber',
      },
      body: JSON.stringify({
        textQuery: nombreNegocio,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lon },
            radius: PLACES_LOCATION_BIAS_RADIUS_METERS,
          },
        },
      }),
    },
    EXTERNAL_FETCH_TIMEOUT_MS,
  );

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Places HTTP ${response.status}: ${bodyText.slice(0, 300)}`);
  }

  const data = (await response.json()) as PlacesTextSearchResponse;
  const first = data.places?.[0];

  if (!first || !first.websiteUri) {
    return null;
  }

  return {
    websiteUri: first.websiteUri,
    internationalPhoneNumber: first.internationalPhoneNumber ?? null,
  };
}

// --- Procesamiento por prospecto -----------------------------------------------

type ProspectOutcome =
  | { kind: 'enriquecido' }
  | { kind: 'sin_resultado' }
  | { kind: 'omitido_con_sitio' }
  | { kind: 'error'; motivo: string };

async function processProspect(
  supabaseAdmin: SupabaseClient<Database>,
  prospect: ProspectRow,
  env: Env,
): Promise<{ prospectId: string; nombreNegocio: string; outcome: ProspectOutcome }> {
  const webActual = getContactoField(prospect.contacto, 'web');

  if (webActual) {
    return {
      prospectId: prospect.id,
      nombreNegocio: prospect.nombre_negocio,
      outcome: { kind: 'omitido_con_sitio' },
    };
  }

  if (prospect.lat === null || prospect.lon === null) {
    return {
      prospectId: prospect.id,
      nombreNegocio: prospect.nombre_negocio,
      outcome: { kind: 'error', motivo: 'No tiene coordenadas para desambiguar la búsqueda.' },
    };
  }

  let placeResult: PlaceResult | null;
  try {
    placeResult = await searchPlaceWebsite(
      prospect.nombre_negocio,
      prospect.lat,
      prospect.lon,
      env.GOOGLE_PLACES_API_KEY,
    );
  } catch (error) {
    return {
      prospectId: prospect.id,
      nombreNegocio: prospect.nombre_negocio,
      outcome: { kind: 'error', motivo: error instanceof Error ? error.message : 'error desconocido' },
    };
  }

  if (!placeResult) {
    return {
      prospectId: prospect.id,
      nombreNegocio: prospect.nombre_negocio,
      outcome: { kind: 'sin_resultado' },
    };
  }

  const contactoActual = (prospect.contacto ?? {}) as Record<string, unknown>;
  const telefonoActual = getContactoField(prospect.contacto, 'telefono');

  const contactoActualizado = {
    ...contactoActual,
    web: webActual ?? placeResult.websiteUri,
    telefono: telefonoActual ?? placeResult.internationalPhoneNumber ?? null,
  };

  const { error: updateError } = await supabaseAdmin
    .from('prospects')
    .update({ contacto: contactoActualizado as unknown as Json })
    .eq('id', prospect.id);

  if (updateError) {
    return {
      prospectId: prospect.id,
      nombreNegocio: prospect.nombre_negocio,
      outcome: { kind: 'error', motivo: `No se pudo guardar el sitio encontrado: ${updateError.message}` },
    };
  }

  return {
    prospectId: prospect.id,
    nombreNegocio: prospect.nombre_negocio,
    outcome: { kind: 'enriquecido' },
  };
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

  let body: EnrichProspectsBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'El body debe ser JSON válido.' }, 400);
  }

  const prospectIds = Array.isArray(body.prospect_ids)
    ? body.prospect_ids.filter((id): id is string => typeof id === 'string')
    : [];

  if (prospectIds.length === 0) {
    return jsonResponse({ error: 'prospect_ids no puede estar vacío.' }, 400);
  }

  if (prospectIds.length > MAX_PROSPECTS_PER_REQUEST) {
    return jsonResponse({ error: 'Máximo 10 prospectos por solicitud' }, 400);
  }

  const { data: foundProspects, error: fetchError } = await supabaseAdmin
    .from('prospects')
    .select('id, nombre_negocio, contacto, lat, lon')
    .in('id', prospectIds)
    .eq('owner_id', userId);

  if (fetchError) {
    return jsonResponse({ error: 'No se pudieron cargar los prospectos.' }, 500);
  }

  const found = (foundProspects ?? []) as ProspectRow[];
  const foundIds = new Set(found.map((prospect) => prospect.id));

  const errores: ErrorEntry[] = prospectIds
    .filter((id) => !foundIds.has(id))
    .map((id) => ({
      prospect_id: id,
      nombre_negocio: '(desconocido)',
      motivo: 'No existe o no te pertenece.',
    }));

  const settled = await Promise.allSettled(found.map((prospect) => processProspect(supabaseAdmin, prospect, env)));

  let enriquecidos = 0;
  let sinResultado = 0;
  let omitidosConSitio = 0;
  const enrichedIds: string[] = [];

  for (const result of settled) {
    if (result.status === 'rejected') {
      errores.push({
        prospect_id: '(desconocido)',
        nombre_negocio: '(desconocido)',
        motivo: result.reason instanceof Error ? result.reason.message : 'error desconocido',
      });
      continue;
    }

    const { prospectId, nombreNegocio, outcome } = result.value;
    if (outcome.kind === 'enriquecido') {
      enriquecidos += 1;
      enrichedIds.push(prospectId);
    } else if (outcome.kind === 'sin_resultado') {
      sinResultado += 1;
    } else if (outcome.kind === 'omitido_con_sitio') {
      omitidosConSitio += 1;
    } else {
      errores.push({ prospect_id: prospectId, nombre_negocio: nombreNegocio, motivo: outcome.motivo });
    }
  }

  return jsonResponse(
    {
      procesados: found.length,
      enriquecidos,
      sin_resultado: sinResultado,
      omitidos_con_sitio: omitidosConSitio,
      errores,
      // Campo adicional (no forma parte del contrato original pedido): el hook
      // del frontend lo necesita para encadenar el re-audit solo sobre los
      // prospectos que efectivamente encontraron sitio web, sin desperdiciar
      // llamadas a PageSpeed/Firecrawl en el resto del batch.
      enriched_ids: enrichedIds,
    },
    200,
  );
};
