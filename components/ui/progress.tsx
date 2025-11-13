import * as React from 'react';
import { cn } from '@/lib/utils';

export type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number; // 0..100
};

export function Progress({ value = 0, className, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('h-2 w-full rounded bg-sage-100', className)} {...props}>
      <div className="h-full rounded bg-sage-600" style={{ width: `${clamped}%` }} />
    </div>
  );
}