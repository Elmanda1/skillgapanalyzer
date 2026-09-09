import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import {
  Home,
  Sparkles,
  PlayCircle,
  Users,
  Workflow,
  HelpCircle,
  LogIn,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { cn } from '../lib/utils';

const navItems = [
  { id: 'hero', label: 'Beranda', icon: Home },
  { id: 'fitur', label: 'Urgensi', icon: Sparkles },
  { id: 'live-demo', label: 'Simulasi', icon: PlayCircle },
  { id: 'untuk-siapa', label: 'Persona', icon: Users },
  { id: 'cara-kerja', label: 'Alur Kerja', icon: Workflow },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

export default function DynamicFloatingNav({ className }) {
  const [activeIndex, setActiveIndex] = useState(0);
  // Posisi: "top" saat di atas / scroll up, "bottom" saat scroll down
  const [position, setPosition] = useState('top');

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (current) => {
    const prev = scrollY.getPrevious() ?? 0;
    const diff = current - prev;

    // Jika masih dekat paling atas (< 60px), selalu di atas
    if (current < 60) {
      setPosition('top');
    }
    // Jika scroll ke bawah lebih dari ambang batas (diff > 5), pindah ke bawah
    else if (diff > 5) {
      setPosition('bottom');
    }
    // Jika scroll ke atas (diff < -5), kembalikan ke atas
    else if (diff < -5) {
      setPosition('top');
    }
  });

  const handleNavClick = (idx, id) => {
    setActiveIndex(idx);
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(id);
      if (el) {
        const offset = 80;
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
    <div className="fixed inset-x-0 mx-auto z-50 pointer-events-none flex justify-center">
      <AnimatePresence mode="wait">
        <motion.nav
          key={position}
          role="navigation"
          aria-label="Dynamic Navigation"
          initial={
            position === 'top'
              ? { y: -90, opacity: 0, scale: 0.95 }
              : { y: 90, opacity: 0, scale: 0.95 }
          }
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={
            position === 'top'
              ? { y: -90, opacity: 0, scale: 0.95 }
              : { y: 90, opacity: 0, scale: 0.95 }
          }
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className={cn(
            'pointer-events-auto fixed mx-auto bg-white/90 backdrop-blur-xl border border-gray-200/90 rounded-full flex items-center p-1.5 shadow-2xl shadow-emerald-950/10 space-x-1 max-w-[95vw] h-[52px]',
            position === 'top' ? 'top-4' : 'bottom-5',
            className
          )}
        >


          {/* Navigation Items */}
          {navItems.map((item, idx) => {
            const IconComponent = item.icon;
            const isActive = activeIndex === idx;

            return (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  'flex items-center px-3 py-1.5 rounded-full transition-colors duration-200 relative h-9 cursor-pointer',
                  isActive
                    ? 'bg-emerald-900/10 text-emerald-900 font-semibold'
                    : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/70',
                  'focus:outline-hidden'
                )}
                onClick={() => handleNavClick(idx, item.id)}
                aria-label={item.label}
                type="button"
              >
                <IconComponent
                  size={17}
                  strokeWidth={2.2}
                  aria-hidden
                  className={cn(
                    'transition-colors duration-200 flex-shrink-0',
                    isActive ? 'text-emerald-900' : 'text-gray-500'
                  )}
                />
                <motion.div
                  initial={false}
                  animate={{
                    width: isActive ? 'auto' : 0,
                    opacity: isActive ? 1 : 0,
                    marginLeft: isActive ? 6 : 0,
                  }}
                  transition={{
                    width: { type: 'spring', stiffness: 350, damping: 32 },
                    opacity: { duration: 0.18 },
                    marginLeft: { duration: 0.18 },
                  }}
                  className="overflow-hidden flex items-center max-w-[85px]"
                >
                  <span
                    className={cn(
                      'text-xs whitespace-nowrap select-none transition-opacity duration-200 overflow-hidden text-ellipsis leading-none font-semibold',
                      isActive ? 'text-emerald-900' : 'opacity-0'
                    )}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </motion.button>
            );
          })}

          <div className="h-5 w-px bg-gray-200/80 mx-0.5" />

          {/* Login CTA Pill Button */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 gradient-brand-cta text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm hover:opacity-95 transition-opacity ml-1"
          >
            <LogIn size={14} strokeWidth={2.5} />
            <span>Masuk</span>
          </Link>
        </motion.nav>
      </AnimatePresence>
    </div>
  );
}
