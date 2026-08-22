import { Category, CategoryRule, ParsedTransactionResult, TransactionKind, Wallet } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

// Helper: Resolve relative dates against given reference date
export function resolveRelativeDate(text: string, refDate: Date = new Date()): string {
  const lower = text.toLowerCase();
  const d = new Date(refDate);

  if (lower.includes('day before yesterday')) {
    d.setDate(d.getDate() - 2);
  } else if (lower.includes('yesterday')) {
    d.setDate(d.getDate() - 1);
  } else if (lower.includes('last friday')) {
    const day = d.getDay();
    const diff = (day <= 5 ? 7 : 0) + day - 5;
    d.setDate(d.getDate() - diff);
  } else if (lower.includes('last monday')) {
    const day = d.getDay();
    const diff = (day <= 1 ? 7 : 0) + day - 1;
    d.setDate(d.getDate() - diff);
  }

  return d.toISOString().split('T')[0];
}

// Helper: Extract positive amount with Indian shorthand support
export function extractAmount(text: string): number | null {
  // Check shorthand with 'k' e.g. "2k", "1.5k", "2.5 k"
  const kMatch = text.match(/(?:(?:rs\.?|inr|₹)\s*)?(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val * 1000);
  }

  // Check shorthand with 'l' or 'lakh' e.g. "1l", "1.5 lakh"
  const lMatch = text.match(/(?:(?:rs\.?|inr|₹)\s*)?(\d+(?:\.\d+)?)\s*(?:l|lac|lakh)\b/i);
  if (lMatch) {
    const val = parseFloat(lMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val * 100000);
  }

  // Check standard numbers with currency prefix or standalone numbers
  const numMatches = text.match(/(?:(?:rs\.?|inr|₹)\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/gi);
  if (numMatches) {
    for (const match of numMatches) {
      const clean = match.replace(/[^0-9.]/g, '');
      const val = parseFloat(clean);
      if (!isNaN(val) && val > 0) {
        return val;
      }
    }
  }

  return null;
}

// Built-in keyword-to-category dictionary for Indian spending patterns
const KEYWORD_MAP: Record<string, { category: string; confidence: number; merchant?: string }> = {
  // Food & Dining
  zomato: { category: 'Food & Dining', confidence: 0.95, merchant: 'Zomato' },
  swiggy: { category: 'Food & Dining', confidence: 0.95, merchant: 'Swiggy' },
  mcdonalds: { category: 'Food & Dining', confidence: 0.95, merchant: "McDonald's" },
  kfc: { category: 'Food & Dining', confidence: 0.95, merchant: 'KFC' },
  dominos: { category: 'Food & Dining', confidence: 0.95, merchant: "Domino's" },
  starbucks: { category: 'Food & Dining', confidence: 0.95, merchant: 'Starbucks' },
  chai: { category: 'Food & Dining', confidence: 0.9, merchant: 'Chai Point' },
  coffee: { category: 'Food & Dining', confidence: 0.9, merchant: 'Cafe Coffee Day' },
  lunch: { category: 'Food & Dining', confidence: 0.85, merchant: 'Lunch' },
  dinner: { category: 'Food & Dining', confidence: 0.85, merchant: 'Dinner' },
  breakfast: { category: 'Food & Dining', confidence: 0.85, merchant: 'Breakfast' },
  snacks: { category: 'Food & Dining', confidence: 0.85, merchant: 'Snacks' },
  restaurant: { category: 'Food & Dining', confidence: 0.85, merchant: 'Restaurant' },
  dhaba: { category: 'Food & Dining', confidence: 0.9, merchant: 'Dhaba' },
  biryani: { category: 'Food & Dining', confidence: 0.9, merchant: 'Biryani House' },

  // Groceries
  blinkit: { category: 'Groceries', confidence: 0.95, merchant: 'Blinkit' },
  zepto: { category: 'Groceries', confidence: 0.95, merchant: 'Zepto' },
  instamart: { category: 'Groceries', confidence: 0.95, merchant: 'Swiggy Instamart' },
  bigbasket: { category: 'Groceries', confidence: 0.95, merchant: 'BigBasket' },
  bbdaily: { category: 'Groceries', confidence: 0.95, merchant: 'BB Daily' },
  dmart: { category: 'Groceries', confidence: 0.95, merchant: 'DMart' },
  milk: { category: 'Groceries', confidence: 0.9, merchant: 'Milk & Dairy' },
  vegetables: { category: 'Groceries', confidence: 0.9, merchant: 'Vegetables' },
  veggies: { category: 'Groceries', confidence: 0.9, merchant: 'Veggies' },
  fruits: { category: 'Groceries', confidence: 0.9, merchant: 'Fruits' },
  supermarket: { category: 'Groceries', confidence: 0.9, merchant: 'Supermarket' },
  kirana: { category: 'Groceries', confidence: 0.9, merchant: 'Kirana Store' },

  // Transport
  uber: { category: 'Transport', confidence: 0.95, merchant: 'Uber' },
  ola: { category: 'Transport', confidence: 0.95, merchant: 'Ola Cabs' },
  rapido: { category: 'Transport', confidence: 0.95, merchant: 'Rapido' },
  metro: { category: 'Transport', confidence: 0.95, merchant: 'Metro Rail' },
  auto: { category: 'Transport', confidence: 0.85, merchant: 'Auto Fare' },
  petrol: { category: 'Transport', confidence: 0.95, merchant: 'Petrol Pump' },
  fuel: { category: 'Transport', confidence: 0.95, merchant: 'Fuel' },
  diesel: { category: 'Transport', confidence: 0.95, merchant: 'Diesel' },
  toll: { category: 'Transport', confidence: 0.9, merchant: 'Fastag Toll' },
  fastag: { category: 'Transport', confidence: 0.95, merchant: 'Fastag Recharge' },
  flight: { category: 'Transport', confidence: 0.9, merchant: 'Airlines' },
  indigo: { category: 'Transport', confidence: 0.95, merchant: 'IndiGo' },
  irctc: { category: 'Transport', confidence: 0.95, merchant: 'IRCTC Train' },

  // Shopping
  amazon: { category: 'Shopping', confidence: 0.95, merchant: 'Amazon India' },
  flipkart: { category: 'Shopping', confidence: 0.95, merchant: 'Flipkart' },
  myntra: { category: 'Shopping', confidence: 0.95, merchant: 'Myntra' },
  ajio: { category: 'Shopping', confidence: 0.95, merchant: 'Ajio' },
  nykaa: { category: 'Shopping', confidence: 0.95, merchant: 'Nykaa' },
  zara: { category: 'Shopping', confidence: 0.95, merchant: 'Zara' },
  h_m: { category: 'Shopping', confidence: 0.95, merchant: 'H&M' },
  clothes: { category: 'Shopping', confidence: 0.85, merchant: 'Clothing' },
  shoes: { category: 'Shopping', confidence: 0.85, merchant: 'Footwear' },

  // Bills & Utilities
  airtel: { category: 'Bills & Utilities', confidence: 0.95, merchant: 'Airtel' },
  jio: { category: 'Bills & Utilities', confidence: 0.95, merchant: 'Jio' },
  vi: { category: 'Bills & Utilities', confidence: 0.9, merchant: 'Vodafone Idea' },
  wifi: { category: 'Bills & Utilities', confidence: 0.9, merchant: 'WiFi Broadband' },
  broadband: { category: 'Bills & Utilities', confidence: 0.9, merchant: 'Broadband' },
  electricity: { category: 'Bills & Utilities', confidence: 0.95, merchant: 'Electricity Bill' },
  bescom: { category: 'Bills & Utilities', confidence: 0.95, merchant: 'BESCOM' },
  water: { category: 'Bills & Utilities', confidence: 0.9, merchant: 'Water Bill' },
  cylinder: { category: 'Bills & Utilities', confidence: 0.95, merchant: 'LPG Gas Cylinder' },
  gas: { category: 'Bills & Utilities', confidence: 0.9, merchant: 'Gas Bill' },
  maintenance: { category: 'Bills & Utilities', confidence: 0.85, merchant: 'Society Maintenance' },

  // Rent
  rent: { category: 'Rent', confidence: 0.95, merchant: 'House Rent' },
  landlord: { category: 'Rent', confidence: 0.95, merchant: 'Landlord' },
  pg: { category: 'Rent', confidence: 0.9, merchant: 'PG Accommodation' },

  // Health
  apollo: { category: 'Health', confidence: 0.95, merchant: 'Apollo Pharmacy' },
  medplus: { category: 'Health', confidence: 0.95, merchant: 'MedPlus' },
  pharmeasy: { category: 'Health', confidence: 0.95, merchant: 'PharmEasy' },
  doctor: { category: 'Health', confidence: 0.9, merchant: 'Doctor Consultation' },
  hospital: { category: 'Health', confidence: 0.9, merchant: 'Hospital' },
  clinic: { category: 'Health', confidence: 0.9, merchant: 'Clinic' },
  medicines: { category: 'Health', confidence: 0.9, merchant: 'Medicines' },
  gym: { category: 'Health', confidence: 0.9, merchant: 'Gym Membership' },
  cult: { category: 'Health', confidence: 0.95, merchant: 'Cult.fit' },

  // Entertainment
  netflix: { category: 'Entertainment', confidence: 0.95, merchant: 'Netflix' },
  spotify: { category: 'Entertainment', confidence: 0.95, merchant: 'Spotify' },
  prime: { category: 'Entertainment', confidence: 0.9, merchant: 'Amazon Prime' },
  hotstar: { category: 'Entertainment', confidence: 0.95, merchant: 'Disney+ Hotstar' },
  bookmyshow: { category: 'Entertainment', confidence: 0.95, merchant: 'BookMyShow' },
  movie: { category: 'Entertainment', confidence: 0.9, merchant: 'Movie Tickets' },
  pvr: { category: 'Entertainment', confidence: 0.95, merchant: 'PVR Cinemas' },
  inox: { category: 'Entertainment', confidence: 0.95, merchant: 'INOX' },

  // Education
  udemy: { category: 'Education', confidence: 0.95, merchant: 'Udemy' },
  coursera: { category: 'Education', confidence: 0.95, merchant: 'Coursera' },
  books: { category: 'Education', confidence: 0.9, merchant: 'Bookstore' },
  tuition: { category: 'Education', confidence: 0.9, merchant: 'Tuition Fee' },
  course: { category: 'Education', confidence: 0.9, merchant: 'Online Course' },

  // Income
  salary: { category: 'Salary', confidence: 0.98, merchant: 'Employer Salary' },
  stipend: { category: 'Salary', confidence: 0.95, merchant: 'Stipend' },
  freelance: { category: 'Other Income', confidence: 0.95, merchant: 'Freelance Client' },
  refund: { category: 'Other Income', confidence: 0.9, merchant: 'Refund' },
  cashback: { category: 'Other Income', confidence: 0.9, merchant: 'UPI Cashback' },
  interest: { category: 'Other Income', confidence: 0.9, merchant: 'Bank Interest' },
  dividend: { category: 'Other Income', confidence: 0.95, merchant: 'Dividend' },
};

export type ParseOutcome =
  | { ok: true; result: ParsedTransactionResult }
  | { ok: false; reason: 'no_amount' | 'empty'; rawText: string };

// Main parsing function with Rule Cache + Edge Function + Deterministic Fallback
export async function parseTransactionInput(
  text: string,
  categories: Category[],
  wallets: Wallet[],
  rules: CategoryRule[],
  currency: string = 'INR'
): Promise<ParseOutcome> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty', rawText: text };
  }

  const lower = trimmed.toLowerCase();

  // 1. Try Supabase Edge Function if connected
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('parse-transaction', {
        body: {
          text: trimmed,
          currency,
          categories: categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind })),
          wallets: wallets.map((w) => ({ id: w.id, name: w.name })),
          category_rules: rules.map((r) => ({ match_text: r.match_text, category_id: r.category_id })),
        },
      });

      if (!error && data && Number(data.amount) > 0) {
        return {
          ok: true,
          result: {
            amount: Number(data.amount),
            kind: data.kind || 'expense',
            merchant: data.merchant || 'Expense',
            category_id: data.category_id || categories[0]?.id || '',
            category_confidence: Number(data.category_confidence) || 0.8,
            txn_date: data.txn_date || new Date().toISOString().split('T')[0],
            wallet_id: data.wallet_id || wallets[0]?.id,
            note: data.note || trimmed,
            degraded: data.degraded || false,
          },
        };
      }
    } catch (edgeErr) {
      console.warn('Edge function invoke failed, executing client AI rule parser:', edgeErr);
    }
  }

  // 2. High-Fidelity Client Parsing Engine
  const extractedAmount = extractAmount(trimmed);
  if (extractedAmount === null || extractedAmount <= 0) {
    return {
      ok: false,
      reason: 'no_amount',
      rawText: trimmed,
    };
  }

  const amount = extractedAmount;
  const txn_date = resolveRelativeDate(trimmed);

  // Determine kind: income vs expense
  // Special rule: Credit card payment or self-transfers are NEVER income
  const isCcPayment = /\b(credit card|card bill|cc bill|bill pay)\b/i.test(lower);
  const isIncomeKeyword = /\b(salary|credited|received from|received|refund|cashback|stipend|freelance|dividend|bonus)\b/i.test(lower);
  const kind: TransactionKind = !isCcPayment && isIncomeKeyword ? 'income' : 'expense';

  // Check Category Rules first (Learned from past user corrections)
  let matchedCategoryId: string | null = null;
  let confidence = 0.5;
  let detectedMerchant = '';

  for (const rule of rules) {
    if (rule.match_text && lower.includes(rule.match_text.toLowerCase())) {
      const foundCat = categories.find((c) => c.id === rule.category_id);
      if (foundCat) {
        matchedCategoryId = foundCat.id;
        confidence = 0.95;
        detectedMerchant = rule.match_text.charAt(0).toUpperCase() + rule.match_text.slice(1);
        break;
      }
    }
  }

  // If no user rule matched, check built-in dictionary
  if (!matchedCategoryId) {
    for (const [key, mapping] of Object.entries(KEYWORD_MAP)) {
      const regex = new RegExp(`\\b${key.replace('_', '[\\s_-]?')}\\b`, 'i');
      if (regex.test(lower)) {
        const foundCat = categories.find(
          (c) => c.name.toLowerCase() === mapping.category.toLowerCase() && c.kind === kind
        ) || categories.find((c) => c.name.toLowerCase() === mapping.category.toLowerCase());

        if (foundCat) {
          matchedCategoryId = foundCat.id;
          confidence = mapping.confidence;
          detectedMerchant = mapping.merchant || key.charAt(0).toUpperCase() + key.slice(1);
          break;
        }
      }
    }
  }

  // If still no category found, match directly by category name or fallback to "Other"
  if (!matchedCategoryId) {
    const nameMatch = categories.find((c) => lower.includes(c.name.toLowerCase()) && c.kind === kind);
    if (nameMatch) {
      matchedCategoryId = nameMatch.id;
      confidence = 0.85;
      detectedMerchant = nameMatch.name;
    } else {
      const otherCat = categories.find((c) => c.name.toLowerCase() === 'other' && c.kind === kind)
        || categories.find((c) => c.kind === kind)
        || categories[0];
      matchedCategoryId = otherCat ? otherCat.id : '';
      confidence = 0.35;
    }
  }

  // Extract clean merchant name if not detected
  if (!detectedMerchant) {
    const cleaned = trimmed
      .replace(/(?:(?:rs\.?|inr|₹)\s*)?\d+(?:\.\d+)?\s*(?:k|l|lac|lakh)?/gi, '')
      .replace(/\b(paid|for|to|at|on|today|yesterday|last friday|day before yesterday)\b/gi, '')
      .trim();
    detectedMerchant = cleaned.slice(0, 32) || (kind === 'income' ? 'Income' : 'Expense');
  }

  // Wallet selection (match wallet name in text or default to first wallet)
  let matchedWalletId = wallets[0]?.id;
  for (const w of wallets) {
    if (lower.includes(w.name.toLowerCase())) {
      matchedWalletId = w.id;
      break;
    }
  }

  return {
    ok: true,
    result: {
      amount,
      kind,
      merchant: detectedMerchant,
      category_id: matchedCategoryId || '',
      category_confidence: confidence,
      txn_date,
      wallet_id: matchedWalletId,
      note: trimmed,
      degraded: confidence < 0.5,
    },
  };
}

// Generate MD5-style transaction fingerprint
export function generateFingerprint(merchant: string, note: string | undefined, amount: number, txn_date: string, wallet_id: string): string {
  const base = `${(merchant || note || '').toLowerCase().trim()}_${amount}_${txn_date}_${wallet_id}`;
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(16)}`;
}
