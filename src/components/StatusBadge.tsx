import type { CampaignStatus } from '../data/types';

const statusConfig: Record<CampaignStatus, { label: string; dot: boolean; className: string }> = {
  activa: {
    label: 'Activa',
    dot: true,
    className: 'bg-live-soft text-live',
  },
  en_curso: {
    label: 'En curso',
    dot: true,
    className: 'bg-live-soft text-live',
  },
  pausada: {
    label: 'Pausada',
    dot: false,
    className: 'bg-warning-soft text-warning',
  },
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full bg-current ${config.dot ? 'animate-pulse-live' : ''}`}
      />
      {config.label}
    </span>
  );
}
