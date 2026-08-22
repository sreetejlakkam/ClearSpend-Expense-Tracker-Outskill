import React, { useState } from 'react';
import {
  TrendingUp,
  Info,
  AlertTriangle,
  Calendar,
  Layers,
  PiggyBank,
  X,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { calculateSafeToSpend } from '../../lib/pacing';

export const SafeToSpendCard: React.FC = () => {
  const { transactions, budgets, recurringItems, goals, profile, setActiveTab } = useStore();
  const [showExplainer, setShowExplainer] = useState(false);

  const pacing = calculateSafeToSpend(transactions, budgets, recurringItems, goals, new Date());
  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  const statusConfig = {
    comfortable: {
      badgeText: 'Comfortable Pace',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      heroGrad: 'from-emerald-600 to-teal-700',
      dotColor: 'bg-emerald-400',
    },
    moderate: {
      badgeText: 'Moderate Pace',
      badgeClass: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      heroGrad: 'from-brand-700 to-indigo-700',
      dotColor: 'bg-indigo-400',
    },
    tight: {
      badgeText: 'Tighten Up Slightly',
      badgeClass: 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      heroGrad: 'from-amber-600 to-orange-700',
      dotColor: 'bg-amber-400',
    },
    exhausted: {
      badgeText: 'Budget Exhausted',
      badgeClass: 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      heroGrad: 'from-rose-700 to-red-800',
      dotColor: 'bg-rose-400',
    },
  };

  const currentStatus = statusConfig[pacing.status];

  return (
    <>
      <div
        onClick={() => setShowExplainer(true)}
        className="relative overflow-hidden rounded-3xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 shadow-card p-4 sm:p-5 cursor-pointer hover:border-brand-500/50 transition-all group"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Safe To Spend Today
              </span>
              <span className="text-[10px] text-slate-400">
                Day {pacing.currentDay} of {pacing.daysInMonth} ({pacing.daysRemaining} days remaining)
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${currentStatus.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotColor} animate-pulse`} />
            {currentStatus.badgeText}
          </span>
        </div>

        {/* Hero Allowance Number */}
        <div className="mt-3.5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {currSym}{pacing.safeToday.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              / day
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 group-hover:underline">
            <span>How it's calculated</span>
            <Info className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Month Spent: <strong>{currSym}{pacing.spentThisMonth.toLocaleString()}</strong>
          </span>
          <span>
            Remaining Pool: <strong>{currSym}{pacing.remainingBudget.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* Breakdown Explainer Modal */}
      {showExplainer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Safe-To-Spend Calculation
                </h3>
              </div>
              <button
                onClick={() => setShowExplainer(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ClearSpend dynamically recalculates your daily safe spending pace so you never run out of money before month-end.
            </p>

            {/* Step by Step Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Monthly Flexible Budget:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currSym}{pacing.monthlyFlexibleBudget.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Minus Spent This Month:
                </span>
                <span className="font-bold">
                  - {currSym}{pacing.spentThisMonth.toLocaleString()}
                </span>
              </div>

              {pacing.savingsReserved > 0 && (
                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                  <span className="flex items-center gap-1.5">
                    <PiggyBank className="w-3.5 h-3.5" />
                    Minus Goals Reserved:
                  </span>
                  <span className="font-bold">
                    - {currSym}{pacing.savingsReserved.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold">
                <span className="text-slate-800 dark:text-slate-200">Remaining Flexible Pool:</span>
                <span className="text-brand-600 dark:text-brand-400">
                  {currSym}{pacing.remainingBudget.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  Divided by Days Remaining:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ÷ {pacing.daysRemaining} days
                </span>
              </div>
            </div>

            {/* Final Outcome Banner */}
            <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-brand-800 dark:text-brand-300 block">
                  Today's Safe Allowance
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Spend under this to finish the month comfortably
                </span>
              </div>
              <span className="text-lg font-black text-brand-700 dark:text-brand-300 tabular-nums">
                {currSym}{pacing.safeToday.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowExplainer(false);
                  setActiveTab('budgets');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <span>Adjust Budgets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
