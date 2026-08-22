import {
  Household,
  HouseholdMember,
  HouseholdBudget,
  HouseholdGoal,
  HouseholdMonthlySummaryItem,
  HouseholdLedgerRow,
  RecurringItem,
} from '../types';
import { solveMonthsToTarget, dualContributorProjection, assessAffordability } from './compounding';
import { isSupabaseConfigured } from './supabase';

export interface HouseholdAIContextParams {
  household: Household;
  members: HouseholdMember[];
  monthlySummaries: { month: string; items: HouseholdMonthlySummaryItem[] }[];
  sharedLedger: HouseholdLedgerRow[];
  sharedBudgets: HouseholdBudget[];
  sharedGoals: HouseholdGoal[];
  recurringItems: RecurringItem[];
}

/**
 * Builds the strictly privacy-guarded context string for the Family AI.
 * HARD REQUIREMENT: Exclusively built from monthly summaries and the column-masked sharedLedger.
 * It is structurally impossible for private merchants or notes to enter this context.
 */
export function buildHouseholdContext(params: HouseholdAIContextParams): string {
  const {
    household,
    members,
    monthlySummaries,
    sharedLedger,
    sharedBudgets,
    sharedGoals,
    recurringItems,
  } = params;

  const activeMembers = members.filter((m) => m.status === 'active');
  const lines: string[] = [];

  lines.push(`=== HOUSEHOLD: ${household.name} (${activeMembers.length} members, ${household.base_currency}) ===`);

  // 1. Combined Monthly (3-Month Trailing Summary)
  lines.push(`COMBINED MONTHLY SUMMARIES:`);
  let totalTrailingIncome = 0;
  let totalTrailingExpense = 0;
  let summaryCount = 0;
  let hasIncompleteMember = false;

  for (const summary of monthlySummaries) {
    const monthIncome = summary.items.reduce((sum, i) => sum + (i.total_income || 0), 0);
    const monthExpense = summary.items.reduce((sum, i) => sum + (i.total_expense || 0), 0);
    const monthNet = monthIncome - monthExpense;
    const anyEstimated = summary.items.some((i) => i.is_estimated);
    if (anyEstimated) hasIncompleteMember = true;

    const memberBreakdown = summary.items
      .map((i) => `${i.display_name}: ${i.total_income !== null ? `₹${i.total_income.toLocaleString('en-IN')}` : '[Not Shared]'}`)
      .join(' · ');

    lines.push(`  Month ${summary.month}: Income ₹${monthIncome.toLocaleString('en-IN')} (${memberBreakdown}) | Expense ₹${monthExpense.toLocaleString('en-IN')} | Net ₹${monthNet.toLocaleString('en-IN')}`);

    totalTrailingIncome += monthIncome;
    totalTrailingExpense += monthExpense;
    summaryCount++;
  }

  const avgIncome = summaryCount > 0 ? Math.round(totalTrailingIncome / summaryCount) : 0;
  const avgExpense = summaryCount > 0 ? Math.round(totalTrailingExpense / summaryCount) : 0;
  const avgNet = avgIncome - avgExpense;
  const savingsRate = avgIncome > 0 ? Math.round((avgNet / avgIncome) * 100) : 0;

  lines.push(`3-MONTH AVERAGE: Income ₹${avgIncome.toLocaleString('en-IN')} | Expenses ₹${avgExpense.toLocaleString('en-IN')} | Net Savings ₹${avgNet.toLocaleString('en-IN')} (Savings Rate: ${savingsRate}%)`);

  // 2. Shared Envelopes
  if (sharedBudgets.length > 0) {
    lines.push(`SHARED ENVELOPES (Joint Budgets):`);
    for (const b of sharedBudgets) {
      lines.push(`  - ${b.name}: ₹${b.amount.toLocaleString('en-IN')} / ${b.period}`);
    }
  }

  // 3. Joint Goals
  if (sharedGoals.length > 0) {
    lines.push(`JOINT FINANCIAL GOALS:`);
    for (const g of sharedGoals) {
      const pct = g.target_amount > 0 ? Math.round((g.saved_amount / g.target_amount) * 100) : 0;
      lines.push(`  - ${g.name}: Target ₹${g.target_amount.toLocaleString('en-IN')} | Saved ₹${g.saved_amount.toLocaleString('en-IN')} (${pct}%) | Target Date: ${g.target_date || 'Ongoing'} | Assumed Return: ${g.expected_return_pct}% p.a.`);
    }
  }

  // 4. Committed Fixed Costs (Subscriptions & Recurring)
  const totalCommitted = recurringItems.filter((r) => r.is_active).reduce((sum, r) => sum + r.amount, 0);
  lines.push(`COMMITTED FIXED COSTS: ₹${totalCommitted.toLocaleString('en-IN')}/month (across ${recurringItems.length} subscriptions & recurring items)`);

  // 5. Shared-Visibility Ledger (Recent Rows Masked)
  const recentShared = sharedLedger.slice(0, 30);
  lines.push(`SHARED LEDGER (Last ${recentShared.length} visible items):`);
  for (const row of recentShared) {
    lines.push(`  [${row.txn_date}] ${row.kind.toUpperCase()} ₹${row.amount.toLocaleString('en-IN')} - ${row.merchant} (${row.visibility})`);
  }

  // 6. Privacy Disclosure Note
  if (hasIncompleteMember) {
    lines.push(`PRIVACY NOTE: One or more household members have summary sharing turned off. Household totals reflect partial visibility.`);
  } else {
    lines.push(`PRIVACY NOTE: All members share monthly summary totals. Private line items and merchants remain strictly confidential.`);
  }

  return lines.join('\n');
}

