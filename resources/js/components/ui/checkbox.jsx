import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export const Checkbox = React.forwardRef(({ className, checked, onChange, ...props }, ref) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
        {...props}
      />
      <div
        className={cn(
          'h-4 w-4 rounded-md border border-gray-300 bg-white peer-checked:bg-emerald-800 peer-checked:border-emerald-800 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 flex items-center justify-center transition-all dark:border-zinc-700 dark:bg-zinc-950 dark:peer-checked:bg-zinc-50 dark:peer-checked:border-zinc-50',
          className
        )}
      >
        <Check className="h-3 w-3 text-white dark:text-zinc-950 opacity-0 peer-checked:opacity-100 transition-opacity" />
      </div>
    </label>
  );
});
Checkbox.displayName = 'Checkbox';
