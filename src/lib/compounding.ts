export interface CompoundingResult {
  monthlyAmount: number;
  years: number;
  cagrRate: number; // e.g. 12 for 12%
  totalInvested: number;
  estimatedWealth: number;
  wealthGained: number;
  multiplier: number;
  yearlyMilestones: {
    year: number;
    invested: number;
    wealth: number;
    wealthGain: number;
  }[];
}

export function calculateMonthlySIPCompounding(
  monthlyAmount: number,
  years: number = 20,
  annualRatePct: number = 12
): CompoundingResult {
  const r = annualRatePct / 100;
  const i = r / 12;
  const totalMonths = years * 12;

  const yearlyMilestones: {
    year: number;
    invested: number;
    wealth: number;
    wealthGain: number;
  }[] = [];

  for (let yr = 1; yr <= years; yr++) {
    const n = yr * 12;
    const fv = i > 0
      ? monthlyAmount * ((Math.pow(1 + i, n) - 1) / i) * (1 + i)
      : monthlyAmount * n;
    const inv = monthlyAmount * n;
    yearlyMilestones.push({
      year: yr,
      invested: Math.round(inv),
      wealth: Math.round(fv),
      wealthGain: Math.round(fv - inv),
    });
  }

  const finalMilestone = yearlyMilestones[yearlyMilestones.length - 1] || {
    invested: monthlyAmount * totalMonths,
    wealth: monthlyAmount * totalMonths,
    wealthGain: 0,
  };

  const totalInvested = finalMilestone.invested;
  const estimatedWealth = finalMilestone.wealth;
  const wealthGained = finalMilestone.wealthGain;
  const multiplier = totalInvested > 0 ? Number((estimatedWealth / totalInvested).toFixed(1)) : 1;

  return {
    monthlyAmount,
    years,
    cagrRate: annualRatePct,
    totalInvested,
    estimatedWealth,
    wealthGained,
    multiplier,
    yearlyMilestones,
  };
}

export function formatIndianCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export interface CompoundingPreset {
  id: string;
  icon: string;
  name: string;
  monthlyAmount: number;
  description: string;
}

export const COMPOUNDING_PRESETS: CompoundingPreset[] = [
  {
    id: 'food_delivery',
    icon: '🍔',
    name: 'Weekend Food Delivery',
    monthlyAmount: 2000,
    description: 'Cutting 2-3 deliveries a month (₹500/order)',
  },
  {
    id: 'daily_coffee',
    icon: '☕',
    name: 'Daily Café / Snack Run',
    monthlyAmount: 3000,
    description: 'Brewing coffee at home (₹100/day saved)',
  },
  {
    id: 'subscriptions',
    icon: '📺',
    name: 'Unused OTT / App Subscriptions',
    monthlyAmount: 1000,
    description: 'Canceling 2-3 inactive monthly subs',
  },
  {
    id: 'impulse_shopping',
    icon: '🛍️',
    name: 'Impulsive Online Buys',
    monthlyAmount: 5000,
    description: 'Applying a 48-hour wait rule on ecommerce carts',
  },
  {
    id: 'weekend_parties',
    icon: '🎉',
    name: 'Weekend Dining & Drinks',
    monthlyAmount: 7500,
    description: 'Hosting dinners at home instead of lounges',
  },
];

// -------------------------------------------------------------
// Phase 8: Family Finance Multi-Contributor Compounding & Solvers
// -------------------------------------------------------------

/**
 * Solve for the number of months required to reach a target financial amount.
 * When startingCorpus = 0:
 *   n = ln(1 + (FV * i) / (P * (1+i))) / ln(1+i)
 * When startingCorpus > 0:
 *   Monotonic binary search over n in [1, 720] months (up to 60 years).
 */
export function solveMonthsToTarget(
  monthlyContribution: number,
  targetAmount: number,
  annualRatePct: number,
  startingCorpus: number = 0
): { months: number; reachable: boolean; projectedDate: string } {
  if (targetAmount <= startingCorpus) {
    const today = new Date();
    return { months: 0, reachable: true, projectedDate: today.toISOString().split('T')[0] };
  }

  if (monthlyContribution <= 0 && startingCorpus <= 0) {
    return { months: 720, reachable: false, projectedDate: 'Unreachable without contributions' };
  }

  const r = annualRatePct / 100;
  const i = r / 12;

  // Closed-form for startingCorpus === 0 with valid positive rate
  if (startingCorpus === 0 && i > 0 && monthlyContribution > 0) {
    const numerator = 1 + (targetAmount * i) / (monthlyContribution * (1 + i));
    if (numerator > 0) {
      const nExact = Math.log(numerator) / Math.log(1 + i);
      const months = Math.ceil(nExact);
      if (months > 0 && months <= 720) {
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        return { months, reachable: true, projectedDate: d.toISOString().split('T')[0] };
      }
    }
  }

  // Monotonic Binary Search for Starting Corpus or Zero Interest Rate
  const fvAtMonth = (n: number): number => {
    const fvCorpus = startingCorpus * Math.pow(1 + i, n);
    const fvSIP = i > 0
      ? monthlyContribution * ((Math.pow(1 + i, n) - 1) / i) * (1 + i)
      : monthlyContribution * n;
    return fvCorpus + fvSIP;
  };

  let low = 1;
  let high = 720; // 60 years max
  let ans = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (fvAtMonth(mid) >= targetAmount) {
      ans = mid;
      high = mid - 1; // Seek earlier month
    } else {
      low = mid + 1;
    }
  }

  if (ans !== -1) {
    const d = new Date();
    d.setMonth(d.getMonth() + ans);
    return { months: ans, reachable: true, projectedDate: d.toISOString().split('T')[0] };
  }

  return { months: 720, reachable: false, projectedDate: 'Exceeds 60-year horizon' };
}