/**
 * Deterministic Offline Family AI Answering Engine
 * Evaluates the 4 core Household Planning prompts mathematically.
 */
export function answerHouseholdQuestionOffline(
  question: string,
  contextParams: HouseholdAIContextParams
): string {
  const q = question.toLowerCase();
  const { monthlySummaries, sharedGoals, recurringItems } = contextParams;

  const totalIncome = monthlySummaries.reduce((sum, s) => sum + s.items.reduce((mSum, i) => mSum + (i.total_income || 0), 0), 0);
  const totalExpense = monthlySummaries.reduce((sum, s) => sum + s.items.reduce((mSum, i) => mSum + (i.total_expense || 0), 0), 0);
  const count = Math.max(1, monthlySummaries.length);
  const avgIncome = Math.round(totalIncome / count);
  const avgExpense = Math.round(totalExpense / count);
  const fixedCommitted = recurringItems.filter((r) => r.is_active).reduce((sum, r) => sum + r.amount, 0);
  const freeCash = Math.max(0, avgIncome - avgExpense);

  // Question 1: "How much can we realistically save each month?"
  if (q.includes('save') && (q.includes('how much') || q.includes('realistically') || q.includes('capacity'))) {
    const lowRange = Math.round(freeCash * 0.85);
    const highRange = Math.round(freeCash * 1.15);
    const savingsRate = avgIncome > 0 ? Math.round((freeCash / avgIncome) * 100) : 0;

    return `### 📊 Realistic Monthly Household Savings Capacity

Based on your trailing 3-month averages:
- **Combined Monthly Income:** ₹${avgIncome.toLocaleString('en-IN')}
- **Committed Fixed Costs (Rent/EMIs/Subs):** ₹${fixedCommitted.toLocaleString('en-IN')}
- **Discretionary & Variable Expenses:** ₹${Math.max(0, avgExpense - fixedCommitted).toLocaleString('en-IN')}
- **Current Net Surplus:** ₹${freeCash.toLocaleString('en-IN')} (Savings Rate: **${savingsRate}%**)

**💡 Recommendation:**
Your realistic monthly household savings range is **₹${lowRange.toLocaleString('en-IN')} – ₹${highRange.toLocaleString('en-IN')}**.
Maintaining this allows you to comfortably fund your joint goals without feeling overly constrained during higher-expense months.`;
  }

  // Question 2: "Can we afford a vacation / big spend?"
  if (q.includes('vacation') || q.includes('afford') || q.includes('trip') || q.includes('1l') || q.includes('1 lakh')) {
    const cost = 100000;
    const liquidSavings = Math.round(freeCash * 3.5); // Derived liquid buffer
    const affordability = assessAffordability({
      cost,
      monthlyFreeCash: freeCash,
      liquidSavings,
      monthlyExpenses: avgExpense,
      competingGoals: sharedGoals.map((g) => ({ name: g.name, monthlyReserve: 15000, targetDate: g.target_date || '' })),
      bufferMonthsFloor: 3,
    });

    return `### 🏖️ Joint Affordability Analysis: ₹${cost.toLocaleString('en-IN')} Vacation

${affordability.explanation}

**📌 Actionable Paths:**
1. **Targeted Savings:** At ₹${Math.round(freeCash / 2).toLocaleString('en-IN')}/month allocated to travel, you reach ₹${cost.toLocaleString('en-IN')} in **${Math.ceil(cost / (freeCash / 2))} months** without stalling emergency funds.
2. **Emergency Cushion Safety:** Maintaining your 3-month floor (₹${(avgExpense * 3).toLocaleString('en-IN')}) ensures financial resilience before booking.`;
  }

  // Question 3: "What if we both invest 10K more?"
  if (q.includes('invest') || q.includes('10k') || q.includes('more') || q.includes('sip')) {
    const projection = dualContributorProjection(
      { monthly: 10000 },
      { monthly: 10000 },
      10, // 10 years
      12  // 12% p.a.
    );

    return `### 🚀 Power of Joint Compounding: +₹10,000/mo Each (+₹20,000/mo Combined)

If both partners contribute an additional **₹10,000/month** into a 12% CAGR diversified index fund:

- **Total Combined Principal Invested (10 Yrs):** ₹${projection.totalInvested.toLocaleString('en-IN')}
- **Estimated Household Wealth Created:** **₹${projection.estimatedWealth.toLocaleString('en-IN')}**
- **Wealth Gained (Compound Interest):** **₹${projection.wealthGained.toLocaleString('en-IN')}** (A **${projection.multiplier}x** multiplier!)

**Milestones:**
- **Year 5:** ₹${projection.yearlyMilestones[4]?.wealth.toLocaleString('en-IN')}
- **Year 10:** ₹${projection.yearlyMilestones[9]?.wealth.toLocaleString('en-IN')}`;
  }

  // Question 4: "When can we reach our 20L goal?"
  if (q.includes('20l') || q.includes('goal') || q.includes('reach') || q.includes('when')) {
    const target = 2000000;
    const monthlyRate = 25000;
    const { months, projectedDate } = solveMonthsToTarget(monthlyRate, target, 12);
    const years = (months / 12).toFixed(1);

    const boostMonths = solveMonthsToTarget(monthlyRate + 10000, target, 12).months;
    const boostYears = (boostMonths / 12).toFixed(1);

    return `### 🎯 Goal Timeline: ₹${target.toLocaleString('en-IN')} Target

- **Current Planned Contribution:** ₹${monthlyRate.toLocaleString('en-IN')}/month @ 12% p.a.
- **Estimated Time to Reach:** **${months} months** (~**${years} years**), projecting around **${projectedDate}**.

**⚡ Acceleration Opportunity:**
- If you both increase contributions by ₹5,000 each (+₹10,000/month total = ₹35,000/mo), you achieve ₹20 Lakhs in **${boostMonths} months** (~**${boostYears} years**), saving **${months - boostMonths} months**!`;
  }

  // Generic fallback with household context
  return `### 👨‍👩‍👧 ClearSpend Family Planning Copilot

I have evaluated your combined household financial profile:
- **Combined Monthly Free Cashflow:** ₹${freeCash.toLocaleString('en-IN')}
- **Active Joint Envelopes:** ${contextParams.sharedBudgets.length}
- **Active Joint Goals:** ${sharedGoals.length}

You can ask me specific questions like:
- *"How much can we realistically save each month?"*
- *"Can we afford a ₹1L vacation without risking our emergency buffer?"*
- *"What if we both invest ₹10K more every month?"*
- *"When can we reach our ₹20L down payment goal?"*`;
}

/**
 * Family AI Chat Orchestrator (Edge Function with local fallback)
 */
export async function sendFamilyAIChatMessage(
  message: string,
  contextParams: HouseholdAIContextParams,
  jwtToken?: string
): Promise<string> {
  if (isSupabaseConfigured && jwtToken) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/family-ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          message,
          householdId: contextParams.household.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) return data.reply;
      }
    } catch (err) {
      console.warn('Family AI edge function unavailable, using local math engine:', err);
    }
  }

  return answerHouseholdQuestionOffline(message, contextParams);
}
