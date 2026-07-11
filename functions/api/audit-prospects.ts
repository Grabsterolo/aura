import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json, TablesInsert } from '../../src/types/database';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PAGESPEED_API_KEY: string;
  FIRECRAWL_API_KEY: string;
}

interface AuditProspectsBody {
  prospect_ids: unknown;
}

interface ProspectRow {
  id: string;
  nombre_negocio: string;
  estado: string;
  contacto: unknown;
}

interface Velocidad {
  performance_score: number | null;
  lcp_ms: number | null;
  cls: number | null;
  tbt_ms: number | null;
  medido_en: string;
  error?: string;
}

interface MedioContacto {
  email: boolean;
  telefono: boolean;
  whatsapp: boolean;
  formulario: boolean;
  chat_vivo: boolean;
  chatbot_ia: boolean;
  chatbot_vendor: string | null;
}

type SitioTipo = 'landing' | 'funcional' | 'ecommerce' | 'portal' | 'sin_sitio_web';

interface FuncionalidadSitio {
  tipo: SitioTipo;
  paginas_detectadas: number;
  tiene_reservas_online: boolean;
}

interface ErrorEntry {
  prospect_id: string;
  nombre_negocio: string;
  motivo: string;
}

const MAX_PROSPECTS_PER_REQUEST = 10;
const EXTERNAL_FETCH_TIMEOUT_MS = 25_000;
const PAGESPEED_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const FIRECRAWL_ENDPOINT = 'https://api.firecrawl.dev/v2/scrape';

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

// --- PageSpeed Insights ---------------------------------------------------

interface PageSpeedResponse {
  lighthouseResult?: {
    categories?: {
      performance?: { score?: number };
    };
    audits?: {
      'largest-contentful-paint'?: { numericValue?: number };
      'cumulative-layout-shift'?: { numericValue?: number };
      'total-blocking-time'?: { numericValue?: number };
    };
  };
}

async function fetchPageSpeed(url: string, apiKey: string): Promise<Velocidad> {
  const medidoEn = new Date().toISOString();

  try {
    const endpoint = `${PAGESPEED_ENDPOINT}?url=${encodeURIComponent(url)}&key=${encodeURIComponent(apiKey)}&strategy=mobile`;
    const response = await fetchWithTimeout(endpoint, {}, EXTERNAL_FETCH_TIMEOUT_MS);

    if (!response.ok) {
      const bodyText = await response.text();
      return {
        performance_score: null,
        lcp_ms: null,
        cls: null,
        tbt_ms: null,
        medido_en: medidoEn,
        error: `PageSpeed HTTP ${response.status}: ${bodyText.slice(0, 300)}`,
      };
    }

    const data = (await response.json()) as PageSpeedResponse;
    const performanceScoreRaw = data.lighthouseResult?.categories?.performance?.score;
    const lcpRaw = data.lighthouseResult?.audits?.['largest-contentful-paint']?.numericValue;
    const clsRaw = data.lighthouseResult?.audits?.['cumulative-layout-shift']?.numericValue;
    const tbtRaw = data.lighthouseResult?.audits?.['total-blocking-time']?.numericValue;

    return {
      performance_score: typeof performanceScoreRaw === 'number' ? Math.round(performanceScoreRaw * 100) : null,
      lcp_ms: typeof lcpRaw === 'number' ? lcpRaw : null,
      cls: typeof clsRaw === 'number' ? clsRaw : null,
      tbt_ms: typeof tbtRaw === 'number' ? tbtRaw : null,
      medido_en: medidoEn,
    };
  } catch (error) {
    return {
      performance_score: null,
      lcp_ms: null,
      cls: null,
      tbt_ms: null,
      medido_en: medidoEn,
      error: error instanceof Error ? error.message : 'error desconocido',
    };
  }
}

// --- Firecrawl scrape -------------------------------------------------------

interface FirecrawlResult {
  markdown: string;
  html: string;
}

