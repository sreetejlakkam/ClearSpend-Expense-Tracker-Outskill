import { AnomalyItem, Category, DuplicatePair, Insight, Transaction } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

function levenshteinDistance(s1: string, s2: string): number {
  const a = (s1 || '').toLowerCase().trim();
  const b = (s2 || '').toLowerCase().trim();
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function calculateMerchantSimilarity(s1: string, s2: string): number {
  const a = (s1 || '').toLowerCase().trim();
  const b = (s2 || '').toLowerCase().trim();
  if (!a && !b) return 1.0;
  if (!a || !b) return 0.0;
  if (a === b) return 1.0;
  if (a.includes(b) || b.includes(a)) return 0.95;

  // Token Jaccard overlap
  const tokensA = new Set(a.split(/\s+/).filter(Boolean));
  const tokensB = new Set(b.split(/\s+/).filter(Boolean));
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  const tokenSim = union > 0 ? intersection / union : 0;

  if (tokenSim >= 0.3) {
    return Math.max(0.85, tokenSim);
  }

  const maxLen = Math.max(a.length, b.length);
  const dist = levenshteinDistance(a, b);
  const levSim = 1 - dist / maxLen;

  return Math.max(tokenSim, levSim);
}

// 1. Duplicate Scanner
export function scanDuplicates(transactions: Transaction[], windowDays: number = 60): DuplicatePair[] {
  const activeTxns = transactions.filter((t) => t.status === 'active');
  const sorted = [...activeTxns].sort(
    (a, b) => new Date(a.txn_date).getTime() - new Date(b.txn_date).getTime()
  );

  const duplicatePairs: DuplicatePair[] = [];
  const visitedPairs = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const itemA = sorted[i]; // older
      const itemB = sorted[j]; // newer

      const key = `${itemA.id}_${itemB.id}`;
      if (visitedPairs.has(key)) continue;

      const dateA = new Date(itemA.txn_date).getTime();
      const dateB = new Date(itemB.txn_date).getTime();
      const diffDays = Math.abs(dateB - dateA) / (1000 * 60 * 60 * 24);

      if (diffDays > windowDays) continue;

      // Fingerprint match
      if (itemA.fingerprint && itemB.fingerprint && itemA.fingerprint === itemB.fingerprint) {
        visitedPairs.add(key);
        duplicatePairs.push({
          id: `dup_${itemA.id}_${itemB.id}`,
          original: itemA,
          duplicate: itemB,
          reason: 'Identical transaction fingerprint',
          similarity: 1.0,
        });
        continue;
      }

      // Amount match + kind match + date within 2 days + merchant similarity >= 0.75
      if (Number(itemA.amount) === Number(itemB.amount) && itemA.kind === itemB.kind) {
        if (diffDays <= 2) {
          const sim = calculateMerchantSimilarity(itemA.merchant, itemB.merchant);
          if (sim >= 0.75) {
            visitedPairs.add(key);
            duplicatePairs.push({
              id: `dup_${itemA.id}_${itemB.id}`,
              original: itemA,
              duplicate: itemB,
              reason: `Same amount (${itemA.amount}) and merchant within ${Math.round(diffDays)} day(s)`,
              similarity: sim,
            });
          }
        }
      }
    }
  }

  return duplicatePairs;
}

