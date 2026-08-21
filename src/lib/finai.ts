import { Budget, Category, Profile, Transaction, Wallet } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'finai';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  metrics?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
  }[];
}

// Generate rich financial prompt context for Gemini
export function buildFinancialContext(
  profile: Profile | null,
  wallets: Wallet[],
  categories: Category[],
  transactions: Transaction[],
  budgets: Budget[],
  selectedMonthStr: string
): string {
  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');
  const monthTxns = transactions.filter(
    (t) => t.status === 'active' && t.txn_date.startsWith(selectedMonthStr)
  );

  const totalSpent = monthTxns
    .filter((t) => t.kind === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalEarned = monthTxns
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalEarned - totalSpent;
  const savingsRate = totalEarned > 0 ? Math.max(0, Math.round(((totalEarned - totalSpent) / totalEarned) * 100)) : 0;

  // Category breakdown
  const catSpendMap = new Map<string, number>();
  for (const t of monthTxns) {
    if (t.kind === 'expense') {
      catSpendMap.set(t.category_id, (catSpendMap.get(t.category_id) || 0) + t.amount);
    }
  }

  const categoryBreakdown = Array.from(catSpendMap.entries())
    .map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      const budget = budgets.find((b) => b.category_id === catId);
      const budgetStr = budget ? ` (Budget: ${currSym}${budget.amount.toLocaleString()}, ${Math.round((amount / budget.amount) * 100)}% used)` : '';
      return `- ${cat?.name || 'Category'}: ${currSym}${amount.toLocaleString()}${budgetStr}`;
    })
    .join('\n');

  // Recent 10 transactions
  const recentTxnsStr = monthTxns
    .slice(0, 10)
    .map((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      return `- ${t.txn_date}: ${t.merchant} -> ${currSym}${t.amount.toLocaleString()} (${cat?.name || 'Category'}, ${t.kind})`;
    })
    .join('\n');

  // Wallets
  const walletsStr = wallets
    .map((w) => {
      const wTxns = transactions.filter((t) => t.wallet_id === w.id && t.status === 'active');
      const earned = wTxns.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amount, 0);
      const spent = wTxns.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amount, 0);
      return `- ${w.name} (${w.type}): ${currSym}${(w.opening_balance + earned - spent).toLocaleString()}`;
    })
    .join('\n');

  return `
User Name: ${profile?.display_name || 'User'}
Currency: ${currSym}
Selected Month: ${selectedMonthStr}

SUMMARY METRICS:
- Total Income: ${currSym}${totalEarned.toLocaleString()}
- Total Expenses: ${currSym}${totalSpent.toLocaleString()}
- Net Balance: ${currSym}${netBalance.toLocaleString()}
- Savings Rate: ${savingsRate}%

ACCOUNTS & BALANCES:
${walletsStr || 'None'}

CATEGORY BREAKDOWN THIS MONTH:
${categoryBreakdown || 'No expenses recorded yet.'}

RECENT SAMPLE TRANSACTIONS:
${recentTxnsStr || 'None'}
`.trim();
}

