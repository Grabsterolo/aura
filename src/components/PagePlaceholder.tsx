export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-card border border-border bg-panel px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-secondary">{description}</p>
      <span className="mt-6 rounded-control border border-border px-3 py-1 text-xs font-medium text-muted">
        Próximamente
      </span>
    </div>
  );
}
