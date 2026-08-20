import React, { createContext, useContext, useState, useCallback } from 'react';
import Icon from '../components/Icon.jsx';


// ─── Types & config ────────────────────────────────────────────────────────
const TOAST_CONFIG = {
  success: { icon: 'check_circle',  bg: 'bg-green-50',  border: 'border-green-200', iconColor: 'text-green-600',  barColor: 'bg-green-500'  },
  error:   { icon: 'error',         bg: 'bg-red-50',    border: 'border-red-200',   iconColor: 'text-red-600',    barColor: 'bg-red-500'    },
  warning: { icon: 'warning',       bg: 'bg-amber-50',  border: 'border-amber-200', iconColor: 'text-amber-600',  barColor: 'bg-amber-500'  },
  info:    { icon: 'info',          bg: 'bg-blue-50',   border: 'border-blue-200',  iconColor: 'text-blue-600',   barColor: 'bg-blue-500'   },
};

// ─── Toast item component ──────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
  const cfg = TOAST_CONFIG[toast.type] ?? TOAST_CONFIG.info;
  return (
    <div
      className={`
        flex items-start gap-3 w-80 rounded-xl border p-4 shadow-lg
        ${cfg.bg} ${cfg.border}
        animate-[slideInRight_0.25s_ease-out]
      `}
    >
      <Icon className={`text-[20px] flex-shrink-0 mt-0.5 ${cfg.iconColor}`} name={cfg.icon} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-gray-900 leading-tight">{toast.title}</p>
        )}
        {toast.message && (
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
      >
        <Icon className="text-[16px]" name="close" />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
        <div
          className={`h-full ${cfg.barColor}`}
          style={{ animation: `shrink ${toast.duration ?? 4000}ms linear forwards` }}
        />
      </div>
    </div>
  );
}

// ─── Container ────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ─── Context & Provider ───────────────────────────────────────────────────
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, title, message, type, duration }]);
    setTimeout(() => removeToast(id), duration + 300);
  }, [removeToast]);

  // Convenience helpers
  const toast = {
    success: (title, message) => addToast({ title, message, type: 'success' }),
    error:   (title, message) => addToast({ title, message, type: 'error' }),
    warning: (title, message) => addToast({ title, message, type: 'warning' }),
    info:    (title, message) => addToast({ title, message, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};
