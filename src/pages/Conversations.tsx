import { useConversations } from '@/hooks/queries/useConversations';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export function Conversations() {
  const { data: conversations, isLoading, isError } = useConversations();

  if (isLoading) {
    return <p className="text-sm text-secondary">Cargando conversaciones…</p>;
  }

  if (isError) {
    return <p className="text-sm text-error">No se pudieron cargar las conversaciones.</p>;
  }

  if (!conversations || conversations.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay conversaciones"
        description="Acá vas a poder seguir en tiempo real las conversaciones que Aura sostiene con cada prospecto."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {conversations.map((conversation) => (
        <Card key={conversation.id} hoverable>
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary">{conversation.canal}</span>
            <Badge variant={conversation.estado === 'agendada' ? 'success' : 'neutral'} dot>
              {conversation.estado}
            </Badge>
          </div>
          {conversation.grado_interes ? (
            <p className="mt-2 text-xs text-muted">Interés: {conversation.grado_interes}</p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