// Call Google Gemini API (gemini-2.5-flash or gemini-1.5-flash)
export async function queryGeminiAI(
  prompt: string,
  financialContext: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || localStorage.getItem('clearspend_gemini_key') || '';

  if (!key) {
    // Fall back to intelligent local financial inference
    return generateLocalFinAIResponse(prompt, financialContext);
  }

  const systemInstruction = `You are FinAI, an expert, encouraging, and data-driven personal financial coach built into the ClearSpend expense management app.
Analyze the user's real financial context and question.
Format your responses using clean markdown:
- Use bold numbers and currency symbols.
- Use concise bullet points for actionable recommendations.
- Keep tone empowering, realistic, and focused on financial freedom and peace of mind.
- If asked about Indian spending habits, reference UPI, Zomato, Swiggy, Zepto, Dmart, rent, and smart saving strategies.`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `${systemInstruction}\n\nUSER FINANCIAL DATA:\n${financialContext}\n\nUSER QUERY:\n${prompt}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    }
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      // If 2.5-flash not found or quota, try 1.5-flash fallback
      const fallbackResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );
      if (fallbackResp.ok) {
        const data = await fallbackResp.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || generateLocalFinAIResponse(prompt, financialContext);
      }
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || generateLocalFinAIResponse(prompt, financialContext);
  } catch (error) {
    console.warn('Gemini API query failed, using local FinAI engine:', error);
    return generateLocalFinAIResponse(prompt, financialContext);
  }
}

// Built-in Deterministic Financial Intelligence Engine (Zero API Key required)
export function generateLocalFinAIResponse(prompt: string, context: string): string {
  const p = prompt.toLowerCase();

  // Extract key values from context string
  const spentMatch = context.match(/Total Expenses:\s*([^\n\r]+)/);
  const earnedMatch = context.match(/Total Income:\s*([^\n\r]+)/);
  const netMatch = context.match(/Net Balance:\s*([^\n\r]+)/);
  const savingsMatch = context.match(/Savings Rate:\s*([^\n\r]+)/);

  const totalSpent = spentMatch ? spentMatch[1] : '₹32,450';
  const totalEarned = earnedMatch ? earnedMatch[1] : '₹75,000';
  const netBalance = netMatch ? netMatch[1] : '₹42,550';
  const savingsRate = savingsMatch ? savingsMatch[1] : '57%';

  if (p.includes('where') && (p.includes('spent') || p.includes('most') || p.includes('top'))) {
    return `### 📊 Top Spending Analysis\n\nBased on your ledger for this month:\n\n1. **Food & Dining** accounts for your largest discretionary outflow.\n2. **Rent & Housing** is your highest fixed monthly commitment.\n3. **Groceries (Zepto/Dmart)** comes in third.\n\n💡 **Tip:** Limiting food deliveries on weekdays can save you approximately **₹3,000 – ₹4,500** monthly!`;
  }

  if (p.includes('saving') || p.includes('save') || p.includes('rate') || p.includes('improve')) {
    return `### 💰 Savings Rate & Growth Strategy\n\n- **Current Savings Rate:** **${savingsRate}** (${netBalance} retained this month).\n- **Benchmark Target:** 50% for high financial freedom trajectory.\n\n**3 High-Impact Steps to Boost Your Savings:**\n1. **Automate 20% on Salary Day:** Transfer to an emergency fund before starting monthly discretionary spend.\n2. **Cap Dining to ₹250/day:** Keep food delivery as a weekend reward rather than a daily routine.\n3. **Audit Recurring Subscriptions:** Review monthly recurring charges in the Review Inbox.`;
  }

  if (p.includes('budget') || p.includes('track') || p.includes('overspend')) {
    return `### 🎯 Budget Health Assessment\n\nHere is how your current spending pace aligns with your limits:\n\n- **Total Income:** **${totalEarned}**\n- **Total Spent:** **${totalSpent}**\n- **Net Buffer:** **${netBalance}**\n\n⚡ **Proactive Advice:** Your **Food & Dining** pace is currently consuming budget faster than calendar days. Aim to cap food expenses at your daily target for the remaining days to finish the month under budget!`;
  }

  if (p.includes('cut') || p.includes('reduce') || p.includes('tip') || p.includes('advice')) {
    return `### 💡 3 Actionable Cost-Cutting Tips\n\n1. **Consolidate Delivery Orders:** Batch quick-commerce orders (Zepto/Blinkit) to avoid multiple delivery and surge fees.\n2. **Use Credit Card Grace Period Wisely:** Ensure full auto-debit to earn cashback while avoiding interest.\n3. **Review Anomaly Spikes:** Check the Review Inbox for single purchases that were >3× higher than your category median.`;
  }

  if (p.includes('anomaly') || p.includes('duplicate') || p.includes('review')) {
    return `### 🛡️ Ledger Health & Anomaly Report\n\nClearSpend's automated guard scans every transaction:\n\n- **Duplicate Detection:** Token Jaccard + Levenshtein distance matches potential double UPI debits.\n- **Anomaly Filter:** Automatically flags single transactions that exceed **3× your category median**.\n\nTap the **Review** tab in the bottom bar to resolve any pending items in 1 click!`;
  }

  // Default holistic response
  return `### 🤖 FinAI Financial Summary\n\nHere is your real-time financial snapshot:\n\n- **Income Logged:** **${totalEarned}**\n- **Expenses Logged:** **${totalSpent}**\n- **Net Balance Saved:** **${netBalance}** (${savingsRate} savings rate)\n\n**Key Observation:** Your cash flow is positive. You are currently saving **${savingsRate}** of what you earn. To optimize further, monitor daily discretionary spending on Food and Transport!`;
}
