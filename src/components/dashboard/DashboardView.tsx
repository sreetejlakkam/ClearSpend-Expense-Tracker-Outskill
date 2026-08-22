import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  ChevronRight,
  CreditCard,
  PiggyBank,
  Plus,
  ReceiptText,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet as WalletIcon,
  X,
  Zap,
  Building2,
  Banknote,
  Coins
} from 'lucide-react';

import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useStore } from '../../lib/store';
import { useTranslation } from '../../lib/i18n';
import { CategoryIcon } from '../common/CategoryIcon';
import { SafeToSpendCard } from './SafeToSpendCard';
import { StreakCard } from './StreakCard';

export const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  const {
    transactions,
    categories,
    budgets,
    wallets,
    insights,
    dismissInsight,
    selectedMonthStr,
    selectedDate,
    profile,
    setActiveTab,
    setActiveCategoryFilter,
    setEditingTransaction,
    pendingReviewCount,
  } = useStore();



  const [activeChartTab, setActiveChartTab] = useState<'daily' | 'category'>('daily');

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.status === 'active' && t.txn_date.startsWith(selectedMonthStr)
    );
  }, [transactions, selectedMonthStr]);

  // Compute month totals
  const totalSpent = useMemo(() => {
    return monthTransactions
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const totalEarned = useMemo(() => {
    return monthTransactions
      .filter((t) => t.kind === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const netBalance = totalEarned - totalSpent;
  const savingsRate = totalEarned > 0 ? Math.max(0, Math.round(((totalEarned - totalSpent) / totalEarned) * 100)) : 0;

  // Wallet Balances summary
  const totalWalletBalance = useMemo(() => {
    return wallets.reduce((acc, w) => {
      // Add transactions on this wallet
      const walletTxns = transactions.filter((t) => t.wallet_id === w.id && t.status === 'active');
      const earned = walletTxns.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0);
      const spent = walletTxns.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amount, 0);
      return acc + (w.opening_balance + earned - spent);
    }, 0);
  }, [wallets, transactions]);

  // Category Donut Data
  const categoryExpenses = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTransactions) {
      if (t.kind === 'expense') {
        map.set(t.category_id, (map.get(t.category_id) || 0) + t.amount);
      }
    }

    const data = [];
    for (const [catId, amount] of map.entries()) {
      const cat = categories.find((c) => c.id === catId);
      if (cat && amount > 0) {
        data.push({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          value: amount,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        });
      }
    }
    return data.sort((a, b) => b.value - a.value);
  }, [monthTransactions, categories, totalSpent]);

  // Days calculations for pacing
  const now = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const daysElapsed = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 1);
  const avgDailySpend = daysElapsed > 0 ? Math.round(totalSpent / daysElapsed) : 0;

  // Daily Spending Trend Data for AreaChart
  const dailySpendData = useMemo(() => {
    const daysMap = new Map<number, number>();
    for (let d = 1; d <= daysInMonth; d++) {
      daysMap.set(d, 0);
    }

    for (const t of monthTransactions) {
      if (t.kind === 'expense') {
        const day = parseInt(t.txn_date.split('-')[2], 10);
        if (!isNaN(day)) {
          daysMap.set(day, (daysMap.get(day) || 0) + t.amount);
        }
      }
    }

    // Cumulative & daily points
    let cumulative = 0;
    const points = [];
    for (let d = 1; d <= (isCurrentMonth ? daysElapsed : daysInMonth); d++) {
      const amount = daysMap.get(d) || 0;
      cumulative += amount;
      points.push({
        day: `Day ${d}`,
        date: `${d} ${selectedDate.toLocaleString('default', { month: 'short' })}`,
        amount: amount,
        cumulative: cumulative,
      });
    }
    return points;
  }, [monthTransactions, daysInMonth, isCurrentMonth, daysElapsed, selectedDate]);

  // Proactive Overspend Warning Alerts
  const overspendAlerts = useMemo(() => {
    const alerts: Array<{
      categoryName: string;
      budgetAmount: number;
      spentSoFar: number;
      projectedSpend: number;
      overspendAmount: number;
      dailyTargetToStayOnTrack: number;
    }> = [];

    if (daysElapsed <= 0) return alerts;

    for (const b of budgets) {
      if (!b.category_id) continue;
      const cat = categories.find((c) => c.id === b.category_id);
      if (!cat) continue;

      const spent = monthTransactions
        .filter((t) => t.category_id === b.category_id && t.kind === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const projected = (spent / daysElapsed) * daysInMonth;

      if (projected > b.amount && spent > 0) {
        const overspend = projected - b.amount;
        const remainingBudget = Math.max(b.amount - spent, 0);
        const dailyCap = remainingBudget / daysRemaining;

        alerts.push({
          categoryName: cat.name,
          budgetAmount: b.amount,
          spentSoFar: spent,
          projectedSpend: projected,
          overspendAmount: overspend,
          dailyTargetToStayOnTrack: dailyCap,
        });
      }
    }
    return alerts;
  }, [budgets, categories, monthTransactions, daysElapsed, daysInMonth, daysRemaining]);

  // Recent 5 Transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .filter((t) => t.status === 'active')
      .sort((a, b) => new Date(b.txn_date).getTime() - new Date(a.txn_date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Helper for Wallet Icon & Gradients
  const getWalletCardStyle = (type: string) => {
    switch (type) {
      case 'bank':
        return {
          gradient: 'from-blue-600 via-indigo-600 to-indigo-800',
          badgeBg: 'bg-blue-400/20 text-blue-100 border-blue-300/30',
          icon: Building2,
        };
      case 'wallet':
        return {
          gradient: 'from-sky-500 via-indigo-500 to-blue-600',
          badgeBg: 'bg-sky-400/20 text-sky-100 border-sky-300/30',
          icon: Zap,
        };
      case 'cash':
        return {
          gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
          badgeBg: 'bg-emerald-400/20 text-emerald-100 border-emerald-300/30',
          icon: Coins,
        };
      case 'card':
        return {
          gradient: 'from-purple-600 via-indigo-600 to-rose-600',
          badgeBg: 'bg-purple-400/20 text-purple-100 border-purple-300/30',
          icon: CreditCard,
        };
      default:
        return {
          gradient: 'from-slate-700 via-slate-800 to-slate-900',
          badgeBg: 'bg-slate-400/20 text-slate-100 border-slate-300/30',
          icon: Banknote,
        };
    }
  };

  const handleCategoryClick = (catId: string) => {
    setActiveCategoryFilter(catId);
    setActiveTab('transactions');
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-3.5 sm:space-y-4 pb-28">
      {/* 1. Review Alert Banner if duplicates or anomalies exist */}
      {pendingReviewCount > 0 && (
        <div
          onClick={() => setActiveTab('review')}
          className="cursor-pointer flex items-center justify-between p-3 sm:p-3.5 bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl sm:rounded-3xl shadow-md shadow-amber-500/20 transition-all group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold leading-tight truncate">
                {pendingReviewCount} transaction{pendingReviewCount > 1 ? 's' : ''} need review
              </p>
              <p className="text-[10.5px] sm:text-[11px] text-amber-100 mt-0.5 truncate">
                Suspected duplicates or unusual spending spikes detected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold bg-white/20 group-hover:bg-white/30 px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors shrink-0">
            <span>Fix</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 2. Proactive Overspend Forecast Alert */}
      {overspendAlerts.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-amber-50/95 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl sm:rounded-3xl shadow-xs">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-tight">
                Proactive Budget Velocity Alert
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                At this pace you'll spend{' '}
                <span className="font-extrabold text-amber-950 dark:text-amber-100">
                  {currSym}{Math.round(overspendAlerts[0].projectedSpend).toLocaleString()}
                </span>{' '}
                on {overspendAlerts[0].categoryName} —{' '}
                <span className="font-extrabold text-rose-700 dark:text-rose-400">
                  {currSym}{Math.round(overspendAlerts[0].overspendAmount).toLocaleString()} over budget
                </span>
                . Cap it at{' '}
                <span className="font-extrabold text-amber-950 dark:text-amber-100 underline decoration-amber-400">
                  {currSym}{Math.round(overspendAlerts[0].dailyTargetToStayOnTrack)}/day
                </span>{' '}
                for the next {daysRemaining} days to stay on track.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2a. Daily Safe To Spend Hero Allowance */}
      <SafeToSpendCard />

      {/* 2b. Daily Logging Streaks & No Spend Today */}
      <StreakCard />

      {/* 2c. FinAI Financial Copilot Interactive Launcher */}
      <div
        onClick={() => setActiveTab('finai')}
        className="cursor-pointer p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:via-indigo-900 hover:to-slate-800 text-white rounded-2xl sm:rounded-3xl shadow-lg border border-indigo-500/30 flex items-center justify-between gap-3 group transition-all"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Bot className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white truncate">Ask FinAI Copilot</span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                Free AI & Qwen 2.5
              </span>
            </div>
            <p className="text-[10.5px] sm:text-[11px] text-slate-300 mt-0.5 truncate">
              "How can I cut ₹5,000 off my food spend this month?"
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-indigo-200 group-hover:text-white bg-white/10 group-hover:bg-white/20 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shrink-0">
          <span>Chat</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 2d. ClearScore™ Financial Health & Wealth Radar (Surprise Flagship Feature) */}
      <div
        onClick={() => setActiveTab('clearscore')}
        className="cursor-pointer p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:via-indigo-900 hover:to-slate-800 text-white rounded-2xl sm:rounded-3xl shadow-lg border border-cyan-500/30 flex items-center justify-between gap-3 group transition-all"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white truncate">{t('clearscore.title', 'ClearScore™ Health Radar')}</span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
                100-PT INDEX
              </span>
            </div>
            <p className="text-[10.5px] sm:text-[11px] text-slate-300 mt-0.5 truncate">
              {t('clearscore.subtitle', '5-pillar wealth radar & What-If stress scenario tester')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-cyan-200 group-hover:text-white bg-white/10 group-hover:bg-white/20 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shrink-0">
          <span>Radar</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 2c. Power of Compounding & Wealth Opportunity Cost Card */}
      <div
        onClick={() => setActiveTab('compounding')}
        className="cursor-pointer p-3.5 sm:p-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 hover:from-emerald-700 hover:via-teal-800 hover:to-slate-800 text-white rounded-2xl sm:rounded-3xl shadow-lg border border-emerald-500/30 flex items-center justify-between gap-3 group transition-all"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white truncate">
                {t('dash.compounding_card_title', 'Power of Compounding Visualizer')}
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-white/20 text-emerald-100 shrink-0">
                4.2x Multiplier
              </span>
            </div>
            <p className="text-[10.5px] sm:text-[11px] text-emerald-100/90 mt-0.5 truncate">
              {t('dash.compounding_card_desc', 'See how redirecting ₹2,000/mo of avoidable spend can grow to ₹20+ Lakhs!')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-200 group-hover:text-white bg-white/10 group-hover:bg-white/20 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shrink-0">
          <span>Simulate</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 3. Account / Wallets Carousel */}
      <div className="space-y-2 w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <WalletIcon className="w-3.5 h-3.5 text-brand-600" />
            <span>Accounts & Liquid Assets</span>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tabular-nums">
            Net: <span className="text-brand-700 dark:text-brand-300 font-extrabold">{currSym}{totalWalletBalance.toLocaleString()}</span>
          </span>
        </div>

        <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-none snap-x w-full max-w-full">
          {wallets.map((w) => {
            const style = getWalletCardStyle(w.type);
            const Icon = style.icon;

            // Calculate current live balance
            const wTxns = transactions.filter((t) => t.wallet_id === w.id && t.status === 'active');
            const earned = wTxns.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0);
            const spent = wTxns.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amount, 0);
            const currentBal = w.opening_balance + earned - spent;

            return (
              <div
                key={w.id}
                onClick={() => {
                  setActiveTab('settings');
                }}
                className={`min-w-[160px] sm:min-w-[185px] p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br ${style.gradient} text-white shadow-md shadow-slate-900/10 snap-start cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden shrink-0`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${style.badgeBg}`}>
                    {w.type}
                  </span>
                </div>

                <div className="text-[11px] font-medium text-white/85 truncate">
                  {w.name}
                </div>
                <div className="text-sm sm:text-base font-black tabular-nums mt-0.5 text-white tracking-tight truncate">
                  {currSym}{currentBal.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Three High-Impact Monthly Metric Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-full">
        {/* Spent */}
        <div className="bg-white dark:bg-surface-dark p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300">Spent</span>
            <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
              <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-500" />
            </div>
          </div>
          <div className="text-xs sm:text-sm md:text-xl font-black text-slate-900 dark:text-white tabular-nums truncate">
            {currSym}{totalSpent.toLocaleString()}
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-0.5 truncate">
            <span>Burn:</span>
            <span className="text-slate-600 dark:text-slate-300 font-bold">{currSym}{avgDailySpend}/d</span>
          </div>
        </div>

        {/* Earned */}
        <div className="bg-white dark:bg-surface-dark p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300">Earned</span>
            <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
              <ArrowDownLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
            </div>
          </div>
          <div className="text-xs sm:text-sm md:text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums truncate">
            {currSym}{totalEarned.toLocaleString()}
          </div>
          <span className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block truncate">
            {monthTransactions.filter((t) => t.kind === 'income').length} credit{monthTransactions.filter((t) => t.kind === 'income').length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Savings Rate / Net */}
        <div className="bg-white dark:bg-surface-dark p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300">Savings</span>
            <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
              <PiggyBank className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brand-600" />
            </div>
          </div>
          <div
            className={`text-xs sm:text-sm md:text-xl font-black tabular-nums truncate ${
              netBalance >= 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {savingsRate}%
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
            {netBalance >= 0 ? '+' : ''}{currSym}{netBalance.toLocaleString()}
          </div>
        </div>
      </div>


      {/* 5. Spending Velocity & Infographic Area Chart */}
      <div className="bg-white dark:bg-surface-dark p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Cash Flow Infographic</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Day-by-day expenditure curve</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => setActiveChartTab('daily')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                activeChartTab === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setActiveChartTab('category')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                activeChartTab === 'category'
                  ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Cumulative
            </button>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailySpendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) => `${currSym}${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                }}
                formatter={(val: number) => [`${currSym}${val.toLocaleString()}`, activeChartTab === 'daily' ? 'Daily Spend' : 'Total Spent']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
              />
              <Area
                type="monotone"
                dataKey={activeChartTab === 'daily' ? 'amount' : 'cumulative'}
                stroke="#4F46E5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#spendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. AI Insights Cards Carousel */}
      {insights.filter((i) => !i.is_dismissed).length > 0 && (
        <div className="space-y-1.5 w-full max-w-full overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Smart Financial Insights</span>
            </div>
            <button
              onClick={() => setActiveTab('insights')}
              className="text-[11px] font-bold text-brand-700 dark:text-brand-300 hover:text-brand-800"
            >
              View all
            </button>
          </div>

          <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-none snap-x w-full max-w-full">
            {insights
              .filter((i) => !i.is_dismissed)
              .map((card) => (
                <div
                  key={card.id}
                  className="min-w-[270px] sm:min-w-[310px] max-w-[310px] shrink-0 snap-start p-3.5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-card relative group border border-slate-800"
                >
                  <button
                    onClick={() => dismissInsight(card.id)}
                    className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    {card.type.replace('_', ' ')}
                  </div>

                  <h5 className="text-xs font-bold text-white mt-1 leading-snug pr-4">
                    {card.title}
                  </h5>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {card.body}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 7. Recharts Donut & Category Breakdown */}
      <div className="bg-white dark:bg-surface-dark p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Spending Breakdown</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">By Category • Tap slice to filter ledger</p>
          </div>
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tabular-nums">
            {currSym}{totalSpent.toLocaleString()}
          </span>
        </div>

        {categoryExpenses.length > 0 ? (
          <div>
            {/* Donut Chart */}
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryExpenses}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(data) => handleCategoryClick(data.id)}
                    cursor="pointer"
                  >
                    {categoryExpenses.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${currSym}${val.toLocaleString()}`, 'Spent']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center summary text */}
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                  {currSym}{Math.round(totalSpent).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Category Legend List */}
            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {categoryExpenses.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}15` }}
                    >
                      <CategoryIcon name={cat.icon} color={cat.color} size={15} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-right shrink-0">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {currSym}{cat.value.toLocaleString()}
                    </span>
                    <span
                      className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full tabular-nums"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                      }}
                    >
                      {Math.round(cat.percentage)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <ReceiptText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No expenses recorded for this month</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Use quick-add below to log your first transaction</p>
          </div>
        )}
      </div>

      {/* 8. Budget Progress Bars */}
      <div className="bg-white dark:bg-surface-dark p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-brand-700 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Monthly Budgets</h3>
          </div>
          <button
            onClick={() => setActiveTab('budgets')}
            className="text-xs font-bold text-brand-700 dark:text-brand-300 hover:text-brand-800"
          >
            Manage
          </button>
        </div>

        {budgets.length > 0 ? (
          <div className="space-y-3.5">
            {budgets.map((b) => {
              const cat = categories.find((c) => c.id === b.category_id);
              const spent = monthTransactions
                .filter((t) => t.category_id === b.category_id && t.kind === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

              const pct = (spent / b.amount) * 100;
              const remaining = Math.max(b.amount - spent, 0);
              const dailyTarget = Math.round(remaining / daysRemaining);

              let barColor = 'bg-brand-600';
              let textStatus = 'text-brand-700 dark:text-brand-300';

              if (pct > 100) {
                barColor = 'bg-rose-600';
                textStatus = 'text-rose-600 dark:text-rose-400 font-bold';
              } else if (pct >= b.alert_threshold) {
                barColor = 'bg-amber-500';
                textStatus = 'text-amber-700 dark:text-amber-300 font-bold';
              }

              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {cat && (
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}15` }}
                        >
                          <CategoryIcon name={cat.icon} color={cat.color} size={12} />
                        </div>
                      )}
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cat?.name || 'Overall Budget'}</span>
                    </div>
                    <div className="text-right tabular-nums">
                      <span className="font-black text-slate-900 dark:text-white">{currSym}{spent.toLocaleString()}</span>
                      <span className="text-slate-400 dark:text-slate-500 font-medium"> / {currSym}{b.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Progress bar container */}
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  {/* Target line */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span className="font-bold">{Math.round(pct)}% used</span>
                    <span className={textStatus}>
                      {pct > 100
                        ? `Over budget by ${currSym}${Math.round(spent - b.amount).toLocaleString()}`
                        : `${currSym}${dailyTarget}/day left to stay on track`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">No category budgets created yet.</p>
            <button
              onClick={() => setActiveTab('budgets')}
              className="mt-2 text-xs font-bold text-brand-700 dark:text-brand-300 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Set First Budget
            </button>
          </div>
        )}
      </div>

      {/* 9. Recent 5 Transactions */}
      <div className="bg-white dark:bg-surface-dark p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Recent Transactions</h3>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold text-brand-700 dark:text-brand-300 hover:text-brand-800"
          >
            View all ({transactions.length})
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentTransactions.map((t) => {
            const cat = categories.find((c) => c.id === t.category_id);
            const isExpense = t.kind === 'expense';

            return (
              <div
                key={t.id}
                onClick={() => setEditingTransaction(t)}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 px-2 rounded-2xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat?.color || '#4F46E5'}15` }}
                  >
                    <CategoryIcon
                      name={cat?.icon || 'ReceiptText'}
                      color={cat?.color || '#4F46E5'}
                      size={17}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {t.merchant || 'Transaction'}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{cat?.name || 'Category'}</span>
                      <span>•</span>
                      <span>{t.txn_date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-black tabular-nums ${
                      isExpense ? 'text-slate-900 dark:text-white' : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {isExpense ? '−' : '+'}
                    {currSym}{t.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


