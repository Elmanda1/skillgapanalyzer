import * as React from 'react';
import { cn } from '@/lib/utils';

export const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

    const variants = {
      default:
        'bg-emerald-800 text-white hover:bg-emerald-700 shadow-md shadow-emerald-950/10 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200',
      outline:
        'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900',
      ghost:
        'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-11 px-8 text-base',
      icon: 'h-9 w-9',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseStyles, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
