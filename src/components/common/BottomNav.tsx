import React from 'react';
import { LayoutGrid, PiggyBank, ReceiptText, Settings, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '../../lib/store';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, pendingReviewCount } = useStore();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutGrid },
    { id: 'transactions', label: 'Ledger', icon: ReceiptText },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
    { id: 'insights', label: 'Insights', icon: Sparkles },
    {
      id: 'review',
      label: 'Review',
      icon: ShieldCheck,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
    { id: 'settings', label: 'Accounts', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-4px_24px_-4px_rgba(15,23,42,0.08)]">
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'bg-brand-50/90 text-brand-700 font-extrabold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium hover:bg-slate-100/50'
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
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

