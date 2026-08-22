// Safe-to-Spend Daily Allowance Engine
import { Budget, Goal, RecurringItem, Transaction } from '../types';

export interface SafeToSpendResult {
  safeToday: number;
  monthlyFlexibleBudget: number;
  spentThisMonth: number;
  committedSubscriptions: number;
  savingsReserved: number;
  remainingBudget: number;
  daysRemaining: number;
  daysInMonth: number;
  currentDay: number;
  status: 'comfortable' | 'moderate' | 'tight' | 'exhausted';
  overspendAmount: number;
}

export function calculateSafeToSpend(
  transactions: Transaction[],
  budgets: Budget[],
  recurringItems: RecurringItem[] = [],
  goals: Goal[] = [],
  refDate: Date = new Date()
): SafeToSpendResult {
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-indexed
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Days in month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const currentDay = refDate.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

  // 1. Total Flexible Budget (sum of active expense budgets for the month)
  const monthlyFlexibleBudget = budgets
    .filter((b) => !b.start_month || b.start_month.startsWith(monthStr))
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  // 2. Spent this month so far (active expense transactions)
  const spentThisMonth = transactions
    .filter(
      (t) =>
        t.status === 'active' &&
        t.kind === 'expense' &&
        t.txn_date.startsWith(monthStr)
    )
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // 3. Fixed / Recurring Subscriptions reserved this month
  const committedSubscriptions = recurringItems
    .filter((r) => r.is_active)
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  // 4. Monthly Savings Goals reserved
  const savingsReserved = goals
    .filter((g) => !g.is_paused && Number(g.monthly_contribution || 0) > 0)
    .reduce((sum, g) => sum + Number(g.monthly_contribution || 0), 0);

  // Net remaining flexible pool
  const netPool = monthlyFlexibleBudget - spentThisMonth - savingsReserved;
  const remainingBudget = Math.max(0, netPool);
  const overspendAmount = netPool < 0 ? Math.abs(netPool) : 0;

  // Safe to spend today
  let safeToday = 0;
  let status: 'comfortable' | 'moderate' | 'tight' | 'exhausted' = 'comfortable';

  if (monthlyFlexibleBudget === 0) {
    // If no budget is set, provide an estimate based on income or default
    safeToday = Math.max(0, Math.round(500));
    status = 'moderate';
  } else if (netPool <= 0) {
    safeToday = 0;
    status = 'exhausted';
  } else {
    safeToday = Math.max(0, Math.round(remainingBudget / daysRemaining));
    if (safeToday >= 600) {
      status = 'comfortable';
    } else if (safeToday >= 250) {
      status = 'moderate';
    } else {
      status = 'tight';
    }
  }

  return {
    safeToday,
    monthlyFlexibleBudget,
    spentThisMonth,
    committedSubscriptions,
    savingsReserved,
    remainingBudget,
    daysRemaining,
    daysInMonth: totalDaysInMonth,
    currentDay,
    status,
    overspendAmount,
  };
}
