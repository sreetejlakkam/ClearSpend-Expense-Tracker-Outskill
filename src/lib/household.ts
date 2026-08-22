import {
  Household,
  HouseholdMember,
  HouseholdInvite,
  HouseholdBudget,
  HouseholdGoal,
  HouseholdAuditLog,
  Entitlement,
  HouseholdMonthlySummaryItem,
  HouseholdLedgerRow,
  Transaction,
  TxnVisibility,
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const HOUSEHOLD_STORAGE_KEY = 'clearspend_household_v1';
const MEMBERS_STORAGE_KEY = 'clearspend_hh_members_v1';
const HH_BUDGETS_STORAGE_KEY = 'clearspend_hh_budgets_v1';
const HH_GOALS_STORAGE_KEY = 'clearspend_hh_goals_v1';
const AUDIT_STORAGE_KEY = 'clearspend_hh_audit_v1';
const ENTITLEMENTS_STORAGE_KEY = 'clearspend_entitlements_v1';

// -------------------------------------------------------------
// Local Storage Accessors (Offline-First)
// -------------------------------------------------------------

export function getLocalHousehold(): Household | null {
  try {
    const raw = localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalHousehold(hh: Household | null): void {
  if (hh) {
    localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(hh));
  } else {
    localStorage.removeItem(HOUSEHOLD_STORAGE_KEY);
  }
}

export function getLocalHouseholdMembers(): HouseholdMember[] {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalHouseholdMembers(members: HouseholdMember[]): void {
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
}

export function getLocalHouseholdBudgets(): HouseholdBudget[] {
  try {
    const raw = localStorage.getItem(HH_BUDGETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalHouseholdBudgets(budgets: HouseholdBudget[]): void {
  localStorage.setItem(HH_BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
}

export function getLocalHouseholdGoals(): HouseholdGoal[] {
  try {
    const raw = localStorage.getItem(HH_GOALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalHouseholdGoals(goals: HouseholdGoal[]): void {
  localStorage.setItem(HH_GOALS_STORAGE_KEY, JSON.stringify(goals));
}

export function getLocalEntitlements(): Entitlement[] {
  try {
    const raw = localStorage.getItem(ENTITLEMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalEntitlements(entitlements: Entitlement[]): void {
  localStorage.setItem(ENTITLEMENTS_STORAGE_KEY, JSON.stringify(entitlements));
}

export function getLocalAuditLog(): HouseholdAuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLocalAuditEntry(entry: HouseholdAuditLog): void {
  const list = getLocalAuditLog();
  list.unshift(entry);
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
}

// -------------------------------------------------------------
// Core Privacy-Preserving Household Computations
// -------------------------------------------------------------

/**
 * Layer A: Compute monthly summary per member.
 * If a member has share_summary === false, their totals are returned as NULL with is_estimated: true.
 * This guarantees the system NEVER silently under-reports combined figures.
 */
export function calculateHouseholdMonthlySummary(
  householdId: string,
  monthStartStr: string, // YYYY-MM-01 or YYYY-MM
  members: HouseholdMember[],
  transactions: Transaction[]
): HouseholdMonthlySummaryItem[] {
  const activeMembers = members.filter((m) => m.household_id === householdId && m.status === 'active');
  const targetMonthPrefix = monthStartStr.slice(0, 7); // "YYYY-MM"

  return activeMembers.map((member) => {
    if (!member.share_summary) {
      return {
        user_id: member.user_id,
        display_name: member.display_name,
        total_income: null,
        total_expense: null,
        net_savings: null,
        is_estimated: true,
      };
    }

    const memberTxns = transactions.filter((t) => {
      if (t.user_id !== member.user_id || t.status !== 'active') return false;
      return t.txn_date.startsWith(targetMonthPrefix);
    });

    const total_income = memberTxns
      .filter((t) => t.kind === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const total_expense = memberTxns
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const net_savings = total_income - total_expense;

    return {
      user_id: member.user_id,
      display_name: member.display_name,
      total_income,
      total_expense,
      net_savings,
      is_estimated: false,
    };
  });
}

/**
 * Layer B: Filter transactions through the column-masking policy of household_ledger.
 * A user sees their own rows completely. For partner rows:
 * - 'private': Row is completely excluded.
 * - 'amount_only': Amount, Category, Date are visible. Merchant is masked to 'Shared Expense' and Note is omitted.
 * - 'shared': Complete row is visible.
 */
export function filterHouseholdLedger(
  householdId: string,
  currentUserId: string,
  transactions: Transaction[]
): HouseholdLedgerRow[] {
  const visibleRows: HouseholdLedgerRow[] = [];

  for (const t of transactions) {
    if (t.household_id !== householdId || t.status !== 'active') continue;

    const isOwn = t.user_id === currentUserId;
    const visibility: TxnVisibility = t.visibility || 'private';

    if (isOwn) {
      visibleRows.push({
        id: t.id,
        household_id: t.household_id,
        user_id: t.user_id,
        amount: t.amount,
        kind: t.kind,
        txn_date: t.txn_date,
        category_id: t.category_id,
        wallet_id: t.wallet_id,
        visibility,
        merchant: t.merchant,
        note: t.note,
      });
    } else if (visibility === 'shared') {
      visibleRows.push({
        id: t.id,
        household_id: t.household_id,
        user_id: t.user_id,
        amount: t.amount,
        kind: t.kind,
        txn_date: t.txn_date,
        category_id: t.category_id,
        wallet_id: t.wallet_id,
        visibility,
        merchant: t.merchant,
        note: t.note,
      });
    } else if (visibility === 'amount_only') {
      visibleRows.push({
        id: t.id,
        household_id: t.household_id,
        user_id: t.user_id,
        amount: t.amount,
        kind: t.kind,
        txn_date: t.txn_date,
        category_id: t.category_id,
        wallet_id: t.wallet_id,
        visibility,
        merchant: 'Shared Expense',
        note: undefined,
      });
    }
    // 'private' partner rows are strictly skipped
  }

  return visibleRows.sort((a, b) => new Date(b.txn_date).getTime() - new Date(a.txn_date).getTime());
}

// -------------------------------------------------------------
// Async Household Actions & Remote Supabase Sync
// -------------------------------------------------------------

export async function createHousehold(
  name: string,
  ownerName: string,
  userId: string
): Promise<{ household: Household; member: HouseholdMember }> {
  const newHousehold: Household = {
    id: `hh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    base_currency: 'INR',
    created_by: userId,
    plan: 'free',
    created_at: new Date().toISOString(),
  };

  const newMember: HouseholdMember = {
    id: `hm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    household_id: newHousehold.id,
    user_id: userId,
    role: 'owner',
    status: 'active',
    display_name: ownerName || 'You',
    share_summary: true,
    share_categories: false,
    contribution_share: null,
    joined_at: new Date().toISOString(),
  };

  setLocalHousehold(newHousehold);
  setLocalHouseholdMembers([newMember]);

  addLocalAuditEntry({
    id: `audit_${Date.now()}`,
    household_id: newHousehold.id,
    actor_id: userId,
    action: 'household_created',
    detail: { name },
    created_at: new Date().toISOString(),
  });

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: hhData, error: hhErr } = await supabase
        .from('households')
        .insert({
          name: newHousehold.name,
          base_currency: newHousehold.base_currency,
          created_by: userId,
          plan: 'free',
        })
        .select()
        .single();

      if (!hhErr && hhData) {
        newHousehold.id = hhData.id;
        setLocalHousehold(newHousehold);

        const { data: memData, error: memErr } = await supabase
          .from('household_members')
          .insert({
            household_id: hhData.id,
            user_id: userId,
            role: 'owner',
            status: 'active',
            display_name: newMember.display_name,
            share_summary: true,
            share_categories: false,
          })
          .select()
          .single();

        if (!memErr && memData) {
          newMember.id = memData.id;
          newMember.household_id = hhData.id;
          setLocalHouseholdMembers([newMember]);
        }
      }
    } catch (err) {
      console.warn('Supabase createHousehold sync deferred:', err);
    }
  }

  return { household: newHousehold, member: newMember };
}

export async function createHouseholdInvite(
  householdId: string,
  invitedEmail: string,
  invitedBy: string
): Promise<HouseholdInvite> {
  const token = `inv_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  const invite: HouseholdInvite = {
    id: `inv_${Date.now()}`,
    household_id: householdId,
    invited_email: invitedEmail,
    invited_by: invitedBy,
    token,
    status: 'pending',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  };

  addLocalAuditEntry({
    id: `audit_${Date.now()}`,
    household_id: householdId,
    actor_id: invitedBy,
    action: 'invite_sent',
    detail: { email: invitedEmail },
    created_at: new Date().toISOString(),
  });

  return invite;
}

export async function updateMemberSharingToggles(
  householdId: string,
  userId: string,
  shareSummary: boolean,
  shareCategories: boolean,
  contributionShare: number = 0.5
): Promise<void> {
  const members = getLocalHouseholdMembers();
  const updated = members.map((m) =>
    m.user_id === userId
      ? {
          ...m,
          share_summary: shareSummary,
          share_categories: shareCategories,
          contribution_share: contributionShare,
        }
      : m
  );
  setLocalHouseholdMembers(updated);

  addLocalAuditEntry({
    id: `audit_${Date.now()}`,
    household_id: householdId,
    actor_id: userId,
    action: 'visibility_changed',
    detail: { shareSummary, shareCategories, contributionShare },
    created_at: new Date().toISOString(),
  });

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('household_members')
        .update({
          share_summary: shareSummary,
          share_categories: shareCategories,
          contribution_share: contributionShare,
        })
        .eq('household_id', householdId)
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase updateMemberSharingToggles deferred:', err);
    }
  }
}

export async function leaveHousehold(
  householdId: string,
  userId: string,
  resolveWalletOption: 'keep_personal' | 'transfer_owner' = 'keep_personal'
): Promise<void> {
  // 1. Audit Entry
  addLocalAuditEntry({
    id: `audit_${Date.now()}`,
    household_id: householdId,
    actor_id: userId,
    action: 'member_left',
    detail: { resolveWalletOption },
    created_at: new Date().toISOString(),
  });

  // 2. Clear Local Household State
  setLocalHousehold(null);
  setLocalHouseholdMembers([]);
  setLocalHouseholdBudgets([]);
  setLocalHouseholdGoals([]);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('household_members')
        .update({ status: 'left', left_at: new Date().toISOString() })
        .eq('household_id', householdId)
        .eq('user_id', userId);

      // Unlink transactions to preserve privacy
      await supabase
        .from('transactions')
        .update({ household_id: null, visibility: 'private' })
        .eq('user_id', userId)
        .eq('household_id', householdId);
    } catch (err) {
      console.warn('Supabase leaveHousehold deferred:', err);
    }
  }
}
