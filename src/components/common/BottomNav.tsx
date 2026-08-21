import React from 'react';
import { Bot, LayoutGrid, PiggyBank, ReceiptText, Settings, ShieldCheck, TrendingUp } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useTranslation } from '../../lib/i18n';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, pendingReviewCount } = useStore();
  const { t } = useTranslation();

  const navItems = [
    { id: 'dashboard', label: t('nav.overview', 'Overview'), icon: LayoutGrid },
    { id: 'transactions', label: t('nav.ledger', 'Ledger'), icon: ReceiptText },
    { id: 'budgets', label: t('nav.budgets', 'Budgets'), icon: PiggyBank },
    { id: 'compounding', label: t('nav.compounding', 'Growth'), icon: TrendingUp },
    { id: 'finai', label: t('nav.finai', 'FinAI'), icon: Bot },
    {
      id: 'review',
      label: t('nav.review', 'Review'),
      icon: ShieldCheck,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
    { id: 'settings', label: t('nav.accounts', 'Accounts'), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_24px_-4px_rgba(15,23,42,0.08)]">
      <div className="max-w-lg mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all ${
                isActive
                  ? 'bg-brand-50/90 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-extrabold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2.5 bg-amber-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] sm:text-[10px] tracking-tight mt-0.5 truncate max-w-[55px] text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};


