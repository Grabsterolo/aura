import { useCountUp } from '@/hooks/useCountUp';
import { Card } from '@/components/ui/Card';

export interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  helper: string;
}

export function MetricCard({ label, value, suffix, helper }: MetricCardProps) {
  const animatedValue = useCountUp(value);

  return (
    <Card hoverable>
      <p className="text-sm text-secondary">{label}</p>
      <p className="mt-2 font-mono text-[28px] font-semibold leading-none text-primary tabular-nums">
        {animatedValue}
        {suffix ?? ''}
      </p>
      <p className="mt-2 text-xs text-muted">{helper}</p>
    </Card>
  );
}
