import React from 'react';
import { LayoutGrid, PiggyBank, ReceiptText, Settings, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '../../lib/store';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, pendingReviewCount } = useStore();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutGrid },
    { id: 'transactions', label: 'Ledger', icon: ReceiptText },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
    { id: 'insights', label: 'Insights', icon: Sparkles },
    {
      id: 'review',
      label: 'Review',
      icon: ShieldCheck,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-zinc-200/80 shadow-sticky-bar">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-brand-700 font-bold scale-105'
                  : 'text-zinc-500 hover:text-zinc-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-4 h-0.5 bg-brand-700 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
