import { Link } from 'react-router-dom';
import { MetricCard } from '../components/MetricCard';
import { CampaignCard } from '../components/CampaignCard';
import { ApprovalCard } from '../components/ApprovalCard';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { metricCards, campaigns, approvalDrafts, recentActivity } from '../data/mockData';

export function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.id} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary">Campañas activas</h2>
            <Link to="/campaigns" className="text-xs font-medium text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary">Bandeja de aprobación</h2>
            <Link to="/approvals" className="text-xs font-medium text-accent hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {approvalDrafts.map((draft) => (
              <ApprovalCard key={draft.id} draft={draft} />
            ))}
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-primary">Actividad reciente de Aura</h2>
        <div className="rounded-card border border-border bg-panel p-5">
          <ActivityTimeline items={recentActivity} />
        </div>
      </section>
    </div>
  );
}
