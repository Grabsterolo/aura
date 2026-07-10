import type { ApprovalDraft } from '../data/types';

export function ApprovalCard({ draft }: { draft: ApprovalDraft }) {
  return (
    <div className="rounded-card border border-border bg-panel p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-primary">{draft.businessName}</p>
          <p className="mt-0.5 text-xs text-muted">{draft.industry}</p>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-accent">{draft.angle}</p>
      <p className="mt-2 line-clamp-2 text-sm text-secondary">{draft.preview}</p>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className="rounded-control border border-border px-3 py-1.5 text-xs font-medium text-secondary transition-all duration-150 ease-out hover:border-accent hover:text-primary"
        >
          Ver
        </button>
        <button
          type="button"
          className="rounded-control bg-accent px-3 py-1.5 text-xs font-medium text-white transition-all duration-150 ease-out hover:-translate-y-px hover:bg-accent-hover"
        >
          Aprobar
        </button>
      </div>
    </div>
  );
}
