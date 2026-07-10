import type { ActivityItem, ApprovalDraft, Campaign, MetricCardData } from './types';

export const activeCampaignName = 'Clínicas dentales — GAM Q3';

export const metricCards: MetricCardData[] = [
  {
    id: 'prospectos-activos',
    label: 'Prospectos activos',
    value: 342,
    helper: '+18 esta semana',
  },
  {
    id: 'borradores-pendientes',
    label: 'Borradores pendientes',
    value: 12,
    helper: 'En bandeja de aprobación',
  },
  {
    id: 'tasa-apertura',
    label: 'Tasa de apertura',
    value: 47,
    suffix: '%',
    helper: 'Promedio últimos 7 días',
  },
  {
    id: 'calls-agendadas',
    label: 'Calls agendadas',
    value: 26,
    helper: 'Este mes',
  },
];

export const campaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Clínicas dentales — GAM Q3',
    industry: 'Clínicas dentales',
    status: 'en_curso',
    prospectsCount: 128,
    repliesCount: 34,
    auditProgress: 72,
  },
  {
    id: 'camp-2',
    name: 'Talleres mecánicos — Cartago',
    industry: 'Talleres mecánicos',
    status: 'activa',
    prospectsCount: 96,
    repliesCount: 21,
    auditProgress: 45,
  },
  {
    id: 'camp-3',
    name: 'Ópticas — Heredia y Alajuela',
    industry: 'Ópticas',
    status: 'pausada',
    prospectsCount: 58,
    repliesCount: 9,
    auditProgress: 100,
  },
  {
    id: 'camp-4',
    name: 'Veterinarias — Zona Sur',
    industry: 'Veterinarias',
    status: 'en_curso',
    prospectsCount: 60,
    repliesCount: 14,
    auditProgress: 30,
  },
];

export const approvalDrafts: ApprovalDraft[] = [
  {
    id: 'draft-1',
    businessName: 'Clínica Dental Sonrisa Pura',
    industry: 'Clínica dental',
    angle: 'Ángulo: recordatorios automáticos de citas',
    preview:
      'Hola equipo de Sonrisa Pura, notamos que agendan citas manualmente por WhatsApp. Podríamos automatizar los recordatorios para reducir las ausencias...',
  },
  {
    id: 'draft-2',
    businessName: 'Taller Mecánico Rojas Hnos.',
    industry: 'Taller mecánico',
    angle: 'Ángulo: seguimiento post-servicio',
    preview:
      'Hola don Manuel, vimos que Taller Rojas tiene excelentes reseñas en Google. Un seguimiento automático post-servicio podría ayudarles a conseguir más recomendaciones...',
  },
  {
    id: 'draft-3',
    businessName: 'Óptica Visión Clara',
    industry: 'Óptica',
    angle: 'Ángulo: campaña de revisión anual',
    preview:
      'Hola equipo de Visión Clara, muchos de sus clientes ya cumplieron un año desde su última revisión. Una campaña automática de recordatorio podría traer...',
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'call_agendada',
    prospectName: 'Marco Jiménez',
    businessName: 'Clínica Dental Sonrisa Pura',
    description: 'Aura agendó una call de descubrimiento para el jueves 10am',
    timeAgo: 'hace 12 min',
  },
  {
    id: 'act-2',
    type: 'interes_calificado',
    prospectName: 'Laura Vargas',
    businessName: 'Óptica Visión Clara',
    description: 'Aura calificó el interés como alto tras responder al primer mensaje',
    timeAgo: 'hace 38 min',
  },
  {
    id: 'act-3',
    type: 'borrador_redactado',
    prospectName: 'Manuel Rojas',
    businessName: 'Taller Mecánico Rojas Hnos.',
    description: 'Aura redactó un borrador de primer contacto con ángulo de seguimiento post-servicio',
    timeAgo: 'hace 1 h',
  },
  {
    id: 'act-4',
    type: 'call_agendada',
    prospectName: 'Sofía Chacón',
    businessName: 'Veterinaria Zona Sur',
    description: 'Aura agendó una call de seguimiento para mañana 2pm',
    timeAgo: 'hace 2 h',
  },
  {
    id: 'act-5',
    type: 'interes_calificado',
    prospectName: 'Diego Salas',
    businessName: 'Clínica Dental Sonrisa Pura',
    description: 'Aura calificó el interés como medio, requiere seguimiento manual',
    timeAgo: 'hace 3 h',
  },
];

export const pendingApprovalsCount = approvalDrafts.length + 9;
