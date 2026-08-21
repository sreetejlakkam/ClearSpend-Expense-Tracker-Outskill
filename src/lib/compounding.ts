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
