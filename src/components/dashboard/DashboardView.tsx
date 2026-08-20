import React, { useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  PiggyBank,
  Plus,
  ReceiptText,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useStore } from '../../lib/store';
import { CategoryIcon } from '../common/CategoryIcon';

export const DashboardView: React.FC = () => {
  const {
    transactions,
    categories,
    budgets,
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
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === month;
  const daysElapsed = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 1);

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

  // Category Click Handler
  const handleCategoryClick = (catId: string) => {
    setActiveCategoryFilter(catId);
    setActiveTab('transactions');
  };

  return (
    <div className="space-y-4 pb-28">
      {/* 1. Review Alert Banner if duplicates or anomalies exist */}
      {pendingReviewCount > 0 && (
        <div
          onClick={() => setActiveTab('review')}
          className="cursor-pointer flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl shadow-md shadow-amber-950/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-extrabold leading-tight">
                {pendingReviewCount} transaction{pendingReviewCount > 1 ? 's' : ''} need review
              </p>
              <p className="text-[11px] text-amber-100 mt-0.5">
                Suspected duplicates or unusual spikes detected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold bg-white/20 group-hover:bg-white/30 px-2.5 py-1 rounded-xl transition-colors">
            <span>Fix Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 2. Proactive Overspend Forecast Alert */}
      {overspendAlerts.length > 0 && (
        <div className="p-4 bg-amber-50/95 border border-amber-200/90 rounded-2xl shadow-xs">
          <div className="flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-amber-900 leading-tight">
                Proactive Budget Warning
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                At this pace you'll spend{' '}
                <span className="font-extrabold text-amber-950">
                  {currSym}{Math.round(overspendAlerts[0].projectedSpend).toLocaleString()}
                </span>{' '}
                on {overspendAlerts[0].categoryName} —{' '}
                <span className="font-extrabold text-rose-700">
                  {currSym}{Math.round(overspendAlerts[0].overspendAmount).toLocaleString()} over budget
                </span>
                . Cap it at{' '}
                <span className="font-extrabold text-amber-950">
                  {currSym}{Math.round(overspendAlerts[0].dailyTargetToStayOnTrack)}/day
                </span>{' '}
                to stay on track.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Three Summary Stats (Spent, Earned, Net) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Spent */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200/80 shadow-card">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-semibold">Spent</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-base sm:text-xl font-extrabold text-zinc-900 tabular-nums truncate">
            {currSym}{totalSpent.toLocaleString()}
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">This month</span>
        </div>

        {/* Earned */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200/80 shadow-card">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-semibold">Earned</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base sm:text-xl font-extrabold text-emerald-700 tabular-nums truncate">
            {currSym}{totalEarned.toLocaleString()}
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">This month</span>
        </div>

        {/* Net */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-zinc-200/80 shadow-card">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-[11px] font-semibold">Net Balance</span>
            {netBalance >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            )}
          </div>
          <div
            className={`text-base sm:text-xl font-extrabold tabular-nums truncate ${
              netBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {netBalance >= 0 ? '+' : ''}
            {currSym}{netBalance.toLocaleString()}
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">Saved so far</span>
        </div>
      </div>

      {/* 4. AI Insights Cards Carousel */}
      {insights.filter((i) => !i.is_dismissed).length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>AI Coach Digest</span>
            </div>
            <button
              onClick={() => setActiveTab('insights')}
              className="text-[11px] font-semibold text-brand-700 hover:text-brand-800"
            >
              View all
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none snap-x">
            {insights
              .filter((i) => !i.is_dismissed)
              .map((card) => (
                <div
                  key={card.id}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[320px] shrink-0 snap-start p-3.5 bg-gradient-to-br from-brand-900 to-teal-950 text-white rounded-2xl shadow-card relative group"
                >
                  <button
                    onClick={() => dismissInsight(card.id)}
                    className="absolute top-2.5 right-2.5 text-teal-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    {card.type.replace('_', ' ')}
                  </div>

                  <h5 className="text-xs font-bold text-white mt-1 leading-snug pr-4">
                    {card.title}
                  </h5>
                  <p className="text-[11px] text-teal-100/90 mt-1 leading-relaxed">
                    {card.body}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 5. Recharts Donut & Category Breakdown */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 leading-tight">Spending Breakdown</h3>
            <p className="text-[11px] text-zinc-500">By Category • Tap slice to filter</p>
          </div>
          <span className="text-xs font-bold text-zinc-700 tabular-nums">
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
                    innerRadius={52}
                    outerRadius={75}
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
                      backgroundColor: '#18181B',
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
                <span className="text-[10px] uppercase font-semibold text-zinc-400">Total</span>
                <span className="text-sm font-extrabold text-zinc-900 tabular-nums">
                  {currSym}{Math.round(totalSpent).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Category Legend List */}
            <div className="mt-3 divide-y divide-zinc-100">
              {categoryExpenses.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="py-2 flex items-center justify-between gap-2 hover:bg-zinc-50 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CategoryIcon name={cat.icon} color={cat.color} size={16} />
                    <span className="text-xs font-semibold text-zinc-800 truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-right shrink-0">
                    <span className="text-xs font-bold text-zinc-900 tabular-nums">
                      {currSym}{cat.value.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-400 w-10 text-right tabular-nums">
                      {Math.round(cat.percentage)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <ReceiptText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-500">No expenses recorded for this month</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Use quick-add below to log your first transaction</p>
          </div>
        )}
      </div>

      {/* 6. Budget Progress Bars */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-brand-700" />
            <h3 className="text-sm font-bold text-zinc-900 leading-tight">Monthly Budgets</h3>
          </div>
          <button
            onClick={() => setActiveTab('budgets')}
            className="text-xs font-semibold text-brand-700 hover:text-brand-800"
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
              let textStatus = 'text-brand-700';

              if (pct > 100) {
                barColor = 'bg-rose-600';
                textStatus = 'text-rose-600 font-bold';
              } else if (pct >= b.alert_threshold) {
                barColor = 'bg-amber-500';
                textStatus = 'text-amber-700 font-semibold';
              }

              return (
                <div key={b.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {cat && <CategoryIcon name={cat.icon} color={cat.color} size={14} />}
                      <span className="font-bold text-zinc-800">{cat?.name || 'Overall Budget'}</span>
                    </div>
                    <div className="text-right tabular-nums">
                      <span className="font-bold text-zinc-900">{currSym}{spent.toLocaleString()}</span>
                      <span className="text-zinc-400 font-normal"> / {currSym}{b.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Progress bar container */}
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  {/* Target line */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                    <span>{Math.round(pct)}% used</span>
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
            <p className="text-xs text-zinc-500">No category budgets created yet.</p>
            <button
              onClick={() => setActiveTab('budgets')}
              className="mt-2 text-xs font-bold text-brand-700 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Set First Budget
            </button>
          </div>
        )}
      </div>

      {/* 7. Recent 5 Transactions */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-200/80 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-zinc-900 leading-tight">Recent Transactions</h3>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            View all ({transactions.length})
          </button>
        </div>

        <div className="divide-y divide-zinc-100">
          {recentTransactions.map((t) => {
            const cat = categories.find((c) => c.id === t.category_id);
            const isExpense = t.kind === 'expense';

            return (
              <div
                key={t.id}
                onClick={() => setEditingTransaction(t)}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-50 px-2 rounded-2xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat?.color || '#0F766E'}18` }}
                  >
                    <CategoryIcon
                      name={cat?.icon || 'ReceiptText'}
                      color={cat?.color || '#0F766E'}
                      size={18}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      {t.merchant || 'Transaction'}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                      <span>{cat?.name || 'Category'}</span>
                      <span>•</span>
                      <span>{t.txn_date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-black tabular-nums ${
                      isExpense ? 'text-zinc-900' : 'text-emerald-700'
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
