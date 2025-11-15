import * as React from 'react';
import { cn } from '../../lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function I({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-sage-300 bg-white px-3 py-2 text-sm',
        'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sage-500',
        className
      )}
      {...props}
    />
  );
});