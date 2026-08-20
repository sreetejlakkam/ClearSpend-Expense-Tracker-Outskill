import React from 'react';
import { ChevronLeft, ChevronRight, ShieldAlert, Sparkles } from 'lucide-react';
import { useStore } from '../../lib/store';

export const Header: React.FC = () => {
  const {
    selectedDate,
    changeMonth,
    pendingReviewCount,
    setActiveTab,
    activeTab,
    profile,
  } = useStore();

  const monthName = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-zinc-200/80 transition-all">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* App Title / Brand */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-700 text-white flex items-center justify-center shadow-sm shadow-brand-700/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-zinc-900 flex items-center gap-1.5">
                ClearSpend
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200/60">
                  AI Coach
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Month Switcher */}
        <div className="flex items-center gap-1 bg-zinc-100/90 border border-zinc-200/70 rounded-xl p-1 shadow-xs">
          <button
            onClick={() => changeMonth(-1)}
            className="p-1 rounded-lg hover:bg-white text-zinc-600 hover:text-zinc-900 transition-colors"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-semibold text-zinc-800 px-2 select-none min-w-[105px] text-center">
            {monthName}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-1 rounded-lg hover:bg-white text-zinc-600 hover:text-zinc-900 transition-colors"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Review Inbox Alert Button */}
          {pendingReviewCount > 0 && (
            <button
              onClick={() => setActiveTab('review')}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'review'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
              title="Items in Review Inbox"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Review</span>
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-amber-600 text-white">
                {pendingReviewCount}
              </span>
            </button>
          )}

          {/* Currency Pill / Settings trigger */}
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 text-xs font-medium border border-zinc-200/70 transition-colors"
          >
            <span className="font-semibold text-brand-700">{profile?.base_currency === 'INR' ? '₹ INR' : profile?.base_currency}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
