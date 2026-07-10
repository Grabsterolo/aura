export type CampaignStatus = 'activa' | 'en_curso' | 'pausada';

export interface Campaign {
  id: string;
  name: string;
  industry: string;
  status: CampaignStatus;
  prospectsCount: number;
  repliesCount: number;
  auditProgress: number;
}

export interface ApprovalDraft {
  id: string;
  businessName: string;
  industry: string;
  angle: string;
  preview: string;
}

export type ActivityType = 'call_agendada' | 'interes_calificado' | 'borrador_redactado';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  prospectName: string;
  businessName: string;
  description: string;
  timeAgo: string;
}

export interface MetricCardData {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  helper: string;
}
