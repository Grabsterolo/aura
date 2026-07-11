export type ScoreTier = 'alta' | 'media' | 'baja';

export interface ScoreSignals {
  contactable: boolean;
  performance_score: number | null;
  tipo_sitio: string;
  tiene_chatbot_ia: boolean;
  audit_fallo: boolean;
}

export interface CriterioUsado {
  tier: ScoreTier;
  regla: string;
  razon: string;
  senales: ScoreSignals;
}

export interface ScoreResult {
  puntaje: number;
  criterio_usado: CriterioUsado;
}

export interface ScoringProspect {
  contactable: boolean | null;
}

export interface ScoringVelocidad {
  performance_score: number | null;
  error?: string;
}

export interface ScoringMedioContacto {
  chatbot_ia: boolean;
}

export interface ScoringFuncionalidadSitio {
  tipo: string;
  error?: string;
}

export interface ScoringAudit {
  velocidad: ScoringVelocidad | null;
  medio_contacto: ScoringMedioContacto;
  funcionalidad_sitio: ScoringFuncionalidadSitio;
}

const PUNTAJE_POR_TIER: Record<ScoreTier, number> = {
  alta: 90,
  media: 60,
  baja: 20,
};

// Reglas simples y explicables en vez de una formula ponderada: no hay datos reales
// todavia de que angulo de contacto convierte, asi que no se puede calibrar pesos.
// Se evaluan en orden y gana la primera que aplique.
export function scoreProspect(prospect: ScoringProspect, audit: ScoringAudit): ScoreResult {
  const contactable = prospect.contactable === true;
  const performanceScore = audit.velocidad?.performance_score ?? null;
  const tipoSitio = audit.funcionalidad_sitio.tipo;
  const tieneChatbotIA = audit.medio_contacto.chatbot_ia === true;
  const auditFallo = Boolean(audit.funcionalidad_sitio.error) || Boolean(audit.velocidad?.error);

  const senales: ScoreSignals = {
    contactable,
    performance_score: performanceScore,
    tipo_sitio: tipoSitio,
    tiene_chatbot_ia: tieneChatbotIA,
    audit_fallo: auditFallo,
  };

  const result = (tier: ScoreTier, regla: string, razon: string): ScoreResult => ({
    puntaje: PUNTAJE_POR_TIER[tier],
    criterio_usado: { tier, regla, razon, senales },
  });

  if (!contactable) {
    return result(
      'baja',
      'sin_correo',
      'Sin correo de contacto — no puede avanzar sin importar el resto de señales.',
    );
  }

  if (tieneChatbotIA) {
    return result('baja', 'chatbot_existente', 'Ya cuenta con chatbot/asistente IA detectado en su sitio.');
  }

  if (tipoSitio === 'sin_sitio_web') {
    return result('alta', 'sin_sitio_web', 'No tiene sitio web — candidato fuerte para agente de IA o portal.');
  }

  if (auditFallo) {
    return result(
      'alta',
      'sitio_inaccesible',
      'Tiene sitio web tageado pero no se pudo acceder — posible dominio caído o abandonado.',
    );
  }

  if (performanceScore !== null && performanceScore < 50) {
    return result('alta', 'sitio_lento', 'Sitio web con rendimiento bajo (score < 50).');
  }

  if (tipoSitio === 'ecommerce' || tipoSitio === 'portal') {
    return result(
      'baja',
      'sitio_maduro',
      'Sitio ya maduro (ecommerce/portal) — baja probabilidad de necesitar estos servicios.',
    );
  }

  return result('media', 'sin_senal_fuerte', 'Sitio funcional sin oportunidades evidentes detectadas.');
}
