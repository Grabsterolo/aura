import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCampaigns } from '@/hooks/queries/useCampaigns';
import { useProspects, type ProspectWithCampaign } from '@/hooks/queries/useProspects';
import { useAuditProspects } from '@/hooks/queries/useAuditProspects';
import { useScores } from '@/hooks/queries/useScores';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { OVERPASS_CATEGORIES } from '@/lib/searchCatalog';
import type { Score } from '@/types';

const MAX_AUDIT_BATCH = 10;
const MESSAGE_TIMEOUT_MS = 5000;

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

type ScoreTier = 'alta' | 'media' | 'baja';

interface CriterioInfo {
  tier: ScoreTier | null;
  razon: string | null;
}

const TIER_BADGE_VARIANT: Record<ScoreTier, BadgeVariant> = {
  alta: 'success',
  media: 'warning',
  baja: 'neutral',
};

const TIER_LABEL: Record<ScoreTier, string> = {
  alta: 'Prioridad alta',
  media: 'Prioridad media',
  baja: 'Prioridad baja',
};

function getCriterioInfo(criterioUsado: Score['criterio_usado']): CriterioInfo {
  if (!criterioUsado || typeof criterioUsado !== 'object' || Array.isArray(criterioUsado)) {
    return { tier: null, razon: null };
  }

  const record = criterioUsado as Record<string, unknown>;
  const tier = record.tier;
  const razon = record.razon;
  return {
    tier: tier === 'alta' || tier === 'media' || tier === 'baja' ? tier : null,
    razon: typeof razon === 'string' ? razon : null,
  };
}

function useAutoDismiss(message: string | null, setMessage: (value: string | null) => void) {
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(null), MESSAGE_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [message, setMessage]);
}

export function Prospects() {
  const { data: campaigns } = useCampaigns();
  const { data: prospects, isLoading, isError } = useProspects();
  const { data: scores } = useScores();

  const latestScoreByProspect = useMemo(() => {
    const map = new Map<string, Score>();
    for (const score of scores ?? []) {
      if (!map.has(score.prospect_id)) {
        map.set(score.prospect_id, score);
      }
    }
    return map;
  }, [scores]);

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
        <ProspectGroupSection
          key={group.key}
          title={group.title}
          prospects={group.prospects}
          scoresByProspect={latestScoreByProspect}
        />
      ))}
    </div>
  );
}

function ProspectGroupSection({
  title,
  prospects,
  scoresByProspect,
}: {
  title: string;
  prospects: ProspectWithCampaign[];
  scoresByProspect: Map<string, Score>;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [groupMessage, setGroupMessage] = useState<string | null>(null);
  const auditGroup = useAuditProspects();
  useAutoDismiss(groupMessage, setGroupMessage);

  const pending = prospects.filter((prospect) => prospect.estado === 'encontrado');

  const handleAuditPending = () => {
    const batch = pending.slice(0, MAX_AUDIT_BATCH);
    const remaining = pending.length - batch.length;

    auditGroup.mutate(
      batch.map((prospect) => prospect.id),
      {
        onSuccess: (data) => {
          const parts = [`${data.auditados} auditados`];
          if (data.omitidos_sin_web > 0) parts.push(`${data.omitidos_sin_web} sin sitio web`);
          if (data.errores.length > 0) parts.push(`${data.errores.length} con error`);
          if (remaining > 0) parts.push(`${remaining} pendientes`);
          setGroupMessage(`${parts.join(', ')}.`);
        },
        onError: (error) => {
          setGroupMessage(`Error: ${error instanceof Error ? error.message : 'error desconocido'}`);
        },
      },
    );
  };

  return (
    <div>
      <div className="flex w-full items-center gap-2 py-1">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="group flex flex-1 items-center gap-2 text-left"
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

        {pending.length > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={auditGroup.isPending}
            onClick={handleAuditPending}
          >
            {auditGroup.isPending ? 'Auditando…' : `Auditar pendientes (${pending.length})`}
          </Button>
        ) : null}
      </div>

      {groupMessage ? <p className="pl-6 text-xs text-secondary">{groupMessage}</p> : null}

      {isExpanded ? (
        <div className="mt-2 flex flex-col gap-3 pl-6">
          {prospects.map((prospect) => (
            <ProspectCard key={prospect.id} prospect={prospect} score={scoresByProspect.get(prospect.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProspectCard({ prospect, score }: { prospect: ProspectWithCampaign; score?: Score }) {
  const [message, setMessage] = useState<string | null>(null);
  const auditProspect = useAuditProspects();
  useAutoDismiss(message, setMessage);

  const categoryLabel = getCategoryLabel(prospect.categoria);
  const contact = getContact(prospect.contacto);
  const contactLine = [contact.telefono, contact.email].filter(Boolean).join(' · ');
  const criterio = score ? getCriterioInfo(score.criterio_usado) : { tier: null, razon: null };

  const handleAudit = () => {
    auditProspect.mutate([prospect.id], {
      onSuccess: (data) => {
        if (data.errores.length > 0) {
          setMessage(`Error: ${data.errores[0].motivo}`);
        } else if (data.omitidos_sin_web > 0) {
          setMessage('Sin sitio web — auditado igual.');
        } else {
          setMessage('Auditado ✓');
        }
      },
      onError: (error) => {
        setMessage(`Error: ${error instanceof Error ? error.message : 'error desconocido'}`);
      },
    });
  };

  return (
    <Card hoverable>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-primary">{prospect.nombre_negocio}</p>
        <span className="text-xs text-muted">{prospect.campaigns?.nombre ?? 'Sin campaña'}</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {categoryLabel ?? 'Sin categoría'}
        {prospect.barrio ? ` · ${prospect.barrio}` : ''}
      </p>
      {contactLine ? <p className="mt-1 text-xs text-muted">{contactLine}</p> : null}

      {criterio.tier ? (
        <div className="mt-2 flex items-start gap-2">
          <Badge variant={TIER_BADGE_VARIANT[criterio.tier]}>{TIER_LABEL[criterio.tier]}</Badge>
          {criterio.razon ? <p className="text-xs text-muted">{criterio.razon}</p> : null}
        </div>
      ) : null}

      <div className="mt-2 flex items-center gap-3">
        {prospect.lat !== null && prospect.lon !== null ? (
          <a
            href={`https://www.openstreetmap.org/?mlat=${prospect.lat}&mlon=${prospect.lon}#map=18/${prospect.lat}/${prospect.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-accent hover:underline"
          >
            Ver en el mapa
          </a>
        ) : null}
        {prospect.estado === 'encontrado' ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={auditProspect.isPending}
            onClick={handleAudit}
          >
            {auditProspect.isPending ? 'Auditando…' : 'Auditar'}
          </Button>
        ) : null}
      </div>

      {message ? <p className="mt-1 text-xs text-secondary">{message}</p> : null}
    </Card>
  );
}
