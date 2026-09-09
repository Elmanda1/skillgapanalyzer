import { useTheme } from '@/hooks/useTheme';
import { t } from '@/lib/i18n';
import { Moon, Sun } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export function ThemeToggle({ className }) {
  const { resolvedTheme, setMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 ${className ?? ''}`} />;
  }

  const isDark = resolvedTheme === 'dark';

  const handleToggle = (e) => {
    const nextTheme = isDark ? 'light' : 'dark';

    if (typeof document === 'undefined' || !('startViewTransition' in document)) {
      setMode(nextTheme);
      return;
    }

    // Measure exact center coordinates from physical button element dynamically
    const vw = Math.max(document.documentElement?.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement?.clientHeight || 0, window.innerHeight || 0);

    const btn = buttonRef.current;
    let x, y;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if (e?.clientX && e.clientX > 0) {
      x = e.clientX;
      y = e.clientY;
    } else {
      x = vw / 2;
      y = 40;
    }

    const endRadius = Math.hypot(
      Math.max(x, vw - x),
      Math.max(y, vh - y)
    );

    // Light -> Dark: expands outwards. Dark -> Light: shrinks inwards into the button.
    const isShrinking = isDark;

    // Suppress competing CSS transitions during view-transition snapshot to prevent jank
    document.documentElement.classList.add('theme-transitioning');
    if (isShrinking) {
      document.documentElement.classList.add('theme-transition-shrink');
    } else {
      document.documentElement.classList.remove('theme-transition-shrink');
    }

    const transition = document.startViewTransition(() => {
      setMode(nextTheme);
    });

    const cleanup = () => {
      document.documentElement.classList.remove('theme-transition-shrink');
      document.documentElement.classList.remove('theme-transitioning');
    };

    transition.ready.then(() => {
      const clipPath = isShrinking
        ? [
            `circle(${endRadius}px at ${x}px ${y}px)`,
            `circle(0px at ${x}px ${y}px)`,
          ]
        : [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];

      const anim = document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 520,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          pseudoElement: isShrinking ? '::view-transition-old(root)' : '::view-transition-new(root)',
        }
      );

      anim.onfinish = cleanup;
      anim.oncancel = cleanup;
    }).catch(cleanup);

    if (transition.finished) {
      transition.finished.finally(cleanup);
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleToggle}
      className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-300 shadow-xs transition-transform duration-200 hover:scale-105 active:scale-95 hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer ${className ?? ''}`}
      aria-label={t('layout.toggleTheme')}
      title={t('layout.toggleTheme')}
    >
      <Sun
        className={`absolute h-4 w-4 text-amber-400 transition-all duration-300 ease-out ${
          isDark
            ? 'scale-0 rotate-90 opacity-0'
            : 'scale-100 rotate-0 opacity-100'
        }`}
      />
      <Moon
        className={`absolute h-4 w-4 text-emerald-400 transition-all duration-300 ease-out ${
          isDark
            ? 'scale-100 rotate-0 opacity-100'
            : 'scale-0 -rotate-90 opacity-0'
        }`}
      />
    </button>
  );
}

export default ThemeToggle;
