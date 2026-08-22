import React from 'react';
import { Layers } from 'lucide-react';
import { useStore } from '../../lib/store';

export const CommittedMoneyCard: React.FC = () => {
  const { transactions, recurringItems, goals, profile, selectedMonthStr } = useStore();

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  // Total Income this month
  const monthlyIncome = transactions
    .filter((t) => t.status === 'active' && t.kind === 'income' && t.txn_date.startsWith(selectedMonthStr))
    .reduce((sum, t) => sum + t.amount, 0) || 85000; // Fallback to baseline salary estimate

  // Committed Fixed Subscriptions
  const committedSubscriptions = recurringItems
    .filter((r) => r.is_active)
    .reduce((sum, r) => sum + r.amount, 0);

  // Savings Goals Monthly Allocations
  const savingsGoalsMonthly = goals
    .filter((g) => !g.is_paused)
    .reduce((sum, g) => sum + Number(g.monthly_contribution || 0), 0);

  // Discretionary / Free Money Pool
  const totalCommitted = committedSubscriptions + savingsGoalsMonthly;
  const freeMoney = Math.max(0, monthlyIncome - totalCommitted);

  const committedPct = Math.min(100, Math.round((committedSubscriptions / monthlyIncome) * 100)) || 0;
  const savingsPct = Math.min(100, Math.round((savingsGoalsMonthly / monthlyIncome) * 100)) || 0;
  const freePct = Math.max(0, 100 - committedPct - savingsPct);

  return (
    <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Committed vs Free Money
            </h3>
            <p className="text-[11px] text-slate-400">
              50/30/20 Rule Breakdown on {currSym}{monthlyIncome.toLocaleString()} Monthly Cashflow
            </p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {freePct}% Discretionary
        </span>
      </div>

      {/* Multi-Segment Allocation Bar */}
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${committedPct}%` }}
            className="bg-indigo-600 h-full transition-all duration-300"
            title={`Fixed Needs: ${committedPct}%`}
          />
          <div
            style={{ width: `${savingsPct}%` }}
            className="bg-emerald-500 h-full transition-all duration-300"
            title={`Savings Goals: ${savingsPct}%`}
          />
          <div
            style={{ width: `${freePct}%` }}
            className="bg-brand-400 h-full transition-all duration-300"
            title={`Free Discretionary: ${freePct}%`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-0.5">
          <span>0%</span>
          <span>50% Target Needs</span>
          <span>100% Total Income</span>
        </div>
      </div>

      {/* 3 Value Pillars Grid */}
      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
          <div className="flex items-center justify-center gap-1 text-indigo-700 dark:text-indigo-300 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span className="text-[10px] font-extrabold uppercase">Fixed Needs</span>
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums block">
            {currSym}{committedSubscriptions.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">{committedPct}% of income</span>
        </div>

        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
          <div className="flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-300 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-extrabold uppercase">Savings Goals</span>
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums block">
            {currSym}{savingsGoalsMonthly.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">{savingsPct}% of income</span>
        </div>

        <div className="p-3 bg-brand-50/50 dark:bg-brand-950/30 rounded-2xl border border-brand-100 dark:border-brand-900/50">
          <div className="flex items-center justify-center gap-1 text-brand-700 dark:text-brand-300 mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <span className="text-[10px] font-extrabold uppercase">True Free Pool</span>
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums block">
            {currSym}{freeMoney.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">{freePct}% discretionary</span>
        </div>
      </div>
    </div>
  );
};
