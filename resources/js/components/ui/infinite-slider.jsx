import React from 'react';
import { cn } from '@/lib/utils';

export function InfiniteSlider({
  items,
  speed = 30,
  direction = 'left',
  pauseOnHover = true,
  className,
}) {
  return (
    <div
      className={cn(
        'group relative flex overflow-hidden p-2 select-none',
        className
      )}
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      }}
    >
      <div
        className={cn(
          'flex min-w-full shrink-0 items-center justify-around gap-8 py-2 animate-marquee',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
          direction === 'right' && 'direction-reverse'
        )}
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {items.map((item, idx) => (
          <div key={`item-1-${idx}`} className="flex-shrink-0">
            {item}
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        className={cn(
          'flex min-w-full shrink-0 items-center justify-around gap-8 py-2 animate-marquee',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
          direction === 'right' && 'direction-reverse'
        )}
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        {items.map((item, idx) => (
          <div key={`item-2-${idx}`} className="flex-shrink-0">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default InfiniteSlider;
