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
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 transition-all shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* App Title / Brand */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-700 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <Sparkles className="w-4.5 h-4.5 text-indigo-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg leading-tight tracking-tight text-slate-900 flex items-center gap-1.5">
                ClearSpend
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/70 shadow-xs">
                  AI Coach
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Month Switcher */}
        <div className="flex items-center gap-1 bg-slate-100/90 border border-slate-200/80 rounded-2xl p-1 shadow-inner-sm">
          <button
            onClick={() => changeMonth(-1)}
            className="p-1 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-all hover:shadow-xs"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-slate-800 px-2 select-none min-w-[105px] text-center">
            {monthName}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-1 rounded-xl hover:bg-white text-slate-600 hover:text-slate-900 transition-all hover:shadow-xs"
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
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'review'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100'
              }`}
              title="Items in Review Inbox"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Review</span>
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[11px] font-extrabold rounded-full bg-amber-600 text-white shadow-xs">
                {pendingReviewCount}
              </span>
            </button>
          )}

          {/* Currency Pill / Settings trigger */}
          <button
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-all shadow-xs"
          >
            <span className="font-bold text-brand-700">{profile?.base_currency === 'INR' ? '₹ INR' : profile?.base_currency}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

