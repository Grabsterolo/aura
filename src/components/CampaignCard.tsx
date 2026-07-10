import type { Campaign } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/formatDate';

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Card hoverable>
      <p className="text-sm font-medium text-primary">{campaign.nombre}</p>
      <p className="mt-0.5 text-xs text-muted">
        {campaign.industria ?? 'Sin industria'} · {campaign.zona ?? 'Sin zona'}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <StatusBadge status={campaign.estado} />
        <span className="text-xs text-muted">{formatDate(campaign.creado_en)}</span>
      </div>
    </Card>
  );
}
