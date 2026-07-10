import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ hoverable = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-panel p-4',
        hoverable && 'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent',
        className,
      )}
      {...props}
    />
  );
}
