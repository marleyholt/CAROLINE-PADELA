import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  // Auto-dismiss após 3 segundos para cada toast
  React.useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => {
        onDismiss(toast.id);
      }, 3000)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [toasts, onDismiss]);

  return (
    <div
      id="toast-container"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-1.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`pointer-events-auto flex items-start gap-2 p-2.5 rounded-md shadow-lg border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800 border-l-3 border-l-emerald-500'
                : toast.type === 'error'
                ? 'bg-slate-900 text-white border-slate-800 border-l-3 border-l-rose-500'
                : 'bg-slate-900 text-white border-slate-800 border-l-3 border-l-sky-500'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs">
              <h4 className="font-semibold text-slate-100">{toast.title}</h4>
              {toast.message && <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{toast.message}</p>}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-0.5 rounded hover:bg-slate-800"
              title="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
