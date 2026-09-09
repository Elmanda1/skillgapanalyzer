import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const AccordionContext = createContext(null);
const AccordionItemContext = createContext(null);

export function Accordion({
  type = 'single',
  collapsible = true,
  defaultValue = null,
  value,
  onValueChange,
  className = '',
  children,
  ...props
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const toggleItem = (itemValue) => {
    let nextValue;
    if (type === 'single') {
      if (currentValue === itemValue) {
        nextValue = collapsible ? null : currentValue;
      } else {
        nextValue = itemValue;
      }
    } else {
      const arr = Array.isArray(currentValue) ? currentValue : [];
      if (arr.includes(itemValue)) {
        nextValue = arr.filter((v) => v !== itemValue);
      } else {
        nextValue = [...arr, itemValue];
      }
    }

    if (!isControlled) {
      setInternalValue(nextValue);
    }
    if (onValueChange) {
      onValueChange(nextValue);
    }
  };

  const isExpanded = (itemValue) => {
    if (type === 'single') {
      return currentValue === itemValue;
    }
    return Array.isArray(currentValue) && currentValue.includes(itemValue);
  };

  return (
    <AccordionContext.Provider value={{ isExpanded, toggleItem }}>
      <div className={`divide-y divide-gray-200 dark:divide-slate-800 ${className}`} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, className = '', children, ...props }) {
  const { isExpanded, toggleItem } = useContext(AccordionContext);
  const open = isExpanded(value);

  return (
    <AccordionItemContext.Provider value={{ value, open, toggle: () => toggleItem(value) }}>
      <div
        className={`border-b border-gray-200 dark:border-slate-800 last:border-b-0 ${className}`}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({ className = '', children, ...props }) {
  const { open, toggle } = useContext(AccordionItemContext);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      className={`flex w-full items-center justify-between py-5 text-left font-display text-base sm:text-lg font-bold text-gray-900 dark:text-white transition-all hover:text-emerald-800 dark:hover:text-emerald-400 cursor-pointer select-none group ${className}`}
      {...props}
    >
      <span className={`pr-4 leading-snug transition-colors ${open ? 'text-emerald-950 dark:text-emerald-300 font-extrabold' : ''}`}>{children}</span>
      <motion.div
        animate={{ rotate: open ? 180 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
          open
            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400'
            : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-700'
        }`}
      >
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </motion.div>
    </button>
  );
}

export function AccordionContent({ className = '', children, ...props }) {
  const { open } = useContext(AccordionItemContext);

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: 'auto',
            opacity: 1,
            transition: {
              height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.25, delay: 0.05 },
            },
          }}
          exit={{
            height: 0,
            opacity: 0,
            transition: {
              height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.15 },
            },
          }}
          className="overflow-hidden"
          {...props}
        >
          <div className={`pb-5 pt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed ${className}`}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
