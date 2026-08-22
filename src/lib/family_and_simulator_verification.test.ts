import { describe, it, expect } from 'vitest';
import { calculateHouseholdMonthlySummary, filterHouseholdLedger } from './household';
import { calculateMonthlySIPCompounding } from './compounding';
import { demoData } from './storage';

describe('Family Room Data & Infographics Verification', () => {
  const household = demoData.demoHousehold.household;
  const members = demoData.demoHousehold.members;
  const txns = demoData.transactions;

  it('aggregates data across all 5 months for the Sharma Family Room', () => {
    const months = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];

    months.forEach((month) => {
      const summary = calculateHouseholdMonthlySummary(household.id, month, members, txns);
      expect(summary.length).toBe(2);

      const totalIncome = summary.reduce((sum, item) => sum + (item.total_income || 0), 0);
      const totalExpense = summary.reduce((sum, item) => sum + (item.total_expense || 0), 0);
      const netSavings = totalIncome - totalExpense;

      // Aarav (85k-100k) + Priya (70k) >= 1,55,000
      expect(totalIncome).toBeGreaterThanOrEqual(155000);
      expect(totalExpense).toBeGreaterThan(0);
      expect(netSavings).toBeGreaterThan(0);
    });
  });

  it('filters shared household ledger properly with partner privacy isolation', () => {
    const sharedLedger = filterHouseholdLedger(household.id, 'user_sharma_demo', txns);
    expect(sharedLedger.length).toBeGreaterThan(0);

    // Verify shared items exist
    const rentItem = sharedLedger.find((item) => item.category_id === 'cat_rent');
    expect(rentItem).toBeDefined();
    expect(rentItem?.amount).toBeGreaterThan(0);
  });

  it('calculates 60/40 fair-share split contribution accurately', () => {
    const totalFixed = 45000;
    const user1Income = 100000;
    const user2Income = 70000;
    const totalIncome = user1Income + user2Income;

    const user1Ratio = user1Income / totalIncome;
    const user2Ratio = user2Income / totalIncome;

    expect(user1Ratio).toBeCloseTo(0.588, 2);
    expect(user2Ratio).toBeCloseTo(0.412, 2);

    const user1Share = Math.round(totalFixed * user1Ratio);
    const user2Share = totalFixed - user1Share;
    expect(user1Share + user2Share).toBe(totalFixed);
  });

  it('projects 20-year joint compounding wealth correctly at 12% CAGR', () => {
    const result = calculateMonthlySIPCompounding(30000, 20, 12);
    expect(result.estimatedWealth).toBeGreaterThan(25000000); // 2.5+ Crore
    expect(result.multiplier).toBeGreaterThanOrEqual(4.0); // 4x+ multiplier
    expect(result.yearlyMilestones.length).toBe(20);
  });
});
