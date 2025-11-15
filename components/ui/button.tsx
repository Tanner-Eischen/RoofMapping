import * as React from 'react';
import { cn } from '../../lib/utils';

export type ButtonProps = (React.ButtonHTMLAttributes<HTMLButtonElement> & React.AnchorHTMLAttributes<HTMLAnchorElement>) & {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors';
const variants = {
  default: 'bg-sage-600 text-white hover:bg-sage-700',
  outline: 'border border-sage-300 text-sage-700 hover:bg-sage-50',
  ghost: 'text-sage-700 hover:bg-sage-50',
};
const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({ className, variant = 'default', size = 'md', href, ...props }: ButtonProps) {
  const Component: any = href ? 'a' : 'button';
  return <Component href={href} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}