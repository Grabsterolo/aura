import { Badge, type BadgeVariant } from '@/components/ui/Badge';

const statusConfig: Record<string, { label: string; variant: BadgeVariant; pulse: boolean }> = {
  activa: { label: 'Activa', variant: 'success', pulse: true },
  en_curso: { label: 'En curso', variant: 'success', pulse: true },
  pausada: { label: 'Pausada', variant: 'warning', pulse: false },
  cerrada: { label: 'Cerrada', variant: 'neutral', pulse: false },
};

function fallbackConfig(status: string) {
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    variant: 'neutral' as const,
    pulse: false,
  };
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? fallbackConfig(status);

  return (
    <Badge variant={config.variant} dot pulse={config.pulse}>
      {config.label}
    </Badge>
  );
}
