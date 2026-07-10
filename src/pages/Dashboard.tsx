import { Link } from 'react-router-dom';
import { useCampaigns } from '@/hooks/queries/useCampaigns';
import { useProspects } from '@/hooks/queries/useProspects';
import { useApprovalQueue } from '@/hooks/queries/useApprovalQueue';
import { useConversations } from '@/hooks/queries/useConversations';
import { MetricCard, type MetricCardProps } from '@/components/MetricCard';
import { CampaignCard } from '@/components/CampaignCard';
import { EmptyState } from '@/components/ui/EmptyState';

const MAX_CAMPAIGNS_SHOWN = 4;

export function Dashboard() {
  const { data: campaigns } = useCampaigns();
  const { data: prospects } = useProspects();
  const { data: approvalQueue } = useApprovalQueue();
  const { data: conversations } = useConversations();

  const metrics: (MetricCardProps & { id: string })[] = [
    {
      id: 'campanias',
      label: 'Campañas',
      value: campaigns?.length ?? 0,
      helper: 'Total',
    },
    {
      id: 'prospectos',
      label: 'Prospectos',
      value: prospects?.length ?? 0,
      helper: 'En todas las campañas',
    },
    {
      id: 'borradores-pendientes',
      label: 'Borradores pendientes',
      value: approvalQueue?.length ?? 0,
      helper: 'En bandeja de aprobación',
    },
    {
      id: 'calls-agendadas',
      label: 'Calls agendadas',
      value: conversations?.filter((conversation) => conversation.estado === 'agendada').length ?? 0,
      helper: 'Conversaciones agendadas',
    },
  ];

  const visibleCampaigns = campaigns?.slice(0, MAX_CAMPAIGNS_SHOWN) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ id, ...metric }) => (
          <MetricCard key={id} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary">Campañas activas</h2>
            {campaigns && campaigns.length > MAX_CAMPAIGNS_SHOWN ? (
              <Link to="/campaigns" className="text-xs font-medium text-accent hover:underline">
                Ver todas
              </Link>
            ) : null}
          </div>
          {visibleCampaigns.length > 0 ? (
            <div className="flex flex-col gap-3">
              {visibleCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Todavía no tenés campañas"
              description="Creá tu primera campaña desde la sección Campañas."
            />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-primary">Bandeja de aprobación</h2>
          <EmptyState
            title="No hay borradores pendientes"
            description="Cuando Aura redacte un borrador, aparece acá para que lo apruebes."
          />
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-primary">Actividad reciente de Aura</h2>
        <EmptyState
          title="Todavía no hay actividad"
          description="Acá vas a ver lo que Aura va haciendo: calls agendadas, interés calificado, borradores redactados."
        />
      </section>
    </div>
  );
}
