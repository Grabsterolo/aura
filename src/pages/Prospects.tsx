import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCampaigns } from '@/hooks/queries/useCampaigns';
import { useProspects, type ProspectWithCampaign } from '@/hooks/queries/useProspects';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { OVERPASS_CATEGORIES } from '@/lib/searchCatalog';

interface ProspectGroup {
  key: string;
  title: string;
  prospects: ProspectWithCampaign[];
}

interface ProspectContact {
  telefono: string | null;
  email: string | null;
}

function getCategoryLabel(categoria: string | null): string | null {
  if (!categoria) return null;
  const match = OVERPASS_CATEGORIES.find((category) => category.osmTag === categoria);
  return match ? match.label : categoria;
}

function getContact(contacto: ProspectWithCampaign['contacto']): ProspectContact {
  if (!contacto || typeof contacto !== 'object' || Array.isArray(contacto)) {
    return { telefono: null, email: null };
  }

  const record = contacto as Record<string, unknown>;
  return {
    telefono: typeof record.telefono === 'string' ? record.telefono : null,
    email: typeof record.email === 'string' ? record.email : null,
  };
}

export function Prospects() {
  const { data: campaigns } = useCampaigns();
  const { data: prospects, isLoading, isError } = useProspects();

  const groups = useMemo<ProspectGroup[]>(() => {
    if (!prospects) return [];

    const byCampaign = new Map<string, ProspectWithCampaign[]>();
    const orphans: ProspectWithCampaign[] = [];

    for (const prospect of prospects) {
      if (!prospect.campaign_id) {
        orphans.push(prospect);
        continue;
      }
      const list = byCampaign.get(prospect.campaign_id) ?? [];
      list.push(prospect);
      byCampaign.set(prospect.campaign_id, list);
    }

    const campaignGroups: ProspectGroup[] = (campaigns ?? [])
      .filter((campaign) => byCampaign.has(campaign.id))
      .map((campaign) => ({
        key: campaign.id,
        title: campaign.nombre,
        prospects: byCampaign.get(campaign.id) ?? [],
      }));

    if (orphans.length > 0) {
      campaignGroups.push({ key: 'sin-campana', title: 'Sin campaña', prospects: orphans });
    }

    return campaignGroups;
  }, [campaigns, prospects]);

  if (isLoading) {
    return <p className="text-sm text-secondary">Cargando prospectos…</p>;
  }

  if (isError) {
    return <p className="text-sm text-error">No se pudieron cargar los prospectos.</p>;
  }

  if (!prospects || prospects.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay prospectos"
        description="Acá van a aparecer los negocios que Prospecta encuentre y audite para tus campañas."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <ProspectGroupSection key={group.key} title={group.title} prospects={group.prospects} />
      ))}
    </div>
  );
}

function ProspectGroupSection({ title, prospects }: { title: string; prospects: ProspectWithCampaign[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="group flex w-full items-center gap-2 py-1 text-left"
      >
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted transition-transform duration-150 ease-out group-hover:text-accent ${
            isExpanded ? '' : '-rotate-90'
          }`}
        />
        <span className="text-sm font-semibold text-primary transition-colors duration-150 ease-out group-hover:text-accent">
          {title}
        </span>
        <Badge variant="neutral">{prospects.length}</Badge>
      </button>

      {isExpanded ? (
        <div className="mt-2 flex flex-col gap-3 pl-6">
          {prospects.map((prospect) => {
            const categoryLabel = getCategoryLabel(prospect.categoria);
            const contact = getContact(prospect.contacto);
            const contactLine = [contact.telefono, contact.email].filter(Boolean).join(' · ');

            return (
              <Card key={prospect.id} hoverable>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-primary">{prospect.nombre_negocio}</p>
                  <span className="text-xs text-muted">{prospect.campaigns?.nombre ?? 'Sin campaña'}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {categoryLabel ?? 'Sin categoría'}
                  {prospect.barrio ? ` · ${prospect.barrio}` : ''}
                </p>
                {contactLine ? <p className="mt-1 text-xs text-muted">{contactLine}</p> : null}
                {prospect.lat !== null && prospect.lon !== null ? (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${prospect.lat}&mlon=${prospect.lon}#map=18/${prospect.lat}/${prospect.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
                  >
                    Ver en el mapa
                  </a>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