/**
 * Dual Contributor Projection
 * Allows two partners to simulate joint SIP investments with independent amounts and starting dates.
 */
export function dualContributorProjection(
  a: { monthly: number; startMonth?: string },
  b: { monthly: number; startMonth?: string },
  years: number = 10,
  annualRatePct: number = 12
): CompoundingResult & { contributionSplit: { a: number; b: number; aPct: number; bPct: number } } {
  const combinedMonthly = a.monthly + b.monthly;
  const baseResult = calculateMonthlySIPCompounding(combinedMonthly, years, annualRatePct);

  const totalInvestedA = a.monthly * years * 12;
  const totalInvestedB = b.monthly * years * 12;
  const totalCombined = totalInvestedA + totalInvestedB;

  const aPct = totalCombined > 0 ? Math.round((totalInvestedA / totalCombined) * 100) : 50;
  const bPct = totalCombined > 0 ? Math.round((totalInvestedB / totalCombined) * 100) : 50;

  return {
    ...baseResult,
    contributionSplit: {
      a: totalInvestedA,
      b: totalInvestedB,
      aPct,
      bPct,
    },
  };
}

/**
 * Affordability & Emergency Buffer Assessment Engine
 * Determines if a joint expense (e.g. Vacation, Vehicle, Wedding) is comfortable, stretch, or dangerous,
 * checking against an explicit 3-month emergency reserve floor.
 */
export function assessAffordability(params: {
  cost: number;
  monthlyFreeCash: number;
  liquidSavings: number;
  monthlyExpenses: number;
  competingGoals: { name: string; monthlyReserve: number; targetDate: string }[];
  bufferMonthsFloor?: number; // default 3 months
}): {
  verdict: 'comfortable' | 'stretch' | 'not_yet';
  monthsToSave: number;
  bufferAfterMonths: number;
  breachesBuffer: boolean;
  goalImpacts: { name: string; delayMonths: number }[];
  explanation: string;
} {
  const bufferFloor = params.bufferMonthsFloor ?? 3;
  const requiredEmergencyBuffer = params.monthlyExpenses * bufferFloor;
  const freeCash = Math.max(1, params.monthlyFreeCash);

  const monthsToSave = Math.ceil(params.cost / freeCash);
  const liquidAfterDirectSpend = Math.max(0, params.liquidSavings - params.cost);
  const bufferAfterMonths = Number((liquidAfterDirectSpend / Math.max(1, params.monthlyExpenses)).toFixed(1));
  const breachesBuffer = liquidAfterDirectSpend < requiredEmergencyBuffer;

  // Impact on competing goals (if savings diverted)
  const goalImpacts = params.competingGoals.map((g) => {
    const delay = g.monthlyReserve > 0
      ? Math.ceil((params.cost * (g.monthlyReserve / Math.max(1, params.monthlyFreeCash))) / g.monthlyReserve)
      : 1;
    return {
      name: g.name,
      delayMonths: Math.min(delay, 24),
    };
  });

  let verdict: 'comfortable' | 'stretch' | 'not_yet' = 'comfortable';
  let explanation = '';

  if (params.cost <= params.liquidSavings - requiredEmergencyBuffer) {
    verdict = 'comfortable';
    explanation = `You have ₹${Math.round(params.liquidSavings).toLocaleString('en-IN')} in liquid savings. Paying ₹${Math.round(params.cost).toLocaleString('en-IN')} upfront leaves ₹${Math.round(liquidAfterDirectSpend).toLocaleString('en-IN')} (${bufferAfterMonths} months of emergency runway, safely above the ${bufferFloor}-month floor).`;
  } else if (!breachesBuffer || monthsToSave <= 6) {
    verdict = 'stretch';
    explanation = `Funding this upfront reduces your emergency runway to ${bufferAfterMonths} months (below the recommended ${bufferFloor}-month safety net of ₹${Math.round(requiredEmergencyBuffer).toLocaleString('en-IN')}). Recommended path: Save ₹${Math.round(freeCash).toLocaleString('en-IN')}/month for ${monthsToSave} months to purchase without touching your emergency reserve.`;
  } else {
    verdict = 'not_yet';
    explanation = `Spending ₹${Math.round(params.cost).toLocaleString('en-IN')} severely drains your liquid safety net to ${bufferAfterMonths} months. At your current free cashflow of ₹${Math.round(freeCash).toLocaleString('en-IN')}/month, it requires ${monthsToSave} months of dedicated savings. Prioritize building your 3-month emergency cushion first.`;
  }

  return {
    verdict,
    monthsToSave,
    bufferAfterMonths,
    breachesBuffer,
    goalImpacts,
    explanation,
  };
}
