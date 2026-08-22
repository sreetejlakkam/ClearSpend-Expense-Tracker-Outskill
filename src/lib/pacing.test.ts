import { describe, it, expect } from 'vitest';
import { calculateSafeToSpend } from './pacing';
import { Budget, Goal, RecurringItem, Transaction } from '../types';

describe('Safe-to-Spend Pacing Engine Suite', () => {
  it('calculates safe to spend today accurately with remaining days and savings reserved', () => {
    const fixedDate = new Date(2026, 7, 10); // August 10, 2026 (31 days in Aug, 22 days remaining)

    const budgets: Budget[] = [
      {
        id: 'b1',
        user_id: 'u1',
        category_id: 'cat_groceries',
        period: 'monthly',
        amount: 30000,
        start_month: '2026-08-01',
        alert_threshold: 80,
        created_at: new Date().toISOString(),
      },
      {
        id: 'b2',
        user_id: 'u1',
        category_id: 'cat_dining',
        period: 'monthly',
        amount: 20000,
        start_month: '2026-08-01',
        alert_threshold: 80,
        created_at: new Date().toISOString(),
      },
    ];

    const transactions: Transaction[] = [
      {
        id: 't1',
        user_id: 'u1',
        wallet_id: 'w1',
        category_id: 'cat_groceries',
        amount: 5000,
        kind: 'expense',
        merchant: 'Supermarket',
        txn_date: '2026-08-05',
        status: 'active',
        source: 'manual',
        was_corrected: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const recurring: RecurringItem[] = [
      {
        id: 'r1',
        user_id: 'u1',
        merchant: 'Netflix',
        amount: 649,
        category_id: 'cat_entertainment',
        frequency: 'monthly',
        due_day: 15,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const goals: Goal[] = [
      {
        id: 'g1',
        user_id: 'u1',
        title: 'Emergency Fund',
        target_amount: 100000,
        current_amount: 20000,
        monthly_contribution: 5000,
        target_date: '2027-08-01',
        is_paused: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const result = calculateSafeToSpend(transactions, budgets, recurring, goals, fixedDate);

    // Monthly Flexible: 50,000
    // Spent: 5,000
    // Reserved Goals: 5,000
    // Net Flexible Pool: 50,000 - 5,000 - 5,000 = 40,000
    // Days remaining (Aug 10 to 31): 22 days
    // Safe today = 40,000 / 22 = ~1818
    expect(result.monthlyFlexibleBudget).toBe(50000);
    expect(result.spentThisMonth).toBe(5000);
    expect(result.savingsReserved).toBe(5000);
    expect(result.remainingBudget).toBe(40000);
    expect(result.daysRemaining).toBe(22);
    expect(result.safeToday).toBe(1818);
    expect(result.status).toBe('comfortable');
  });

  it('handles overspend scenario and returns safeToday = 0 and status exhausted', () => {
    const fixedDate = new Date(2026, 7, 20);

    const budgets: Budget[] = [
      {
        id: 'b1',
        user_id: 'u1',
        category_id: 'cat_groceries',
        period: 'monthly',
        amount: 10000,
        start_month: '2026-08-01',
        alert_threshold: 80,
        created_at: new Date().toISOString(),
      },
    ];

    const transactions: Transaction[] = [
      {
        id: 't1',
        user_id: 'u1',
        wallet_id: 'w1',
        category_id: 'cat_groceries',
        amount: 12500,
        kind: 'expense',
        merchant: 'Gourmet Store',
        txn_date: '2026-08-15',
        status: 'active',
        source: 'manual',
        was_corrected: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const result = calculateSafeToSpend(transactions, budgets, [], [], fixedDate);
    expect(result.safeToday).toBe(0);
    expect(result.status).toBe('exhausted');
    expect(result.overspendAmount).toBe(2500);
  });
});
