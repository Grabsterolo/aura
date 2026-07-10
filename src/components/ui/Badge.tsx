import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-live-soft text-live',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-error-soft text-error',
  neutral: 'bg-border/60 text-secondary',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  variant = 'neutral',
  dot = false,
  pulse = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span className={cn('h-1.5 w-1.5 rounded-full bg-current', pulse && 'animate-pulse-live')} />
      ) : null}
      {children}
    </span>
  );
}
