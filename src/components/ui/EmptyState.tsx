import type { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from './cn';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <Card
      className={cn(
        'flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-secondary">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}
