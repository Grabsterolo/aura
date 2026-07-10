import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className, ...props }: InputProps) {
  const input = (
    <input
      id={id}
      className={cn(
        'rounded-control px-3 py-2 text-sm outline-none transition-colors duration-150 ease-out focus:border-accent',
        className,
      )}
      {...props}
    />
  );

  if (!label) {
    return input;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-secondary">
        {label}
      </label>
      {input}
    </div>
  );
}
