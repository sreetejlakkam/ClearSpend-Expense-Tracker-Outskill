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
  Layers,
  Calendar,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { Budget } from '../../types';
import { useTranslation } from '../../lib/i18n';
import { CommittedMoneyCard } from './CommittedMoneyCard';
import { RecurringView } from '../recurring/RecurringView';
import { GoalsView } from '../goals/GoalsView';

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
  } = useStore();

  const { t } = useTranslation();

  const [activeSubTab, setActiveSubTab] = useState<'envelopes' | 'infographics' | 'subscriptions' | 'goals' | 'simulator'>('envelopes');
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

  // Current Month Chart Data for Infographics
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

  // Multi-Month Trends (April, May, June, July, August 2026)
  const multiMonthTrends = useMemo(() => {
    const months = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];
    const monthLabels: Record<string, string> = {
      '2026-04': 'Apr 26',
      '2026-05': 'May 26',
      '2026-06': 'Jun 26',
      '2026-07': 'Jul 26',
      '2026-08': 'Aug 26',
    };

    return months.map((mStr) => {
      const activeTxns = transactions.filter((t) => t.status === 'active' && t.txn_date.startsWith(mStr));
      const income = activeTxns.filter((t) => t.kind === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = activeTxns.filter((t) => t.kind === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const savings = Math.max(income - expense, 0);
      const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
      
      const food = activeTxns.filter((t) => t.category_id === 'cat_food').reduce((sum, t) => sum + t.amount, 0);
      const groceries = activeTxns.filter((t) => t.category_id === 'cat_groceries').reduce((sum, t) => sum + t.amount, 0);
      const rent = activeTxns.filter((t) => t.category_id === 'cat_rent').reduce((sum, t) => sum + t.amount, 0);
      const transport = activeTxns.filter((t) => t.category_id === 'cat_transport').reduce((sum, t) => sum + t.amount, 0);
      const shopping = activeTxns.filter((t) => t.category_id === 'cat_shopping').reduce((sum, t) => sum + t.amount, 0);
      const entertainment = activeTxns.filter((t) => t.category_id === 'cat_entertainment').reduce((sum, t) => sum + t.amount, 0);
      const bills = activeTxns.filter((t) => t.category_id === 'cat_bills').reduce((sum, t) => sum + t.amount, 0);

      return {
        monthKey: mStr,
        month: monthLabels[mStr] || mStr,
        income,
        expense,
        savings,
        savingsRate,
        food,
        groceries,
        rent,
        transport,
        shopping,
        entertainment,
        bills,
        budget: totalBudgeted,
      };
    });
  }, [transactions, totalBudgeted]);

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
            Envelope limits, 5-month trends, proactive burn rate & velocity infographics
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
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('envelopes')}
          className={`shrink-0 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
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
          className={`shrink-0 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'infographics'
              ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Committed & Trends</span>
        </button>

        <button
          onClick={() => setActiveSubTab('subscriptions')}
          className={`shrink-0 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'subscriptions'
              ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Subscriptions</span>
        </button>

        <button
          onClick={() => setActiveSubTab('goals')}
          className={`shrink-0 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'goals'
              ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Goals</span>
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`shrink-0 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'simulator'
              ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Simulator</span>
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
          {/* Committed vs Free Money Allocation Card */}
          <CommittedMoneyCard />

          {/* Infographic 1: 5-Month Income, Spending & Savings Velocity Trajectory */}
          <div className="p-4 sm:p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    5-Month Financial Velocity & Savings Trend
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete MoM progression across April, May, June, July, and August 2026
                </p>
              </div>

              <div className="flex items-center gap-3 text-[10.5px] font-bold">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
                </span>
                <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
                </span>
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Net Savings
                </span>
              </div>
            </div>

            {/* Area Chart */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={multiMonthTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(v) => `${currSym}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11.5px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                    }}
                    formatter={(val: number, name: string) => [
                      `${currSym}${val.toLocaleString()}`,
                      name === 'income' ? 'Total Income' : name === 'expense' ? 'Total Expenses' : 'Net Surplus Saved'
                    ]}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" />
                  <Area type="monotone" dataKey="savings" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#savingsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* 5-Month Quick Metric Cards */}
            <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {multiMonthTrends.map((m) => (
                <div key={m.monthKey} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">{m.month}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums block mt-0.5">
                    {currSym}{Math.round(m.expense / 1000)}k
                  </span>
                  <span className="text-[9.5px] font-extrabold text-emerald-600 dark:text-emerald-400 block">
                    {m.savingsRate}% saved
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Infographic 2: Category Trajectory Over 5 Months (Stacked & Multi-Bar) */}
          <div className="p-4 sm:p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    Category Spend Breakdown Across 5 Months
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  See how spending in Food, Groceries, Rent, Transport & Shopping shifted
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#F97316]" /> Food
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" /> Groceries
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#6366F1]" /> Rent
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0284C7]" /> Transport
                </span>
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#EC4899]" /> Shopping
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={multiMonthTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={(v) => `${currSym}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11.5px',
                      border: 'none',
                    }}
                    formatter={(val: number) => [`${currSym}${val.toLocaleString()}`]}
                  />
                  <Bar dataKey="rent" stackId="a" fill="#6366F1" />
                  <Bar dataKey="groceries" stackId="a" fill="#10B981" />
                  <Bar dataKey="food" stackId="a" fill="#F97316" />
                  <Bar dataKey="transport" stackId="a" fill="#0284C7" />
                  <Bar dataKey="shopping" stackId="a" fill="#EC4899" />
                  <Bar dataKey="entertainment" stackId="a" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Infographic 3: Budget vs Actual Envelope Bar Chart (Current Month) */}
          <div className="p-4 sm:p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Current Month: Envelope Limit vs. Actual Spend
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Visual comparison for {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
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

          {/* Infographic 4: 50/30/20 Needs vs Wants Allocation Breakdown */}
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

      {/* 3C. TAB 3: Recurring Subscriptions Register */}
      {activeSubTab === 'subscriptions' && (
        <RecurringView />
      )}

      {/* 3D. TAB 4: Savings Goals & Milestones */}
      {activeSubTab === 'goals' && (
        <GoalsView />
      )}

      {/* 3E. TAB 5: Interactive Pacing & Burn Simulator */}
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
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Projected Month End</span>
                  <div className={`text-base font-black tabular-nums mt-0.5 ${simulatedMonthlyTotal > totalBudgeted ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                    {currSym}{Math.round(simulatedMonthlyTotal).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Surplus Left</span>
                  <div className="text-base font-black text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">
                    {savingsDelta >= 0 ? `+${currSym}${Math.round(savingsDelta).toLocaleString()}` : `-${currSym}${Math.round(Math.abs(savingsDelta)).toLocaleString()}`}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Envelope Modal (Create / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Budget Envelope' : 'New Budget Envelope'}
        subtitle="Set a spending target and proactive warning threshold"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={selectedCatId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-700 focus:outline-hidden"
              required
            >
              <option value="">Select an Expense Category</option>
              {categories
                .filter((c) => c.kind === 'expense')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            {suggestedAverage > 0 && (
              <p className="text-[11px] text-brand-700 dark:text-brand-400 mt-1">
                💡 Historical 3-Month Average: {currSym}{suggestedAverage.toLocaleString()}/month
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Budget Envelope Limit ({currSym})
            </label>
            <input
              type="number"
              min="100"
              step="100"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 8000"
              className="w-full text-base font-bold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-700 focus:outline-hidden tabular-nums"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span>Proactive Warning Alert Threshold:</span>
              <span className="font-mono text-brand-700 dark:text-brand-400">{alertThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
              className="w-full accent-brand-700"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>50% (Early heads-up)</span>
              <span>80% (Standard)</span>
              <span>95% (Strict cap)</span>
            </div>
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
              Save Envelope
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
