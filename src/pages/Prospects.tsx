import { useProspects } from '@/hooks/queries/useProspects';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

export function Prospects() {
  const { data: prospects, isLoading, isError } = useProspects();

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
    <div className="flex flex-col gap-3">
      {prospects.map((prospect) => (
        <Card key={prospect.id} hoverable>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-primary">{prospect.nombre_negocio}</p>
            <span className="text-xs text-muted">{prospect.campaigns?.nombre ?? 'Sin campaña'}</span>
          </div>
          <p className="mt-1 text-xs text-muted">{prospect.categoria ?? 'Sin categoría'}</p>
        </Card>
      ))}
    </div>
  );
}
