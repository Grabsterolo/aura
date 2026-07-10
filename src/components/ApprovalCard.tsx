import type { ApprovalDraft } from '@/data/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function ApprovalCard({ draft }: { draft: ApprovalDraft }) {
  return (
    <Card hoverable>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-primary">{draft.businessName}</p>
          <p className="mt-0.5 text-xs text-muted">{draft.industry}</p>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-accent">{draft.angle}</p>
      <p className="mt-2 line-clamp-2 text-sm text-secondary">{draft.preview}</p>
      <div className="mt-4 flex items-center gap-2">
        <Button variant="secondary" size="sm">
          Ver
        </Button>
        <Button variant="primary" size="sm">
          Aprobar
        </Button>
      </div>
    </Card>
  );
}
