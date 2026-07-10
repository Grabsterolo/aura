import { ThemeToggle } from './ThemeToggle';

export function Topbar({ title }: { title: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
      <h1 className="text-base font-semibold text-primary">{title}</h1>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-white">
          JG
        </div>
      </div>
    </header>
  );
}