// 2. Anomaly Scanner (Transactions > 3x Category Median)
export function scanAnomalies(transactions: Transaction[], categories: Category[]): AnomalyItem[] {
  const activeExpenses = transactions.filter((t) => t.status === 'active' && t.kind === 'expense');
  const anomalies: AnomalyItem[] = [];

  // Group by category
  const catMap = new Map<string, number[]>();
  for (const t of activeExpenses) {
    if (!catMap.has(t.category_id)) {
      catMap.set(t.category_id, []);
    }
    catMap.get(t.category_id)!.push(t.amount);
  }

  // Calculate medians
  const medianMap = new Map<string, number>();
  for (const [catId, amounts] of catMap.entries()) {
    if (amounts.length >= 3) {
      const sorted = [...amounts].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      medianMap.set(catId, median);
    }
  }

  // Check last 45 days transactions for > 3x median
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 45);

  for (const t of activeExpenses) {
    if (new Date(t.txn_date) < cutoff) continue;
    const median = medianMap.get(t.category_id);
    if (median && median > 100) {
      const multiplier = t.amount / median;
      if (multiplier >= 3.0) {
        const cat = categories.find((c) => c.id === t.category_id);
        anomalies.push({
          id: `anomaly_${t.id}`,
          transaction: t,
          categoryName: cat?.name || 'Category',
          medianAmount: Math.round(median),
          multiplier: Math.round(multiplier * 10) / 10,
        });
      }
    }
  }

  return anomalies;
}

