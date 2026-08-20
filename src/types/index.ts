// ClearSpend TypeScript Data Types

export type TransactionKind = 'expense' | 'income';
export type WalletType = 'cash' | 'bank' | 'card' | 'wallet';
export type TransactionSource = 'manual' | 'nl' | 'csv';
export type TransactionStatus = 'active' | 'merged' | 'dismissed';
export type InsightType = 'forecast' | 'top_mover' | 'subscription' | 'streak' | 'anomaly';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  base_currency: string;
  onboarded_at: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  currency: string;
  opening_balance: number;
  is_archived: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  kind: TransactionKind;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string;
  amount: number; // Always positive!
  kind: TransactionKind;
  txn_date: string; // YYYY-MM-DD
  merchant: string;
  note?: string;
  source: TransactionSource;
  ai_confidence?: number; // 0.0 to 1.0
  ai_suggested_category_id?: string;
  was_corrected: boolean;
  fingerprint?: string;
  duplicate_of_id?: string | null;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null; // null = overall monthly budget
  period: 'monthly';
  amount: number;
  start_month: string; // YYYY-MM-01
  alert_threshold: number; // default 80%
  created_at: string;
}

export interface CategoryRule {
  id: string;
  user_id: string;
  match_text: string; // lowercased merchant keyword
  category_id: string;
  hit_count: number;
  created_at: string;
  updated_at: string;
}

export interface Insight {
  id: string;
  user_id: string;
  type: InsightType;
  title: string;
  body: string;
  payload?: any;
  period_start?: string;
  period_end?: string;
  is_dismissed: boolean;
  created_at: string;
}

export interface ParsedTransactionResult {
  amount: number;
  kind: TransactionKind;
  merchant: string;
  category_id: string;
  category_confidence: number;
  txn_date: string;
  wallet_id?: string;
  note: string;
  degraded?: boolean;
}

export interface DuplicatePair {
  id: string;
  original: Transaction;
  duplicate: Transaction;
  reason: string;
  similarity: number;
}

export interface AnomalyItem {
  id: string;
  transaction: Transaction;
  categoryName: string;
  medianAmount: number;
  multiplier: number;
}
