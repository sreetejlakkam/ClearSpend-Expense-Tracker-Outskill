// ClearSpend TypeScript Data Types

export type TransactionKind = 'expense' | 'income';
export type WalletType = 'cash' | 'bank' | 'card' | 'wallet';
export type TransactionSource = 'manual' | 'nl' | 'csv';
export type TransactionStatus = 'active' | 'merged' | 'dismissed';
export type InsightType = 'forecast' | 'top_mover' | 'subscription' | 'streak' | 'anomaly';

// Phase 8: Family Finance AI Enums & Types
export type HouseholdRole = 'owner' | 'member';
export type MemberStatus = 'invited' | 'active' | 'left' | 'removed';
export type TxnVisibility = 'private' | 'amount_only' | 'shared';
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
export type ViewScope = 'personal' | 'household';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  base_currency: string;
  ai_consent?: 'none' | 'cloud';
  locale?: string;
  theme?: string;
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
  household_id?: string | null;
  is_shared?: boolean;
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
  default_visibility?: TxnVisibility;
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
  household_id?: string | null;
  visibility?: TxnVisibility;
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
  visibility?: TxnVisibility;
  degraded?: boolean;
}

export interface DuplicatePair {
  id: string;
  original: Transaction;
  duplicate: Transaction;
  reason: string;
  tier?: 'exact' | 'rapid_tap' | 'probable';
  similarity: number;
}

export interface AnomalyItem {
  id: string;
  transaction: Transaction;
  categoryName: string;
  medianAmount: number;
  multiplier: number;
}

export interface RecurringItem {
  id: string;
  user_id: string;
  merchant: string;
  category_id: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  due_day: number;
  wallet_id?: string;
  is_active: boolean;
  last_charged_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category?: string;
  icon?: string;
  color?: string;
  is_paused: boolean;
  monthly_contribution: number;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------
// Phase 8: Family Finance AI Data Structures
// -------------------------------------------------------------

export interface Household {
  id: string;
  name: string;
  base_currency: string;
  created_by: string;
  plan: 'free' | 'family_premium';
  plan_expires_at?: string | null;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: HouseholdRole;
  status: MemberStatus;
  display_name: string;
  share_summary: boolean;       // Layer A: Total Income, Expense, Savings
  share_categories: boolean;    // Layer A extended: Category Totals without merchants
  contribution_share?: number | null; // null = auto (income-proportional)
  joined_at: string;
  left_at?: string | null;
}

export interface HouseholdInvite {
  id: string;
  household_id: string;
  invited_email: string;
  invited_by: string;
  token: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
}

export interface HouseholdBudget {
  id: string;
  household_id: string;
  category_id?: string | null;
  name: string;
  amount: number;
  period: string;
  start_month: string;
  created_by: string;
  created_at: string;
}

export interface HouseholdGoal {
  id: string;
  household_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date?: string;
  expected_return_pct: number;
  icon?: string;
  color?: string;
  is_achieved: boolean;
  created_by: string;
  created_at: string;
}

export interface HouseholdGoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  monthly_amount: number;
}

export interface HouseholdAuditLog {
  id: string;
  household_id: string;
  actor_id?: string | null;
  action: string;
  detail?: any;
  created_at: string;
}

export interface Entitlement {
  id: string;
  household_id?: string | null;
  user_id?: string | null;
  feature: string;
  granted_at: string;
  expires_at?: string | null;
  source: 'trial' | 'purchase' | 'promo' | 'demo';
}

export interface HouseholdMonthlySummaryItem {
  user_id: string;
  display_name: string;
  total_income: number | null;
  total_expense: number | null;
  net_savings: number | null;
  is_estimated: boolean;
}

export interface HouseholdLedgerRow {
  id: string;
  household_id: string;
  user_id: string;
  amount: number;
  kind: TransactionKind;
  txn_date: string;
  category_id: string;
  wallet_id: string;
  visibility: TxnVisibility;
  merchant: string;
  note?: string;
}