// 3. Generate Smart Financial Insights
export async function generateAIInsights(
  transactions: Transaction[],
  categories: Category[],
  userId: string,
  currency: string = 'INR',
  selectedDate: Date = new Date()
): Promise<Insight[]> {
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth(); // 0-indexed

  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysElapsed = Math.min(selectedDate.getDate(), daysInMonth);

  // Filter expenses
  const activeExpenses = transactions.filter((t) => t.status === 'active' && t.kind === 'expense');

  const thisMonthExpenses = activeExpenses.filter((t) => t.txn_date.startsWith(currentMonthStr));
  const lastMonthExpenses = activeExpenses.filter((t) => t.txn_date.startsWith(lastMonthStr));

  const totalThisMonth = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const totalLastMonth = lastMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

  const projectedSpend = daysElapsed > 0 ? (totalThisMonth / daysElapsed) * daysInMonth : totalThisMonth;

  // Category breakdown for this month & last month
  const thisMonthCatMap = new Map<string, number>();
  for (const t of thisMonthExpenses) {
    thisMonthCatMap.set(t.category_id, (thisMonthCatMap.get(t.category_id) || 0) + t.amount);
  }

  const lastMonthCatMap = new Map<string, number>();
  for (const t of lastMonthExpenses) {
    lastMonthCatMap.set(t.category_id, (lastMonthCatMap.get(t.category_id) || 0) + t.amount);
  }

  // Top Movers
  const topMovers: Array<{ category: string; increase: number; changePct: number }> = [];
  for (const cat of categories) {
    if (cat.kind !== 'expense') continue;
    const thisSpend = thisMonthCatMap.get(cat.id) || 0;
    const lastSpend = lastMonthCatMap.get(cat.id) || 0;
    if (thisSpend > lastSpend && thisSpend > 200) {
      const increase = thisSpend - lastSpend;
      const changePct = lastSpend > 0 ? ((thisSpend - lastSpend) / lastSpend) * 100 : 100;
      topMovers.push({
        category: cat.name,
        increase,
        changePct,
      });
    }
  }
  topMovers.sort((a, b) => b.increase - a.increase);

  // Detect Recurring Subscriptions (same merchant + similar amount appearing in multiple months)
  const merchantHistory = new Map<string, Set<string>>();
  const merchantAmounts = new Map<string, number>();

  for (const t of activeExpenses) {
    const mName = (t.merchant || '').toLowerCase().trim();
    if (!mName) continue;
    const mMonth = t.txn_date.slice(0, 7);

    if (!merchantHistory.has(mName)) {
      merchantHistory.set(mName, new Set());
      merchantAmounts.set(mName, t.amount);
    }
    merchantHistory.get(mName)!.add(mMonth);
  }

  const subscriptions: Array<{ merchant: string; amount: number; monthsCount: number }> = [];
  for (const [mName, months] of merchantHistory.entries()) {
    if (months.size >= 2) {
      subscriptions.push({
        merchant: mName.charAt(0).toUpperCase() + mName.slice(1),
        amount: merchantAmounts.get(mName) || 0,
        monthsCount: months.size,
      });
    }
  }

  const statsPayload = {
    totalSpendThisMonth: totalThisMonth,
    totalSpendLastMonth: totalLastMonth,
    daysElapsed,
    daysInMonth,
    projectedEndOfMonthSpend: projectedSpend,
    categoryMoMChanges: topMovers,
    topMovers: topMovers.slice(0, 3),
    detectedSubscriptions: subscriptions.slice(0, 3),
  };

  // Try calling Edge function
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: {
          month: currentMonthStr,
          currency,
          stats: statsPayload,
        },
      });

      if (!error && data?.insights && Array.isArray(data.insights)) {
        return data.insights.map((card: any, idx: number) => ({
          id: `insight_${Date.now()}_${idx}`,
          user_id: userId,
          type: card.type || 'forecast',
          title: card.title,
          body: card.body,
          period_start: `${currentMonthStr}-01`,
          period_end: `${currentMonthStr}-${daysInMonth}`,
          is_dismissed: false,
          created_at: new Date().toISOString(),
        }));
      }
    } catch (edgeErr) {
      console.warn('Edge function invoke failed for insights, using local engine:', edgeErr);
    }
  }

  // High quality deterministic insight engine with rich user-relevant analytics
  const currSym = currency === 'INR' ? '₹' : currency;
  const cards: Insight[] = [];

  // Insight 1: End of Month Pacing & Burn Forecast
  const diffFromLastMonth = projectedSpend - totalLastMonth;
  const isPacingHigher = diffFromLastMonth > 0 && totalLastMonth > 0;
  const avgBurn = Math.round(totalThisMonth / Math.max(daysElapsed, 1));

  cards.push({
    id: `insight_forecast_${Date.now()}_1`,
    user_id: userId,
    type: 'forecast',
    title: `Projected Spend: ${currSym}${Math.round(projectedSpend).toLocaleString()}`,
    body: isPacingHigher
      ? `At your current pace of ${currSym}${avgBurn}/day, you are tracking to spend ${currSym}${Math.round(diffFromLastMonth).toLocaleString()} more than last month. Consider trimming discretionary dining.`
      : `You are on track to spend ${currSym}${Math.round(projectedSpend).toLocaleString()} with a sustainable daily average of ${currSym}${avgBurn}/day.`,
    period_start: `${currentMonthStr}-01`,
    period_end: `${currentMonthStr}-${daysInMonth}`,
    is_dismissed: false,
    created_at: new Date().toISOString(),
  });

  // Insight 2: Weekend vs Weekday Dining Spike Analysis
  let weekendDiningSpend = 0;
  let totalDiningSpend = 0;
  for (const t of thisMonthExpenses) {
    const cat = categories.find((c) => c.id === t.category_id);
    const catNameLower = (cat?.name || '').toLowerCase();
    if (catNameLower.includes('food') || catNameLower.includes('dining') || catNameLower.includes('restaurant')) {
      totalDiningSpend += t.amount;
      const dayOfWeek = new Date(t.txn_date).getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
      if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
        weekendDiningSpend += t.amount;
      }
    }
  }

  if (totalDiningSpend > 1000) {
    const weekendRatio = Math.round((weekendDiningSpend / totalDiningSpend) * 100);
    if (weekendRatio >= 55) {
      cards.push({
        id: `insight_weekend_${Date.now()}_2`,
        user_id: userId,
        type: 'top_mover',
        title: `Weekend Dining Surge: ${weekendRatio}% of Food Spend`,
        body: `${currSym}${weekendDiningSpend.toLocaleString()} out of ${currSym}${totalDiningSpend.toLocaleString()} dining spend occurs on Fri–Sun. Packing lunch or meal-prepping can save ~${currSym}${Math.round(weekendDiningSpend * 0.35).toLocaleString()}/month!`,
        period_start: `${currentMonthStr}-01`,
        period_end: `${currentMonthStr}-${daysInMonth}`,
        is_dismissed: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Insight 3: Micro-Transaction (Chai / Snacks / UPI) Leakage Audit
  const microTransactions = thisMonthExpenses.filter((t) => t.amount <= 250);
  const totalMicroSpend = microTransactions.reduce((sum, t) => sum + t.amount, 0);
  if (microTransactions.length >= 4) {
    cards.push({
      id: `insight_micro_${Date.now()}_3`,
      user_id: userId,
      type: 'anomaly',
      title: `Micro-Spend Audit: ${microTransactions.length} items (${currSym}${totalMicroSpend.toLocaleString()})`,
      body: `Frequent small UPI payments under ${currSym}250 (chai, quick snacks, impulse treats) quietly added up to ${currSym}${totalMicroSpend.toLocaleString()} this month.`,
      period_start: `${currentMonthStr}-01`,
      period_end: `${currentMonthStr}-${daysInMonth}`,
      is_dismissed: false,
      created_at: new Date().toISOString(),
    });
  }

  // Insight 4: Needs (Essential) vs Wants (Discretionary) 50/30/20 Ratio
  let essentialSpend = 0;
  let discretionarySpend = 0;
  for (const t of thisMonthExpenses) {
    const cat = categories.find((c) => c.id === t.category_id);
    const catName = (cat?.name || '').toLowerCase();
    if (
      catName.includes('rent') ||
      catName.includes('grocer') ||
      catName.includes('transport') ||
      catName.includes('fuel') ||
      catName.includes('bill') ||
      catName.includes('health') ||
      catName.includes('medic') ||
      catName.includes('util')
    ) {
      essentialSpend += t.amount;
    } else {
      discretionarySpend += t.amount;
    }
  }

  if (totalThisMonth > 2000) {
    const essentialPct = Math.round((essentialSpend / totalThisMonth) * 100);
    const discretionaryPct = 100 - essentialPct;
    cards.push({
      id: `insight_ratio_${Date.now()}_4`,
      user_id: userId,
      type: 'streak',
      title: `Budget Split: ${essentialPct}% Needs vs ${discretionaryPct}% Wants`,
      body:
        discretionaryPct <= 35
          ? `Great balance! Your lifestyle spending is well within the classic 50/30/20 benchmark (${discretionaryPct}% discretionary).`
          : `Discretionary spending is at ${discretionaryPct}%. Trimming ${currSym}${Math.round(discretionarySpend * 0.2).toLocaleString()} could boost your monthly savings rate significantly.`,
      period_start: `${currentMonthStr}-01`,
      period_end: `${currentMonthStr}-${daysInMonth}`,
      is_dismissed: false,
      created_at: new Date().toISOString(),
    });
  }

  // Insight 5: Top Mover Category
  if (topMovers.length > 0) {
    const top = topMovers[0];
    cards.push({
      id: `insight_mover_${Date.now()}_5`,
      user_id: userId,
      type: 'top_mover',
      title: `${top.category} is up ${Math.round(top.changePct)}% vs Last Month`,
      body: `You spent ${currSym}${Math.round(top.increase).toLocaleString()} more on ${top.category} compared to this time last month. Check if this is an anomaly or lifestyle creep.`,
      period_start: `${currentMonthStr}-01`,
      period_end: `${currentMonthStr}-${daysInMonth}`,
      is_dismissed: false,
      created_at: new Date().toISOString(),
    });
  }

  // Insight 6: Subscriptions & Recurring Charges
  if (subscriptions.length > 0) {
    const sub = subscriptions[0];
    cards.push({
      id: `insight_sub_${Date.now()}_6`,
      user_id: userId,
      type: 'subscription',
      title: `Active Recurring Charge: ${sub.merchant}`,
      body: `${currSym}${sub.amount.toLocaleString()} billed consecutively across ${sub.monthsCount} months. Review if you are actively using this subscription.`,
      period_start: `${currentMonthStr}-01`,
      period_end: `${currentMonthStr}-${daysInMonth}`,
      is_dismissed: false,
      created_at: new Date().toISOString(),
    });
  }

  return cards;
}

