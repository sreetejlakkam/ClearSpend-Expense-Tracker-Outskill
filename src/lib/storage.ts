import {
  Budget,
  Category,
  CategoryRule,
  Profile,
  Transaction,
  Wallet
} from '../types';
import { generateFingerprint } from './parser';

export const DEFAULT_CATEGORIES: Array<Omit<Category, 'user_id'>> = [
  { id: 'cat_food', name: 'Food & Dining', icon: 'Utensils', color: '#F97316', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#10B981', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_transport', name: 'Transport', icon: 'Car', color: '#3B82F6', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_bills', name: 'Bills & Utilities', icon: 'Zap', color: '#EAB308', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_rent', name: 'Rent', icon: 'Home', color: '#6366F1', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_health', name: 'Health', icon: 'HeartPulse', color: '#EF4444', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'Film', color: '#8B5CF6', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_education', name: 'Education', icon: 'GraduationCap', color: '#14B8A6', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_other', name: 'Other', icon: 'MoreHorizontal', color: '#64748B', kind: 'expense', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_salary', name: 'Salary', icon: 'Briefcase', color: '#059669', kind: 'income', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat_other_income', name: 'Other Income', icon: 'ArrowDownToLine', color: '#0D9488', kind: 'income', is_default: true, created_at: new Date().toISOString() },
];

export function getInitialDemoState(userId: string = 'demo_user_1') {
  const profile: Profile = {
    id: userId,
    email: 'sreetej@clearspend.app',
    display_name: 'Sreetej Lakkam',
    base_currency: 'INR',
    onboarded_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  };

  const wallets: Wallet[] = [
    { id: 'w_bank', user_id: userId, name: 'HDFC Salary A/c', type: 'bank', currency: 'INR', opening_balance: 45000, is_archived: false, created_at: new Date().toISOString() },
    { id: 'w_upi', user_id: userId, name: 'Google Pay UPI', type: 'wallet', currency: 'INR', opening_balance: 5000, is_archived: false, created_at: new Date().toISOString() },
    { id: 'w_cash', user_id: userId, name: 'Cash in Pocket', type: 'cash', currency: 'INR', opening_balance: 2500, is_archived: false, created_at: new Date().toISOString() },
    { id: 'w_card', user_id: userId, name: 'ICICI Coral Card', type: 'card', currency: 'INR', opening_balance: 0, is_archived: false, created_at: new Date().toISOString() },
  ];

  const categories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    user_id: userId,
  }));

  const budgets: Budget[] = [
    { id: 'b_food', user_id: userId, category_id: 'cat_food', period: 'monthly', amount: 9000, start_month: '2026-08-01', alert_threshold: 80, created_at: new Date().toISOString() },
    { id: 'b_groceries', user_id: userId, category_id: 'cat_groceries', period: 'monthly', amount: 7000, start_month: '2026-08-01', alert_threshold: 80, created_at: new Date().toISOString() },
    { id: 'b_transport', user_id: userId, category_id: 'cat_transport', period: 'monthly', amount: 4000, start_month: '2026-08-01', alert_threshold: 80, created_at: new Date().toISOString() },
    { id: 'b_shopping', user_id: userId, category_id: 'cat_shopping', period: 'monthly', amount: 6000, start_month: '2026-08-01', alert_threshold: 80, created_at: new Date().toISOString() },
    { id: 'b_entertainment', user_id: userId, category_id: 'cat_entertainment', period: 'monthly', amount: 3000, start_month: '2026-08-01', alert_threshold: 80, created_at: new Date().toISOString() },
  ];

  const rules: CategoryRule[] = [
    { id: 'r_zomato', user_id: userId, match_text: 'zomato', category_id: 'cat_food', hit_count: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'r_swiggy', user_id: userId, match_text: 'swiggy', category_id: 'cat_food', hit_count: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'r_zepto', user_id: userId, match_text: 'zepto', category_id: 'cat_groceries', hit_count: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'r_uber', user_id: userId, match_text: 'uber', category_id: 'cat_transport', hit_count: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'r_netflix', user_id: userId, match_text: 'netflix', category_id: 'cat_entertainment', hit_count: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  // Generate date helper
  const now = new Date();
  const getPastDateStr = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const rawTxns = [
    // This month income
    { amount: 85000, kind: 'income', date: getPastDateStr(19), merchant: 'Acme Tech Salary', cat: 'cat_salary', wallet: 'w_bank', note: 'Monthly salary credit', src: 'manual' },
    { amount: 12000, kind: 'income', date: getPastDateStr(10), merchant: 'Upwork Freelance', cat: 'cat_other_income', wallet: 'w_bank', note: 'UI Design consulting payout', src: 'manual' },
    
    // Core living expenses (Rent, utilities)
    { amount: 22000, kind: 'expense', date: getPastDateStr(18), merchant: 'Brigade Meadows Rent', cat: 'cat_rent', wallet: 'w_bank', note: 'August apartment rent', src: 'manual' },
    { amount: 1179, kind: 'expense', date: getPastDateStr(15), merchant: 'Airtel Fiber Broadband', cat: 'cat_bills', wallet: 'w_bank', note: '300 Mbps unlimited wifi plan', src: 'manual' },
    { amount: 1850, kind: 'expense', date: getPastDateStr(14), merchant: 'BESCOM Electricity Bill', cat: 'cat_bills', wallet: 'w_upi', note: 'Electricity payment', src: 'manual' },
    
    // Food & Dining
    { amount: 380, kind: 'expense', date: getPastDateStr(1), merchant: 'Zomato Lunch Bowl', cat: 'cat_food', wallet: 'w_upi', note: '380 zomato lunch', src: 'nl', conf: 0.95 },
    { amount: 450, kind: 'expense', date: getPastDateStr(3), merchant: 'Swiggy Biryani Bowl', cat: 'cat_food', wallet: 'w_upi', note: 'Dinner with colleagues', src: 'nl', conf: 0.95 },
    { amount: 680, kind: 'expense', date: getPastDateStr(2), merchant: 'Zomato Dinner Feast', cat: 'cat_food', wallet: 'w_upi', note: 'Zomato dinner', src: 'nl', conf: 0.95 },
    { amount: 180, kind: 'expense', date: getPastDateStr(4), merchant: 'Chai Point Kadak Chai & Bun', cat: 'cat_food', wallet: 'w_upi', note: 'Evening tea snack', src: 'manual' },
    { amount: 320, kind: 'expense', date: getPastDateStr(6), merchant: 'McDonalds Burger Combo', cat: 'cat_food', wallet: 'w_card', note: 'Quick lunch bite', src: 'nl', conf: 0.9 },
    { amount: 520, kind: 'expense', date: getPastDateStr(8), merchant: 'Domino Pizza Mania', cat: 'cat_food', wallet: 'w_upi', note: 'Weekend pizza', src: 'manual' },
    { amount: 240, kind: 'expense', date: getPastDateStr(11), merchant: 'Starbucks Cold Brew', cat: 'cat_food', wallet: 'w_card', note: 'Coffee while working', src: 'manual' },
    { amount: 750, kind: 'expense', date: getPastDateStr(13), merchant: 'Barbeque Nation Dinner', cat: 'cat_food', wallet: 'w_card', note: 'Team dinner share', src: 'manual' },
    
    // Groceries
    { amount: 480, kind: 'expense', date: getPastDateStr(2), merchant: 'Zepto Quick Groceries', cat: 'cat_groceries', wallet: 'w_upi', note: 'Milk, bread & fruits', src: 'nl', conf: 0.95 },
    { amount: 1250, kind: 'expense', date: getPastDateStr(5), merchant: 'Blinkit Weekend Essentials', cat: 'cat_groceries', wallet: 'w_upi', note: 'Cooking oil & veggies', src: 'manual' },
    { amount: 890, kind: 'expense', date: getPastDateStr(9), merchant: 'Swiggy Instamart Order', cat: 'cat_groceries', wallet: 'w_upi', note: 'Snacks & dairy products', src: 'manual' },
    { amount: 2400, kind: 'expense', date: getPastDateStr(16), merchant: 'DMart Monthly Supermarket', cat: 'cat_groceries', wallet: 'w_card', note: 'Monthly groceries bulk shopping', src: 'manual' },
    
    // Transport
    { amount: 280, kind: 'expense', date: getPastDateStr(1), merchant: 'Uber Premier Ride', cat: 'cat_transport', wallet: 'w_upi', note: 'Cab to office', src: 'nl', conf: 0.95 },
    { amount: 190, kind: 'expense', date: getPastDateStr(3), merchant: 'Rapido Auto Ride', cat: 'cat_transport', wallet: 'w_upi', note: 'Metro station to home', src: 'manual' },
    { amount: 2100, kind: 'expense', date: getPastDateStr(7), merchant: 'Shell Petrol Pump', cat: 'cat_transport', wallet: 'w_card', note: 'Car fuel tank top-up', src: 'manual' },
    { amount: 350, kind: 'expense', date: getPastDateStr(12), merchant: 'Fastag Toll Recharge', cat: 'cat_transport', wallet: 'w_upi', note: 'Highway toll wallet', src: 'manual' },
    
    // Shopping
    { amount: 2199, kind: 'expense', date: getPastDateStr(4), merchant: 'Amazon Wireless Earbuds', cat: 'cat_shopping', wallet: 'w_card', note: 'Noise cancelling buds', src: 'manual' },
    { amount: 1490, kind: 'expense', date: getPastDateStr(10), merchant: 'Myntra Casual Shirts', cat: 'cat_shopping', wallet: 'w_card', note: 'Weekend clothing haul', src: 'manual' },
    
    // Entertainment & Subscriptions
    { amount: 649, kind: 'expense', date: getPastDateStr(5), merchant: 'Netflix Premium Plan', cat: 'cat_entertainment', wallet: 'w_card', note: '4K monthly subscription', src: 'manual' },
    { amount: 119, kind: 'expense', date: getPastDateStr(12), merchant: 'Spotify Individual Premium', cat: 'cat_entertainment', wallet: 'w_upi', note: 'Music streaming auto-debit', src: 'manual' },
    { amount: 840, kind: 'expense', date: getPastDateStr(8), merchant: 'PVR Cinemas IMAX Movie', cat: 'cat_entertainment', wallet: 'w_card', note: 'Movie tickets with popcorn', src: 'manual' },
    
    // Health & Fitness
    { amount: 1800, kind: 'expense', date: getPastDateStr(17), merchant: 'Cult.fit Fitness Membership', cat: 'cat_health', wallet: 'w_card', note: 'Gym monthly pass', src: 'manual' },
    { amount: 360, kind: 'expense', date: getPastDateStr(7), merchant: 'Apollo Pharmacy Multivitamins', cat: 'cat_health', wallet: 'w_upi', note: 'Vitamin C & supplements', src: 'manual' },

    // Previous Month Transactions for MoM Intelligence & History
    { amount: 85000, kind: 'income', date: getPastDateStr(49), merchant: 'Acme Tech Salary', cat: 'cat_salary', wallet: 'w_bank', note: 'July monthly salary', src: 'manual' },
    { amount: 22000, kind: 'expense', date: getPastDateStr(48), merchant: 'Brigade Meadows Rent', cat: 'cat_rent', wallet: 'w_bank', note: 'July apartment rent', src: 'manual' },
    { amount: 649, kind: 'expense', date: getPastDateStr(35), merchant: 'Netflix Premium Plan', cat: 'cat_entertainment', wallet: 'w_card', note: '4K monthly subscription', src: 'manual' },
    { amount: 119, kind: 'expense', date: getPastDateStr(42), merchant: 'Spotify Individual Premium', cat: 'cat_entertainment', wallet: 'w_upi', note: 'Music streaming auto-debit', src: 'manual' },
    { amount: 5400, kind: 'expense', date: getPastDateStr(38), merchant: 'Food & Groceries Aggregate', cat: 'cat_food', wallet: 'w_upi', note: 'July dining out', src: 'manual' },
    { amount: 3100, kind: 'expense', date: getPastDateStr(41), merchant: 'Transport & Fuel Aggregate', cat: 'cat_transport', wallet: 'w_card', note: 'July commuting', src: 'manual' },
    { amount: 3800, kind: 'expense', date: getPastDateStr(36), merchant: 'Groceries Local Mart', cat: 'cat_groceries', wallet: 'w_upi', note: 'July groceries', src: 'manual' },
  ];

  const transactions: Transaction[] = rawTxns.map((t, idx) => {
    const id = `txn_demo_${idx + 1}`;
    const fp = generateFingerprint(t.merchant, t.note, t.amount, t.date, t.wallet);
    return {
      id,
      user_id: userId,
      wallet_id: t.wallet,
      category_id: t.cat,
      amount: t.amount,
      kind: t.kind as 'expense' | 'income',
      txn_date: t.date,
      merchant: t.merchant,
      note: t.note,
      source: (t.src || 'manual') as any,
      ai_confidence: t.conf || 0.9,
      ai_suggested_category_id: t.cat,
      was_corrected: false,
      fingerprint: fp,
      duplicate_of_id: null,
      status: 'active',
      created_at: new Date(t.date).toISOString(),
      updated_at: new Date(t.date).toISOString(),
    };
  });

  // 1. Plant an authentic duplicate for the Review Inbox demo
  const plantedOriginalId = 'txn_demo_planted_orig';
  const plantedDuplicateId = 'txn_demo_planted_dup';
  const yesterdayStr = getPastDateStr(1);

  const originalTxn: Transaction = {
    id: plantedOriginalId,
    user_id: userId,
    wallet_id: 'w_upi',
    category_id: 'cat_food',
    amount: 550,
    kind: 'expense',
    txn_date: yesterdayStr,
    merchant: 'Zomato Gourmet Lunch',
    note: '550 zomato lunch with team',
    source: 'nl',
    ai_confidence: 0.95,
    ai_suggested_category_id: 'cat_food',
    was_corrected: false,
    fingerprint: generateFingerprint('Zomato Gourmet Lunch', '550 zomato lunch', 550, yesterdayStr, 'w_upi'),
    duplicate_of_id: null,
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  };

  const duplicateTxn: Transaction = {
    id: plantedDuplicateId,
    user_id: userId,
    wallet_id: 'w_upi',
    category_id: 'cat_food',
    amount: 550,
    kind: 'expense',
    txn_date: yesterdayStr,
    merchant: 'Zomato Gourmet Lunch',
    note: 'Zomato order #84920 payment',
    source: 'manual',
    ai_confidence: 0.9,
    ai_suggested_category_id: 'cat_food',
    was_corrected: false,
    fingerprint: generateFingerprint('Zomato Gourmet Lunch', 'Zomato order #84920 payment', 550, yesterdayStr, 'w_upi'),
    duplicate_of_id: plantedOriginalId, // Flagged duplicate
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  };

  // 2. Plant an authentic Anomaly (>3x category median)
  const anomalyTxn: Transaction = {
    id: 'txn_demo_anomaly_taj',
    user_id: userId,
    wallet_id: 'w_card',
    category_id: 'cat_food',
    amount: 7800, // Median is ~450
    kind: 'expense',
    txn_date: getPastDateStr(4),
    merchant: 'Taj West End Fine Dining',
    note: 'Celebration dinner anniversary',
    source: 'manual',
    ai_confidence: 0.95,
    ai_suggested_category_id: 'cat_food',
    was_corrected: false,
    fingerprint: generateFingerprint('Taj West End Fine Dining', 'Celebration dinner', 7800, getPastDateStr(4), 'w_card'),
    duplicate_of_id: null,
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  };

  transactions.unshift(originalTxn, duplicateTxn, anomalyTxn);

  return {
    profile,
    wallets,
    categories,
    transactions,
    budgets,
    rules,
  };
}
