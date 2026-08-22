import { describe, it, expect } from 'vitest';
import {
  solveMonthsToTarget,
  dualContributorProjection,
  assessAffordability,
} from './compounding';

describe('Family Finance Compounding & Solvers Suite', () => {
  it('solves months to reach target and reproduces target value within tolerance', () => {
    const monthlySIP = 25000;
    const targetAmount = 2000000; // ₹20 Lakhs
    const ratePct = 12;

    const { months, reachable } = solveMonthsToTarget(monthlySIP, targetAmount, ratePct);
    expect(reachable).toBe(true);
    expect(months).toBeGreaterThan(0);

    // Feed solved months back into FV formula
    const r = ratePct / 100;
    const i = r / 12;
    const fv = monthlySIP * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);

    // Must be at or just above target amount and within 1 month's delta
    expect(fv).toBeGreaterThanOrEqual(targetAmount);
    const prevMonthFv = monthlySIP * ((Math.pow(1 + i, months - 1) - 1) / i) * (1 + i);
    expect(prevMonthFv).toBeLessThan(targetAmount);
  });

  it('calculates dual contributor joint investments split accurately', () => {
    const projection = dualContributorProjection(
      { monthly: 15000 },
      { monthly: 10000 },
      10, // 10 years
      12  // 12%
    );

    expect(projection.monthlyAmount).toBe(25000);
    expect(projection.contributionSplit.a).toBe(15000 * 120);
    expect(projection.contributionSplit.b).toBe(10000 * 120);
    expect(projection.contributionSplit.aPct).toBe(60);
    expect(projection.contributionSplit.bPct).toBe(40);
    expect(projection.estimatedWealth).toBeGreaterThan(projection.totalInvested);
  });

  it('correctly assesses affordability and flags emergency buffer breach', () => {
    // Scenario: ₹1L Vacation against ₹1.4L liquid savings with ₹50,000/mo expenses
    // 3-month floor = ₹1.5L. Liquid after = ₹40,000 (0.8 months runway < 3 months floor)
    const result = assessAffordability({
      cost: 100000,
      monthlyFreeCash: 40000,
      liquidSavings: 140000,
      monthlyExpenses: 50000,
      competingGoals: [
        { name: 'Down Payment', monthlyReserve: 20000, targetDate: '2028-01-01' },
      ],
      bufferMonthsFloor: 3,
    });

    expect(result.breachesBuffer).toBe(true);
    expect(result.bufferAfterMonths).toBe(0.8);
    expect(result.verdict).toBe('stretch');
    expect(result.monthsToSave).toBe(3); // 100k / 40k = 2.5 -> 3 months
    expect(result.explanation).toContain('emergency runway');
  });
});
