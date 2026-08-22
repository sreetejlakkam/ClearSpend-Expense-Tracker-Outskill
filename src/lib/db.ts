// ClearSpend Offline-First Unified Data Layer with Outbox Sync Queue
import {
  Budget,
  Category,
  CategoryRule,
  Goal,
  Profile,
  RecurringItem,
  Transaction,
  Wallet,
} from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

export interface OutboxMutation {
  id: string;
  table: 'transactions' | 'budgets' | 'wallets' | 'categories' | 'category_rules' | 'goals' | 'recurring_items' | 'profiles';
  action: 'insert' | 'update' | 'delete';
  payload: any;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

const OUTBOX_KEY = 'clearspend_sync_outbox_v1';

// Get outbox items
export function getOutbox(): OutboxMutation[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save outbox items
export function saveOutbox(items: OutboxMutation[]): void {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save sync outbox:', err);
  }
}

// Enqueue mutation into outbox
export function enqueueMutation(
  table: OutboxMutation['table'],
  action: OutboxMutation['action'],
  payload: any
): void {
  const outbox = getOutbox();
  const mutation: OutboxMutation = {
    id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    table,
    action,
    payload,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  };
  outbox.push(mutation);
  saveOutbox(outbox);

  // Trigger sync if online
  if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
    syncOutbox().catch(console.warn);
  }
}

// Sync outbox with Supabase
let isSyncing = false;
export async function syncOutbox(): Promise<{ syncedCount: number; failedCount: number }> {
  if (isSyncing || !isSupabaseConfigured || !supabase || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const outbox = getOutbox();
  if (outbox.length === 0) return { syncedCount: 0, failedCount: 0 };

  isSyncing = true;
  let syncedCount = 0;
  let failedCount = 0;
  const remainingOutbox: OutboxMutation[] = [];

  try {
    for (const item of outbox) {
      try {
        let error: any = null;

        if (item.action === 'insert' || item.action === 'update') {
          const { error: upsertErr } = await supabase
            .from(item.table)
            .upsert(item.payload, { onConflict: 'id' });
          error = upsertErr;
        } else if (item.action === 'delete') {
          const { error: delErr } = await supabase
            .from(item.table)
            .delete()
            .eq('id', item.payload.id || item.payload);
          error = delErr;
        }

        if (error) {
          console.warn(`Sync failed for mutation ${item.id} on ${item.table}:`, error);
          if (item.retryCount < 3) {
            remainingOutbox.push({ ...item, retryCount: item.retryCount + 1, status: 'failed' });
          }
          failedCount++;
        } else {
          syncedCount++;
        }
      } catch (mutationErr) {
        console.warn(`Exception during outbox item sync:`, mutationErr);
        if (item.retryCount < 3) {
          remainingOutbox.push({ ...item, retryCount: item.retryCount + 1, status: 'failed' });
        }
        failedCount++;
      }
    }
  } finally {
    saveOutbox(remainingOutbox);
    isSyncing = false;
  }

  return { syncedCount, failedCount };
}

// Fetch all remote user data on launch
export async function fetchUserData(userId: string): Promise<{
  profile: Profile | null;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  categoryRules: CategoryRule[];
  goals: Goal[];
  recurringItems: RecurringItem[];
} | null> {
  if (!isSupabaseConfigured || !supabase || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return null;
  }

  try {
    const [
      { data: profData },
      { data: walData },
      { data: catData },
      { data: txnData },
      { data: budData },
      { data: ruleData },
      { data: goalData },
      { data: recurData },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('wallets').select('*').eq('user_id', userId),
      supabase.from('categories').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId).order('txn_date', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', userId),
      supabase.from('category_rules').select('*').eq('user_id', userId),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('recurring_items').select('*').eq('user_id', userId),
    ]);

    return {
      profile: profData || null,
      wallets: walData || [],
      categories: catData || [],
      transactions: txnData || [],
      budgets: budData || [],
      categoryRules: ruleData || [],
      goals: goalData || [],
      recurringItems: recurData || [],
    };
  } catch (err) {
    console.warn('Failed to fetch remote user data from Supabase:', err);
    return null;
  }
}

// Entity mutation wrappers with outbox logging
export async function saveTransaction(txn: Transaction, isNew: boolean): Promise<void> {
  enqueueMutation('transactions', isNew ? 'insert' : 'update', txn);
}

export async function removeTransaction(id: string): Promise<void> {
  enqueueMutation('transactions', 'delete', { id });
}

export async function saveBudget(budget: Budget, isNew: boolean): Promise<void> {
  enqueueMutation('budgets', isNew ? 'insert' : 'update', budget);
}

export async function removeBudget(id: string): Promise<void> {
  enqueueMutation('budgets', 'delete', { id });
}

export async function saveWallet(wallet: Wallet, isNew: boolean): Promise<void> {
  enqueueMutation('wallets', isNew ? 'insert' : 'update', wallet);
}

export async function removeWallet(id: string): Promise<void> {
  enqueueMutation('wallets', 'delete', { id });
}

export async function saveCategory(category: Category, isNew: boolean): Promise<void> {
  enqueueMutation('categories', isNew ? 'insert' : 'update', category);
}

export async function removeCategory(id: string): Promise<void> {
  enqueueMutation('categories', 'delete', { id });
}

export async function saveRule(rule: CategoryRule, isNew: boolean): Promise<void> {
  enqueueMutation('category_rules', isNew ? 'insert' : 'update', rule);
}

export async function saveProfile(profile: Profile): Promise<void> {
  enqueueMutation('profiles', 'update', profile);
}

// Setup Realtime Subscription
export function subscribeToUserChanges(
  userId: string,
  onTxnChange: (payload: any) => void
): (() => void) | null {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const channel = supabase
      .channel(`public:transactions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onTxnChange(payload);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  } catch (err) {
    console.warn('Realtime subscription setup failed:', err);
    return null;
  }
}
