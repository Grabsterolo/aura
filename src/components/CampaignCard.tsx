import type { Campaign } from '../data/types';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <div className="rounded-card border border-border bg-panel p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-primary">{campaign.name}</p>
          <p className="mt-0.5 text-xs text-muted">{campaign.industry}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="mt-4 flex items-center gap-4 font-mono text-sm text-secondary">
        <span>{campaign.prospectsCount} prospectos</span>
        <span>{campaign.repliesCount} respuestas</span>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
          <span>Auditoría completada</span>
          <span className="font-mono">{campaign.auditProgress}%</span>
        </div>
        <ProgressBar value={campaign.auditProgress} />
      </div>
    </div>
  );
}
