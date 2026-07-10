import type { CampaignStatus } from '@/data/types';
import { Badge } from '@/components/ui/Badge';

const statusConfig: Record<CampaignStatus, { label: string; variant: 'success' | 'warning'; pulse: boolean }> = {
  activa: {
    label: 'Activa',
    variant: 'success',
    pulse: true,
  },
  en_curso: {
    label: 'En curso',
    variant: 'success',
    pulse: true,
  },
  pausada: {
    label: 'Pausada',
    variant: 'warning',
    pulse: false,
  },
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} dot pulse={config.pulse}>
      {config.label}
    </Badge>
  );
}
