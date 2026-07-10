import { useApprovalQueue } from '@/hooks/queries/useApprovalQueue';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { formatDate } from '@/lib/formatDate';

const estadoVariant: Record<string, BadgeVariant> = {
  pendiente: 'warning',
  aprobado: 'success',
  rechazado: 'danger',
};

export function Approvals() {
  const { data: approvalQueue, isLoading, isError } = useApprovalQueue();

  if (isLoading) {
    return <p className="text-sm text-secondary">Cargando bandeja de aprobación…</p>;
  }

  if (isError) {
    return <p className="text-sm text-error">No se pudo cargar la bandeja de aprobación.</p>;
  }

  if (!approvalQueue || approvalQueue.length === 0) {
    return (
      <EmptyState
        title="No hay borradores pendientes"
        description="Cuando Aura redacte un borrador, aparece acá para que lo apruebes."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {approvalQueue.map((item) => (
        <Card key={item.id} hoverable>
          <div className="flex items-center justify-between">
            <Badge variant={estadoVariant[item.estado] ?? 'neutral'}>{item.estado}</Badge>
            <span className="text-xs text-muted">{formatDate(item.fecha)}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
