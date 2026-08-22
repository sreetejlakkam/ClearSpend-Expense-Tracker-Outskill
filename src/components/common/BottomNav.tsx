import React from 'react';
import { Bot, LayoutGrid, PiggyBank, ReceiptText } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useTranslation } from '../../lib/i18n';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, pendingReviewCount } = useStore();
  const { t } = useTranslation();

  const navItems = [
    { id: 'dashboard', label: t('nav.overview', 'Overview'), icon: LayoutGrid },
    {
      id: 'transactions',
      label: t('nav.ledger', 'Ledger'),
      icon: ReceiptText,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
    { id: 'budgets', label: t('nav.budgets', 'Budgets'), icon: PiggyBank },
    { id: 'finai', label: t('nav.finai', 'FinAI'), icon: Bot, isAi: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_24px_-4px_rgba(15,23,42,0.08)] w-full max-w-full overflow-hidden">
      <div className="max-w-md mx-auto px-3 sm:px-4 py-1.5 sm:py-2 grid grid-cols-4 items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 sm:py-1.5 px-2 rounded-2xl transition-all ${
                isActive
                  ? 'bg-brand-50/90 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-extrabold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'stroke-[2.5px] scale-105 text-brand-700 dark:text-brand-300' : 'stroke-[1.8px]'
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-2.5 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] tracking-tight mt-0.5 truncate text-center leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};



