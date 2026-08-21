import React, { useState, useMemo } from 'react';
import { useStore } from '../../lib/store';
import { CategoryIcon } from '../common/CategoryIcon';
import { Modal } from '../common/Modal';
import {
  PiggyBank,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  TrendingUp,
  BarChart3,
  SlidersHorizontal,
  Coins,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Budget } from '../../types';
import { useTranslation } from '../../lib/i18n';

export const BudgetsView: React.FC = () => {
  const {
    budgets,
    categories,
    transactions,
    selectedMonthStr,
    selectedDate,
    profile,
    addBudget,
    updateBudget,
    deleteBudget,
    getCategory3MonthAverage,
    setActiveTab,
  } = useStore();

  const { t } = useTranslation();

  const [activeSubTab, setActiveSubTab] = useState<'envelopes' | 'infographics' | 'simulator'>('envelopes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [alertThreshold, setAlertThreshold] = useState<number>(80);

  // Simulator State
  const [simulatorAdjustment, setSimulatorAdjustment] = useState<number>(0); // -30% to +30%

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  // Days in selected month
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const daysElapsed = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 1);

  // Filter expense transactions for this month
  const monthExpenses = useMemo(() => {
    return transactions.filter(
      (t) => t.status === 'active' && t.kind === 'expense' && t.txn_date.startsWith(selectedMonthStr)
    );
  }, [transactions, selectedMonthStr]);

  // Aggregate totals
  const totalBudgeted = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.amount, 0);
  }, [budgets]);

  const totalSpentOnBudgeted = useMemo(() => {
    const budgetedCatIds = new Set(budgets.map((b) => b.category_id).filter(Boolean));
    return monthExpenses
      .filter((t) => budgetedCatIds.has(t.category_id))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [budgets, monthExpenses]);

  const overallPct = totalBudgeted > 0 ? (totalSpentOnBudgeted / totalBudgeted) * 100 : 0;
  const remainingTotalBudget = Math.max(totalBudgeted - totalSpentOnBudgeted, 0);
  const totalDailyTarget = Math.round(remainingTotalBudget / daysRemaining);
  const currentDailyBurn = Math.round(totalSpentOnBudgeted / Math.max(daysElapsed, 1));

  // Chart data for Infographics
  const chartData = useMemo(() => {
    return budgets.map((b) => {
      const cat = categories.find((c) => c.id === b.category_id);
      const spent = monthExpenses
        .filter((t) => t.category_id === b.category_id)
        .reduce((sum, t) => sum + t.amount, 0);
      const projected = daysElapsed > 0 ? Math.round((spent / daysElapsed) * daysInMonth) : spent;
      return {
        name: cat?.name || 'Overall',
        shortName: (cat?.name || 'Cat').slice(0, 8),
        budget: b.amount,
        spent: spent,
        projected: projected,
        color: cat?.color || '#4F46E5',
        isOver: spent > b.amount,
      };
    });
  }, [budgets, categories, monthExpenses, daysElapsed, daysInMonth]);

  // 50/30/20 Needs vs Wants breakdown for budgets
  const budgetRatio = useMemo(() => {
    let needs = 0;
    let wants = 0;
    for (const b of budgets) {
      const cat = categories.find((c) => c.id === b.category_id);
      const name = (cat?.name || '').toLowerCase();
      if (
        name.includes('rent') ||
        name.includes('grocer') ||
        name.includes('transport') ||
        name.includes('fuel') ||
        name.includes('bill') ||
        name.includes('health') ||
        name.includes('medic') ||
        name.includes('util')
      ) {
        needs += b.amount;
      } else {
        wants += b.amount;
      }
    }
    const total = needs + wants;
    return {
      needs,
      wants,
      needsPct: total > 0 ? Math.round((needs / total) * 100) : 50,
      wantsPct: total > 0 ? Math.round((wants / total) * 100) : 50,
    };
  }, [budgets, categories]);

  // Quick adjust inline budget amount (+/- 500)
  const handleQuickAdjust = async (b: Budget, delta: number) => {
    const newAmount = Math.max(b.amount + delta, 500);
    await updateBudget(b.id, {
      amount: newAmount,
    });
  };

  // Handle open create/edit modal
  const handleOpenCreate = () => {
    setEditingBudget(null);
    const existingCatIds = new Set(budgets.map((b) => b.category_id));
    const availableCat = categories.find((c) => c.kind === 'expense' && !existingCatIds.has(c.id)) || categories.find((c) => c.kind === 'expense');
    const firstCatId = availableCat ? availableCat.id : '';
    setSelectedCatId(firstCatId);
    if (firstCatId) {
      const avg = getCategory3MonthAverage(firstCatId);
      setAmount(avg > 0 ? avg.toString() : '5000');
    } else {
      setAmount('5000');
    }
    setAlertThreshold(80);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setSelectedCatId(b.category_id || '');
    setAmount(b.amount.toString());
    setAlertThreshold(b.alert_threshold || 80);
    setIsModalOpen(true);
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCatId(catId);
    if (!editingBudget) {
      const avg = getCategory3MonthAverage(catId);
      if (avg > 0) setAmount(avg.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (editingBudget) {
      await updateBudget(editingBudget.id, {
        category_id: selectedCatId || null,
        amount: parsedAmount,
        alert_threshold: alertThreshold,
      });
    } else {
      await addBudget({
        category_id: selectedCatId || null,
        period: 'monthly',
        amount: parsedAmount,
        start_month: `${selectedMonthStr}-01`,
        alert_threshold: alertThreshold,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this category budget envelope?')) {
      await deleteBudget(id);
    }
  };

  const suggestedAverage = selectedCatId ? getCategory3MonthAverage(selectedCatId) : 0;

  return (
    <div className="w-full max-w-full overflow-hidden space-y-4 pb-28">
      {/* Header with Title & Action */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
            {t('budgets.title', 'Monthly Budget Envelopes')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Intelligent envelope limits, proactive burn rate & velocity control
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-md shadow-brand-700/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Set Envelope</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* 1. Master Budget Health Infographic Card */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-500/30 text-brand-200 border border-brand-400/30">
                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                overallPct > 100
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-400/30'
                  : overallPct >= 80
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-400/30'
                  : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/30'
              }`}>
                {overallPct > 100 ? 'Over Budget' : overallPct >= 80 ? 'Caution Zone' : 'Healthy Pace'}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-white">
                {currSym}{totalSpentOnBudgeted.toLocaleString()}
              </span>
              <span className="text-sm text-slate-400 font-semibold">
                / {currSym}{totalBudgeted.toLocaleString()} budgeted
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Remaining Envelope Pool: <strong className="text-emerald-300">{currSym}{remainingTotalBudget.toLocaleString()}</strong> across {budgets.length} envelopes
            </p>
          </div>

          {/* Daily Burn Gauge Info */}
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shrink-0 min-w-[150px] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>Safe Daily Target:</span>
              <strong className="text-white tabular-nums">{currSym}{totalDailyTarget}/d</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>Actual Burn Rate:</span>
              <strong className={`tabular-nums ${currentDailyBurn > totalDailyTarget ? 'text-rose-300' : 'text-emerald-300'}`}>
                {currSym}{currentDailyBurn}/d
              </strong>
            </div>
            <div className="text-[10px] text-slate-400 font-medium pt-0.5 border-t border-white/10">
              {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining in month
            </div>
          </div>
        </div>

        {/* Global Multi-Color Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallPct > 100
                  ? 'bg-gradient-to-r from-rose-500 to-red-600'
                  : overallPct >= 80
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                  : 'bg-gradient-to-r from-emerald-400 to-teal-500'
              }`}
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-slate-400">
            <span>{Math.round(overallPct)}% Utilized</span>
            <span>{overallPct >= 100 ? '0% Remaining' : `${Math.round(100 - overallPct)}% Remaining`}</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive View Switcher Tabs */}
      <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700">
        <button
          onClick={() => setActiveSubTab('envelopes')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'envelopes'
              ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <PiggyBank className="w-3.5 h-3.5" />
          <span>Envelopes ({budgets.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('infographics')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'infographics'
              ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Visual Infographics</span>
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'simulator'
              ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Pacing Simulator</span>
        </button>
      </div>

      {/* 3A. TAB 1: Envelopes Cards View */}
      {activeSubTab === 'envelopes' && (
        <div className="space-y-3">
          {budgets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {budgets.map((b) => {
                const cat = categories.find((c) => c.id === b.category_id);
                const spent = monthExpenses
                  .filter((t) => t.category_id === b.category_id)
                  .reduce((sum, t) => sum + t.amount, 0);

                const pct = (spent / b.amount) * 100;
                const remaining = Math.max(b.amount - spent, 0);
                const dailyCap = Math.round(remaining / daysRemaining);
                const projected = daysElapsed > 0 ? (spent / daysElapsed) * daysInMonth : spent;
                const isOverBudget = spent > b.amount;
                const isWarning = pct >= b.alert_threshold && !isOverBudget;

                return (
                  <div
                    key={b.id}
                    className={`p-4 bg-white dark:bg-surface-dark rounded-3xl border shadow-card space-y-3 transition-all ${
                      isOverBudget
                        ? 'border-rose-300 dark:border-rose-800 ring-2 ring-rose-100 dark:ring-rose-950'
                        : isWarning
                        ? 'border-amber-300 dark:border-amber-800'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cat?.color || '#4F46E5'}18` }}
                        >
                          <CategoryIcon
                            name={cat?.icon || 'PiggyBank'}
                            color={cat?.color || '#4F46E5'}
                            size={20}
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {cat?.name || 'Overall'}
                          </h4>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            {cat?.kind === 'expense' ? 'Expense Envelope' : 'Budget'}
                          </span>
                        </div>
                      </div>

                      {/* Top Action Icons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Envelope"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Spend Metrics */}
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums truncate">
                          {currSym}{spent.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                          {' '}/ {currSym}{b.amount.toLocaleString()}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-black tabular-nums shrink-0 px-2 py-0.5 rounded-lg ${
                          isOverBudget
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                            : isWarning
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {Math.round(pct)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverBudget
                            ? 'bg-rose-600'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-brand-600'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    {/* Target Guidance & Projected Spend */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">
                        Projected: <strong className="text-slate-800 dark:text-slate-200">{currSym}{Math.round(projected).toLocaleString()}</strong>
                      </span>
                      <span
                        className={`font-bold ${
                          isOverBudget
                            ? 'text-rose-600 dark:text-rose-400'
                            : isWarning
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-brand-700 dark:text-brand-400'
                        }`}
                      >
                        {isOverBudget
                          ? `Over by ${currSym}${Math.round(spent - b.amount).toLocaleString()}`
                          : `${currSym}${dailyCap}/day left`}
                      </span>
                    </div>

                    {/* Interactive Quick Re-balance Controls */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        Quick Reallocate:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(b, -500)}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          −{currSym}500
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(b, 500)}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          +{currSym}500
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-surface-dark p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center shadow-card space-y-3">
              <PiggyBank className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No category envelopes set yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Envelope budgeting warns you before your month goes off-track by capping daily limits.
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create First Envelope
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3B. TAB 2: Visual Infographics Analytics View */}
      {activeSubTab === 'infographics' && (
        <div className="space-y-4">
          {/* Infographic 1: Budget vs Actual vs Projected Bar Chart */}
          <div className="p-4 sm:p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Budget Envelope vs. Actual Spend
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Visual comparison across categories
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10.5px]">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" /> Budget
                </span>
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" /> Actual
                </span>
              </div>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="shortName"
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `${currSym}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    formatter={(val: number, name: string) => [
                      `${currSym}${val.toLocaleString()}`,
                      name === 'spent' ? 'Spent So Far' : 'Monthly Budget'
                    ]}
                  />
                  <Bar dataKey="budget" fill="#CBD5E1" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="spent" radius={[4, 4, 0, 0]} barSize={14}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.spent > entry.budget ? '#E11D48' : entry.color || '#4F46E5'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Infographic 2: 50/30/20 Needs vs Wants Allocation Breakdown */}
          <div className="p-4 sm:p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  50/30/20 Budget Health Split
                </h3>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Rule Analysis
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Essential Needs (50% Target)</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{budgetRatio.needsPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${Math.min(budgetRatio.needsPct, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currSym}{budgetRatio.needs.toLocaleString()} allocated to rent, groceries, and essentials.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Discretionary Wants (30% Target)</span>
                  <span className={`text-xs font-black ${budgetRatio.wantsPct > 35 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {budgetRatio.wantsPct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${budgetRatio.wantsPct > 35 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(budgetRatio.wantsPct, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currSym}{budgetRatio.wants.toLocaleString()} allocated to dining, shopping, and fun.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3C. TAB 3: Interactive Pacing & Burn Simulator */}
      {activeSubTab === 'simulator' && (
        <div className="p-4 sm:p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Interactive Expense Pacing Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate the impact of adjusting your discretionary spending pace for the remaining {daysRemaining} days.
            </p>
          </div>

          {/* Slider */}
          <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Adjust Discretionary Pace:</span>
              <span className={`px-2 py-0.5 rounded-md font-mono ${
                simulatorAdjustment < 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : simulatorAdjustment > 0
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
              }`}>
                {simulatorAdjustment > 0 ? `+${simulatorAdjustment}% (Spend More)` : simulatorAdjustment < 0 ? `${simulatorAdjustment}% (Cut Back)` : 'Current Pace'}
              </span>
            </div>

            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              value={simulatorAdjustment}
              onChange={(e) => setSimulatorAdjustment(parseInt(e.target.value))}
              className="w-full accent-brand-700 cursor-pointer"
            />

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>-30% (Aggressive Save)</span>
              <span>0% (Current Burn)</span>
              <span>+30% (Spike)</span>
            </div>
          </div>

          {/* Simulation Outcome Cards */}
          {(() => {
            const adjustedRemainingDaily = totalDailyTarget * (1 + simulatorAdjustment / 100);
            const simulatedMonthlyTotal = totalSpentOnBudgeted + (adjustedRemainingDaily * daysRemaining);
            const savingsDelta = totalBudgeted - simulatedMonthlyTotal;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Simulated Daily Burn</span>
                  <div className="text-base font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {currSym}{Math.round(adjustedRemainingDaily)}/day
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Simulated Month-End Total</span>
                  <div className="text-base font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {currSym}{Math.round(simulatedMonthlyTotal).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Projected Net Savings</span>
                  <div className={`text-base font-black tabular-nums mt-0.5 ${savingsDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {savingsDelta >= 0 ? '+' : ''}{currSym}{Math.round(savingsDelta).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick link to Compounding view */}
          <div
            onClick={() => setActiveTab('compounding')}
            className="cursor-pointer p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-2 hover:bg-emerald-500/15 transition-all group"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Want to invest simulated savings? Check the <strong>Power of Compounding</strong>
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      )}

      {/* Create / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Envelope Budget' : 'Set Category Envelope'}
        subtitle="Control monthly limits and pace warnings"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Category</label>
            <select
              value={selectedCatId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-700 focus:outline-hidden"
            >
              {categories
                .filter((c) => c.kind === 'expense')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Limit ({currSym})
            </label>
            <input
              type="number"
              required
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 8000"
              className="w-full text-xl font-bold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-700 focus:bg-white dark:focus:bg-slate-750 focus:outline-hidden tabular-nums"
            />
            {/* Suggested 3-Month Average Hint */}
            {suggestedAverage > 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                <span>
                  Suggested based on last 3 months average:{' '}
                  <button
                    type="button"
                    onClick={() => setAmount(suggestedAverage.toString())}
                    className="font-bold text-brand-700 dark:text-brand-400 underline hover:text-brand-800"
                  >
                    {currSym}{suggestedAverage.toLocaleString()}/mo
                  </button>
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Alert Threshold ({alertThreshold}%)
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
              className="w-full accent-brand-700 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Turn bar amber when {alertThreshold}% of budget is reached.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm"
            >
              {editingBudget ? 'Save Changes' : 'Create Budget'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