async function fetchFirecrawl(url: string, apiKey: string): Promise<FirecrawlResult> {
  const response = await fetchWithTimeout(
    FIRECRAWL_ENDPOINT,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url, formats: ['markdown', 'html'] }),
    },
    EXTERNAL_FETCH_TIMEOUT_MS,
  );

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Firecrawl HTTP ${response.status}: ${bodyText.slice(0, 300)}`);
  }

  const raw = (await response.json()) as Record<string, unknown>;

  // La forma exacta de /v2/scrape se confirmó en vivo antes de mergear esto
  // (ver el commit): la data viene bajo la key `data` en la raíz. Se prueba
  // también la raíz directa por si acaso Firecrawl cambia el shape entre
  // cuentas/planes — no rompe si alguna de las dos rutas no existe.
  const data = (raw.data as Record<string, unknown> | undefined) ?? raw;
  const markdown = typeof data.markdown === 'string' ? data.markdown : '';
  const html = typeof data.html === 'string' ? data.html : '';

  if (!markdown && !html) {
    throw new Error('Firecrawl no devolvió markdown ni html.');
  }

  return { markdown, html };
}

// --- Detección por reglas (sin IA) ------------------------------------------

const CHAT_VIVO_PATTERNS: RegExp[] = [
  /tawk\.to/i,
  /crisp\.chat/i,
  /widget\.intercom\.io|intercom/i,
  /js\.driftt\.com|drift\.com/i,
  /zendesk|zdassets\.com/i,
  /livechatinc\.com|livechat/i,
  /tidio/i,
  /js\.hs-scripts\.com/i,
];

function detectChatVivo(content: string): boolean {
  return CHAT_VIVO_PATTERNS.some((pattern) => pattern.test(content));
}

const CHATBOT_IA_VENDORS: { name: string; pattern: RegExp }[] = [
  { name: 'Chatbase', pattern: /chatbase/i },
  { name: 'Voiceflow', pattern: /voiceflow/i },
  { name: 'Landbot', pattern: /landbot/i },
  { name: 'ManyChat', pattern: /manychat/i },
];

// Heurística best-effort: busca vendors conocidos de chatbots con IA, o
// menciones textuales genéricas ("chatbot", "asistente virtual"). No hay forma
// confiable de distinguir un chatbot con IA real de un simple chat en vivo
// solo con el HTML/markdown del home — puede dar falsos positivos/negativos.
function detectChatbotIA(content: string): { detected: boolean; vendor: string | null } {
  for (const vendor of CHATBOT_IA_VENDORS) {
    if (vendor.pattern.test(content)) {
      return { detected: true, vendor: vendor.name };
    }
  }
  if (/chatbot|asistente virtual/i.test(content)) {
    return { detected: true, vendor: null };
  }
  return { detected: false, vendor: null };
}

function detectWhatsapp(content: string): boolean {
  return /wa\.me\//i.test(content) || /api\.whatsapp\.com/i.test(content);
}

function detectFormulario(html: string): boolean {
  return /<form[\s>]/i.test(html);
}

function detectEcommerce(content: string): boolean {
  return /carrito|checkout|agregar al carrito|add to cart|woocommerce|shopify|cdn\.shopify\.com/i.test(content);
}

function detectPortal(content: string): boolean {
  return /\blogin\b|mi cuenta|\bdashboard\b/i.test(content);
}

function detectReservasOnline(content: string): boolean {
  return /reservar|agendar cita|book now|calendly\.com|acuityscheduling\.com|booksy\.com|fresha\.com/i.test(
    content,
  );
}

// Cuenta links internos distintos del home (mismo hostname o rutas relativas).
// Es una aproximación sobre una sola página, no un crawl completo del sitio.
function countInternalLinks(html: string, baseUrl: string): number {
  const hrefRegex = /<a\s[^>]*href=["']([^"'#]+)["']/gi;
  let hostname: string | null;
  try {
    hostname = new URL(baseUrl).hostname;
  } catch {
    hostname = null;
  }

  const internalLinks = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue;
    }
    if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
      internalLinks.add(href);
      continue;
    }
    if (hostname) {
      try {
        if (new URL(href, baseUrl).hostname === hostname) {
          internalLinks.add(href);
        }
      } catch {
        // URL malformada, se ignora
      }
    }
  }

  return internalLinks.size;
}

// Aproximación de MVP: clasifica el tipo de sitio mirando solo el home (no
// crawlea el sitio completo). "funcional" = 3+ links internos distintos y no
// matchea ecommerce/portal; "landing" es el fallback si no matchea nada.
function detectSiteType(html: string, content: string, url: string): { tipo: SitioTipo; paginasDetectadas: number } {
  const paginasDetectadas = countInternalLinks(html, url);

  if (detectEcommerce(content)) {
    return { tipo: 'ecommerce', paginasDetectadas };
  }
  if (detectPortal(content)) {
    return { tipo: 'portal', paginasDetectadas };
  }
  if (paginasDetectadas >= 3) {
    return { tipo: 'funcional', paginasDetectadas };
  }
  return { tipo: 'landing', paginasDetectadas };
}

function buildMedioContactoFallback(contacto: unknown): MedioContacto {
  return {
    email: getContactoField(contacto, 'email') !== null,
    telefono: getContactoField(contacto, 'telefono') !== null,
    whatsapp: false,
    formulario: false,
    chat_vivo: false,
    chatbot_ia: false,
    chatbot_vendor: null,
  };
}

function buildMedioContactoFromScrape(contacto: unknown, content: string, html: string): MedioContacto {
  const emailFromContacto = getContactoField(contacto, 'email') !== null;
  const telefonoFromContacto = getContactoField(contacto, 'telefono') !== null;
  const chatbotIA = detectChatbotIA(content);

  return {
    email: emailFromContacto || /mailto:/i.test(html),
    telefono: telefonoFromContacto || /tel:/i.test(html),
    whatsapp: detectWhatsapp(content),
    formulario: detectFormulario(html),
    chat_vivo: detectChatVivo(content),
    chatbot_ia: chatbotIA.detected,
    chatbot_vendor: chatbotIA.vendor,
  };
}

// --- Construcción del audit por prospecto -----------------------------------

function buildCaseAAudit(prospect: ProspectRow, userId: string): TablesInsert<'audits'> {
  return {
    owner_id: userId,
    prospect_id: prospect.id,
    velocidad: null,
    medio_contacto: buildMedioContactoFallback(prospect.contacto) as unknown as Json,
    funcionalidad_sitio: {
      tipo: 'sin_sitio_web',
      paginas_detectadas: 0,
      tiene_reservas_online: false,
    },
  };
}

async function buildCaseBAudit(
  prospect: ProspectRow,
  web: string,
  userId: string,
  env: Env,
): Promise<TablesInsert<'audits'>> {
  const [velocidadResult, firecrawlResult] = await Promise.allSettled([
    fetchPageSpeed(web, env.PAGESPEED_API_KEY),
    fetchFirecrawl(web, env.FIRECRAWL_API_KEY),
  ]);

  const velocidad: Velocidad =
    velocidadResult.status === 'fulfilled'
      ? velocidadResult.value
      : {
          performance_score: null,
          lcp_ms: null,
          cls: null,
          tbt_ms: null,
          medido_en: new Date().toISOString(),
          error: velocidadResult.reason instanceof Error ? velocidadResult.reason.message : 'error desconocido',
        };

  let medioContacto: MedioContacto;
  let funcionalidadSitio: FuncionalidadSitio;

  if (firecrawlResult.status === 'fulfilled') {
    const { markdown, html } = firecrawlResult.value;
    const content = `${html}\n${markdown}`;
    medioContacto = buildMedioContactoFromScrape(prospect.contacto, content, html);
    const { tipo, paginasDetectadas } = detectSiteType(html, content, web);
    funcionalidadSitio = {
      tipo,
      paginas_detectadas: paginasDetectadas,
      tiene_reservas_online: detectReservasOnline(content),
    };
  } else {
    console.error('[audit-prospects] firecrawl falló', {
      prospectId: prospect.id,
      error: firecrawlResult.reason instanceof Error ? firecrawlResult.reason.message : firecrawlResult.reason,
    });
    medioContacto = buildMedioContactoFallback(prospect.contacto);
    funcionalidadSitio = { tipo: 'landing', paginas_detectadas: 0, tiene_reservas_online: false };
  }

  return {
    owner_id: userId,
    prospect_id: prospect.id,
    velocidad: velocidad as unknown as Json,
    medio_contacto: medioContacto as unknown as Json,
    funcionalidad_sitio: funcionalidadSitio as unknown as Json,
  };
}

// --- Procesamiento por prospecto ---------------------------------------------

type ProspectOutcome =
  | { kind: 'auditado' }
  | { kind: 'sin_web' }
  | { kind: 'error'; motivo: string };

async function processProspect(
  supabaseAdmin: SupabaseClient<Database>,
  prospect: ProspectRow,
  userId: string,
  env: Env,
): Promise<{ prospectId: string; nombreNegocio: string; outcome: ProspectOutcome }> {
  const web = getContactoField(prospect.contacto, 'web');

  const auditInsert = web
    ? await buildCaseBAudit(prospect, web, userId, env)
    : buildCaseAAudit(prospect, userId);

  const { error: insertError } = await supabaseAdmin.from('audits').insert(auditInsert);

  if (insertError) {
    return {
      prospectId: prospect.id,
      nombreNegocio: prospect.nombre_negocio,
      outcome: { kind: 'error', motivo: `No se pudo guardar la auditoría: ${insertError.message}` },
    };
  }

  if (prospect.estado === 'encontrado') {
    const { error: updateError } = await supabaseAdmin
      .from('prospects')
      .update({ estado: 'auditado' })
      .eq('id', prospect.id)
      .eq('estado', 'encontrado');

    if (updateError) {
      // El audit ya se guardó; no tratamos esto como falla del prospecto.
      console.error('[audit-prospects] no se pudo actualizar estado del prospecto', {
        prospectId: prospect.id,
        error: updateError.message,
      });
    }
  }

  return {
    prospectId: prospect.id,
    nombreNegocio: prospect.nombre_negocio,
    outcome: web ? { kind: 'auditado' } : { kind: 'sin_web' },
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

  let body: AuditProspectsBody;
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
    .select('id, nombre_negocio, estado, contacto')
    .in('id', prospectIds)
    .eq('owner_id', userId);

  if (fetchError) {
    return jsonResponse({ error: 'No se pudieron cargar los prospectos.' }, 500);
  }

  const found = foundProspects ?? [];
  const foundIds = new Set(found.map((prospect) => prospect.id));

  const errores: ErrorEntry[] = prospectIds
    .filter((id) => !foundIds.has(id))
    .map((id) => ({
      prospect_id: id,
      nombre_negocio: '(desconocido)',
      motivo: 'No existe o no te pertenece.',
    }));

  const settled = await Promise.allSettled(
    found.map((prospect) => processProspect(supabaseAdmin, prospect, userId, env)),
  );

  let auditados = 0;
  let omitidosSinWeb = 0;

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
    if (outcome.kind === 'auditado') {
      auditados += 1;
    } else if (outcome.kind === 'sin_web') {
      omitidosSinWeb += 1;
    } else {
      errores.push({ prospect_id: prospectId, nombre_negocio: nombreNegocio, motivo: outcome.motivo });
    }
  }

  return jsonResponse(
    {
      procesados: found.length,
      auditados,
      omitidos_sin_web: omitidosSinWeb,
      errores,
    },
    200,
  );
};
