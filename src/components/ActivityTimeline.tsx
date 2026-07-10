import { CalendarCheck, PenLine, Sparkles } from 'lucide-react';
import type { ActivityItem, ActivityType } from '../data/types';

const iconByType: Record<ActivityType, typeof CalendarCheck> = {
  call_agendada: CalendarCheck,
  interes_calificado: Sparkles,
  borrador_redactado: PenLine,
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((item, index) => {
        const Icon = iconByType[item.type];
        const isLast = index === items.length - 1;

        return (
          <li key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-page text-accent">
                <Icon size={14} strokeWidth={2} />
              </span>
              {!isLast && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className={`min-w-0 pb-5 ${isLast ? 'pb-0' : ''}`}>
              <p className="text-sm text-primary">
                <span className="font-medium">{item.prospectName}</span>
                <span className="text-muted"> · {item.businessName}</span>
              </p>
              <p className="mt-0.5 text-sm text-secondary">{item.description}</p>
              <p className="mt-1 text-xs text-muted">{item.timeAgo}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
