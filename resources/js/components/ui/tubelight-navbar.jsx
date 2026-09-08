import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { LogIn } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';

export function NavBar({
  items,
  className,
  defaultActive = 'Beranda',
  showLogin = true,
}) {
  const [activeTab, setActiveTab] = useState(defaultActive);
  const [isHidden, setIsHidden] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const { scrollY } = useScroll();

  // 1. Auto-hide when reaching near the footer or bottom of the page
  useMotionValueEvent(scrollY, 'change', (current) => {
    if (typeof window === 'undefined') return;

    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const scrollBottom = scrollHeight - (current + clientHeight);

    // When scrolled to within 650px of the bottom (footer reveal zone), hide the navbar
    if (scrollBottom < 650) {
      setIsHidden(true);
    } else {
      setIsHidden(false);
    }
  });

  // 2. Scroll Spy: Detect active section as user scrolls
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sectionIds = items.map((item) => item.id || item.url?.replace('#', '')).filter(Boolean);
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible section with highest intersection ratio
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // Sort by intersection ratio or bounding rect top
          const topMost = visible.sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];
          const matchedItem = items.find(
            (item) => (item.id || item.url?.replace('#', '')) === topMost.target.id
          );
          if (matchedItem) {
            setActiveTab(matchedItem.name);
          }
        }
      },
      {
        rootMargin: '-20% 0px -50% 0px',
        threshold: [0, 0.25, 0.5, 0.75],
      }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, [items]);

  const handleTabClick = (item) => {
    setActiveTab(item.name);
    if (item.id === 'hero' || item.url === '#hero' || item.name === 'Home' || item.name === 'Beranda') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (item.id || (item.url && item.url.startsWith('#'))) {
      const targetId = item.id || item.url.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        const offset = 90;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <div className="fixed inset-x-0 top-5 z-50 pointer-events-none flex justify-center px-3 sm:px-6">
      <motion.nav
        role="navigation"
        aria-label="Skill Gap Analyzer Navigation"
        initial={{ y: -80, opacity: 0 }}
        animate={{
          y: isHidden ? -120 : 0,
          opacity: isHidden ? 0 : 1,
          pointerEvents: isHidden ? 'none' : 'auto',
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className={cn(
          'pointer-events-auto flex items-center gap-2 sm:gap-3.5 p-2 sm:p-2.5 px-4 sm:px-6 rounded-full',
          'bg-white/95 dark:bg-slate-950/92 backdrop-blur-2xl',
          'border border-gray-200/90 dark:border-white/10',
          'shadow-2xl shadow-gray-950/15 dark:shadow-black/60',
          'transition-colors duration-300',
          className
        )}
      >
        {/* Authentic Brand Logo - Enlarged */}
        <button
          onClick={() => handleTabClick({ name: 'Beranda', id: 'hero' })}
          className="flex items-center pl-1 sm:pl-2 pr-2 sm:pr-3 py-1 group cursor-pointer focus:outline-none"
          title="Skill Gap Analyzer"
        >
          <BrandLogo className="h-5 sm:h-6 md:h-7 w-auto group-hover:scale-105 transition-transform" />
        </button>

        <div className="h-6 sm:h-7 w-px bg-gray-200 dark:bg-white/10 mx-0.5 sm:mx-1" />

        {/* Navigation Items with Stable Tubelight Indicator - Wider & Larger */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;

            return (
              <button
                key={item.name}
                onClick={() => handleTabClick(item)}
                className={cn(
                  'relative flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer focus:outline-none select-none',
                  isActive
                    ? 'text-emerald-950 dark:text-white font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-white/5'
                )}
              >
                {/* Sliding Active Pill Background */}
                {isActive && (
                  <motion.div
                    layoutId="tubelight-active-pill"
                    className="absolute inset-0 bg-emerald-50 dark:bg-white/10 border border-emerald-200/70 dark:border-white/15 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Tubelight Top Glow Lamp */}
                {isActive && (
                  <motion.div
                    layoutId="tubelight-lamp"
                    className="absolute -top-[3px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  >
                    {/* Ambient Bloom Aura */}
                    <div className="w-8 h-2 bg-emerald-500/25 dark:bg-emerald-400/30 rounded-full blur-xs absolute -top-0.5" />
                    {/* Lamp Core Light Bar */}
                    <div className="w-6 h-[3px] bg-emerald-600 dark:bg-white rounded-t-full shadow-[0_0_6px_rgba(16,185,129,0.7),0_0_12px_rgba(52,211,153,0.4)] relative z-10" />
                    {/* Downward Light Projection */}
                    <div className="w-7 h-2 bg-emerald-500/15 dark:bg-emerald-400/15 blur-2xs rounded-b-full" />
                  </motion.div>
                )}

                {Icon && (
                  <Icon
                    size={16}
                    strokeWidth={2.2}
                    className={cn(
                      'relative z-10 transition-colors flex-shrink-0',
                      isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-400'
                    )}
                  />
                )}
                <span className="relative z-10 leading-none whitespace-nowrap">{item.name}</span>
              </button>
            );
          })}
        </div>

        {showLogin && (
          <>
            <div className="h-6 sm:h-7 w-px bg-gray-200 dark:bg-white/10 mx-0.5 sm:mx-1" />
            <Link
              href="/login"
              className="relative z-10 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.02] active:scale-[0.98] ml-0.5 whitespace-nowrap"
            >
              <LogIn size={15} strokeWidth={2.5} />
              <span>Masuk</span>
            </Link>
          </>
        )}

        <div className="h-6 sm:h-7 w-px bg-gray-200 dark:bg-white/10 mx-0.5 sm:mx-1" />
        <ThemeToggle className="relative z-10 h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-gray-200 dark:border-white/10 bg-gray-100/80 dark:bg-white/10" />
      </motion.nav>
    </div>
  );
}

export default NavBar;
