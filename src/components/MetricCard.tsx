import { useCountUp } from '../hooks/useCountUp';
import type { MetricCardData } from '../data/types';

export function MetricCard({ label, value, suffix, helper }: MetricCardData) {
  const animatedValue = useCountUp(value);

  return (
    <div className="rounded-card border border-border bg-panel p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent">
      <p className="text-sm text-secondary">{label}</p>
      <p className="mt-2 font-mono text-[28px] font-semibold leading-none text-primary tabular-nums">
        {animatedValue}
        {suffix ?? ''}
      </p>
      <p className="mt-2 text-xs text-muted">{helper}</p>
    </div>
  );
}
