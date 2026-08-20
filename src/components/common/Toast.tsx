import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useStore } from '../../lib/store';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let borderClass = 'border-emerald-200 bg-white text-zinc-900 shadow-lg shadow-emerald-950/5';
        let iconClass = 'text-emerald-600';

        if (toast.type === 'warning') {
          Icon = AlertCircle;
          borderClass = 'border-amber-200 bg-amber-50/95 text-amber-950 shadow-lg shadow-amber-950/5';
          iconClass = 'text-amber-600';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          borderClass = 'border-rose-200 bg-rose-50/95 text-rose-950 shadow-lg shadow-rose-950/5';
          iconClass = 'text-rose-600';
        } else if (toast.type === 'info') {
          Icon = Info;
          borderClass = 'border-brand-200 bg-brand-50/95 text-brand-950 shadow-lg shadow-brand-950/5';
          iconClass = 'text-brand-700';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border ${borderClass} backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconClass}`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-tight">{toast.title}</h4>
              <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{toast.message}</p>
              {toast.actionLabel && toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction!();
                    removeToast(toast.id);
                  }}
                  className="mt-2 text-xs font-bold text-brand-700 bg-brand-100/80 hover:bg-brand-200/80 px-2.5 py-1 rounded-lg transition-colors inline-block"
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
