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

    // Always measure exact physical center of the toggle button element
    const btn = buttonRef.current;
    let x = window.innerWidth / 2;
    let y = 40;

    if (btn) {
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    } else if (e?.clientX && e.clientX > 0) {
      x = e.clientX;
      y = e.clientY;
    }

    const vw = Math.max(document.documentElement?.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement?.clientHeight || 0, window.innerHeight || 0);

    const endRadius = Math.hypot(
      Math.max(x, vw - x),
      Math.max(y, vh - y)
    );

    // Suppress competing CSS transitions during view-transition snapshot to prevent jank
    document.documentElement.classList.add('theme-transitioning');

    const transition = document.startViewTransition(() => {
      setMode(nextTheme);
    });

    const cleanup = () => {
      document.documentElement.classList.remove('theme-transitioning');
    };

    transition.ready.then(() => {
      const anim = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 480,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
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
