import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AnomalyItem,
  Budget,
  Category,
  CategoryRule,
  DuplicatePair,
  Goal,
  Insight,
  Profile,
  RecurringItem,
  Transaction,
  Wallet,
  Household,
  HouseholdMember,
  HouseholdInvite,
  HouseholdBudget,
  HouseholdGoal,
  HouseholdAuditLog,
  Entitlement,
  HouseholdMonthlySummaryItem,
  HouseholdLedgerRow,
  ViewScope,
} from '../types';
import {
  fetchUserData,
  removeBudget,
  removeCategory,
  removeTransaction,
  removeWallet,
  saveBudget,
  saveCategory,
  saveProfile,
  saveRule,
  saveTransaction,
  saveWallet,
  subscribeToUserChanges,
  syncOutbox,
} from './db';
import {
  getLocalHousehold,
  setLocalHousehold,
  getLocalHouseholdMembers,
  setLocalHouseholdMembers,
  getLocalHouseholdBudgets,
  setLocalHouseholdBudgets,
  getLocalHouseholdGoals,
  setLocalHouseholdGoals,
  getLocalEntitlements,
  setLocalEntitlements,
  getLocalAuditLog,
  calculateHouseholdMonthlySummary,
  filterHouseholdLedger,
  createHousehold,
  createHouseholdInvite,
  updateMemberSharingToggles,
  leaveHousehold,
} from './household';
import { generateAIInsights, scanAnomalies, scanDuplicates } from './insights';
import { generateFingerprint, parseTransactionInput, ParseOutcome } from './parser';
import { DEFAULT_CATEGORIES, getInitialDemoState } from './storage';
import { isSupabaseConfigured, supabase } from './supabase';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export interface ManualPrefill {
  amount?: string;
  merchant?: string;
  note?: string;
  hint?: string;
  date?: string;
}

function mapSupabaseAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) {
    return 'Incorrect email or password. Please try again.';
  }
  if (/user already registered/i.test(msg)) {
    return 'An account with this email already exists. Please Sign In.';
  }
  if (/rate limit/i.test(msg)) {
    return 'Too many attempts. Please wait a few moments and try again.';
  }
  if (/email not confirmed/i.test(msg)) {
    return 'Please check your inbox to confirm your email before signing in.';
  }
  return msg;
}

interface StoreContextType {
  // Auth & Profile
  profile: Profile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isDemoSession: boolean;
  login: (email: string, password?: string, name?: string) => Promise<void>;
  loginAsDemo: () => void;
  signup: (email: string, name: string, password?: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  completeOnboarding: (currency: string, walletName: string, budgetCategory?: string, budgetAmount?: number) => Promise<void>;
  clearAllUserData: () => void;

  // Navigation & Date
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedMonthStr: string; // "YYYY-MM"
  changeMonth: (delta: number) => void;

  // Data Collections
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  categoryRules: CategoryRule[];
  insights: Insight[];
  recurringItems: RecurringItem[];
  goals: Goal[];

  // Review Queue
  duplicatePairs: DuplicatePair[];
  anomalies: AnomalyItem[];
  pendingReviewCount: number;

  // Transactions Actions
  addTransaction: (data: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkRecategorize: (transactionIds: string[], newCategoryId: string) => Promise<void>;
  bulkDeleteTransactions: (transactionIds: string[]) => Promise<void>;

  // Category Rules & Learning
  learnCategoryRule: (merchant: string, categoryId: string, applyToPast?: boolean) => Promise<{ pastUpdatedCount: number }>;

  // Review Actions
  mergeDuplicatePair: (originalId: string, duplicateId: string) => Promise<void>;
  keepBothDuplicates: (duplicateId: string) => Promise<void>;
  dismissAnomaly: (transactionId: string) => void;

  // Wallets & Categories CRUD
  addWallet: (wallet: Omit<Wallet, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string, reassignToCategoryId?: string) => Promise<void>;

  // Budgets CRUD
  addBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getCategory3MonthAverage: (categoryId: string) => number;

  // Recurring & Goals CRUD
  addRecurringItem: (item: Omit<RecurringItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateRecurringItem: (id: string, updates: Partial<RecurringItem>) => Promise<void>;
  deleteRecurringItem: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // AI & Parsing
  parseNaturalLanguage: (text: string) => Promise<ParseOutcome>;
  refreshInsights: () => Promise<void>;
  dismissInsight: (id: string) => void;

  // UI Modals & State
  isManualModalOpen: boolean;
  setIsManualModalOpen: (open: boolean) => void;
  manualModalPrefill: ManualPrefill | null;
  openManualAdd: (prefill?: ManualPrefill) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (txn: Transaction | null) => void;
  activeCategoryFilter: string | null;
  setActiveCategoryFilter: (catId: string | null) => void;
  budgetSubTab: 'envelopes' | 'infographics' | 'subscriptions' | 'goals' | 'simulator';
  setBudgetSubTab: (tab: 'envelopes' | 'infographics' | 'subscriptions' | 'goals' | 'simulator') => void;
  openSimulator: (type?: 'compounding' | 'budget') => void;

  // Phase 8: Family Finance AI
  viewScope: ViewScope;
  setViewScope: (scope: ViewScope) => void;
  household: Household | null;
  householdMembers: HouseholdMember[];
  householdBudgets: HouseholdBudget[];
  householdGoals: HouseholdGoal[];
  householdAuditLog: HouseholdAuditLog[];
  entitlements: Entitlement[];
  hasFamilyPremium: boolean;
  isPartnerPreview: boolean;
  setIsPartnerPreview: (preview: boolean) => void;
  householdMonthlySummary: HouseholdMonthlySummaryItem[];
  householdLedger: HouseholdLedgerRow[];
  createNewHousehold: (name: string, ownerName: string) => Promise<void>;
  inviteHouseholdPartner: (email: string) => Promise<HouseholdInvite>;
  updateSharingPreferences: (shareSummary: boolean, shareCategories: boolean, contributionShare?: number | null) => Promise<void>;
  leaveCurrentHousehold: (resolveOption?: 'keep_personal' | 'transfer_owner') => Promise<void>;
  addJointBudget: (budget: Omit<HouseholdBudget, 'id' | 'created_at'>) => Promise<void>;
  addJointGoal: (goal: Omit<HouseholdGoal, 'id' | 'created_at' | 'is_achieved'>) => Promise<void>;
  contributeToJointGoal: (goalId: string, amount: number) => Promise<void>;
  upgradeToFamilyPremium: () => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Reset / Seed
  resetToDemoData: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  PROFILE: 'clearspend_profile_v1',
  WALLETS: 'clearspend_wallets_v1',
  CATEGORIES: 'clearspend_categories_v1',
  TRANSACTIONS: 'clearspend_transactions_v1',
  BUDGETS: 'clearspend_budgets_v1',
  RULES: 'clearspend_rules_v1',
  INSIGHTS: 'clearspend_insights_v1',
  IS_DEMO: 'clearspend_is_demo_v1',
  RECURRING: 'clearspend_recurring_v1',
  GOALS: 'clearspend_goals_v1',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Demo session state
  const [isDemoSession, setIsDemoSession] = useState<boolean>(() => {
    const isDemo = localStorage.getItem(STORAGE_KEYS.IS_DEMO);
    if (isDemo === null) {
      const hasProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return !hasProfile;
    }
    return isDemo === 'true';
  });

  const demoData = useMemo(() => getInitialDemoState('demo_user_1'), []);

  const [profile, setProfile] = useState<Profile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) return JSON.parse(saved);
    return isDemoSession ? demoData.profile : null;
  });

  const [wallets, setWallets] = useState<Wallet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WALLETS);
    if (saved) return JSON.parse(saved);
    return isDemoSession ? demoData.wallets : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) return JSON.parse(saved);
    return isDemoSession
      ? demoData.categories
      : DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: 'default' }));
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) {
      let parsed: Transaction[] = JSON.parse(saved);
      // Auto-replenish partner transactions across 5 months for joint Family Room
      const partnerTxns = demoData.transactions.filter((t) => t.user_id === 'user_priya_demo');
      const missingPartnerTxns = partnerTxns.filter((pt) => !parsed.some((t) => t.id === pt.id));
      if (missingPartnerTxns.length > 0) {
        parsed = [...parsed, ...missingPartnerTxns];
      }
      // Tag shared household expenses so Family Room ledger is populated
      parsed = parsed.map((t) => {
        if (!t.household_id && (t.category_id === 'cat_rent' || t.category_id === 'cat_bills' || t.category_id === 'cat_groceries')) {
          return { ...t, household_id: 'hh_sharma_demo', visibility: (t.visibility || 'shared') as any };
        }
        return t;
      });
      return parsed;
    }
    return demoData.transactions;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (saved) return JSON.parse(saved);
    return isDemoSession ? demoData.budgets : [];
  });

  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RULES);
    if (saved) return JSON.parse(saved);
    return isDemoSession ? demoData.rules : [];
  });

  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECURRING);
    if (saved) return JSON.parse(saved);
    return isDemoSession ? (demoData as any).recurringItems || [] : [];
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (saved) return JSON.parse(saved);
    return isDemoSession ? (demoData as any).goals || [] : [];
  });

  const [insights, setInsights] = useState<Insight[]>([]);

  // Phase 8: Family Finance AI state
  const [viewScope, setViewScope] = useState<ViewScope>('personal');
  const [isPartnerPreview, setIsPartnerPreview] = useState<boolean>(false);

  const [household, setHousehold] = useState<Household | null>(() => {
    const saved = getLocalHousehold();
    if (saved) return saved;
    return (demoData as any).demoHousehold?.household || null;
  });

  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>(() => {
    const saved = getLocalHouseholdMembers();
    if (saved.length > 0) return saved;
    return (demoData as any).demoHousehold?.members || [];
  });

  const [householdBudgets, setHouseholdBudgets] = useState<HouseholdBudget[]>(() => {
    const saved = getLocalHouseholdBudgets();
    if (saved.length > 0) return saved;
    return (demoData as any).demoHousehold?.budgets || [];
  });

  const [householdGoals, setHouseholdGoals] = useState<HouseholdGoal[]>(() => {
    const saved = getLocalHouseholdGoals();
    if (saved.length > 0) return saved;
    return (demoData as any).demoHousehold?.goals || [];
  });

  const [entitlements, setEntitlements] = useState<Entitlement[]>(() => {
    const saved = getLocalEntitlements();
    if (saved.length > 0) return saved;
    return [{ id: 'ent_demo', household_id: 'hh_sharma_demo', feature: 'family_premium', granted_at: new Date().toISOString(), source: 'demo' }];
  });

  const [householdAuditLog] = useState<HouseholdAuditLog[]>(() => {
    return getLocalAuditLog();
  });

  // Navigation & Real Current Date (Unfrozen from hardcoded date!)
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [budgetSubTab, setBudgetSubTab] = useState<'envelopes' | 'infographics' | 'subscriptions' | 'goals' | 'simulator'>('envelopes');

  const openSimulator = (type: 'compounding' | 'budget' = 'budget') => {
    if (type === 'compounding') {
      setActiveTab('compounding');
    } else {
      setActiveTab('budgets');
      setBudgetSubTab('simulator');
    }
  };

  // Modals & Sheets
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualModalPrefill, setManualModalPrefill] = useState<ManualPrefill | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [dismissedAnomalyIds, setDismissedAnomalyIds] = useState<Set<string>>(new Set());

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: ToastMessage = { id, duration: 5000, ...toast };
    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync to local storage on changes
  useEffect(() => {
    if (profile) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  }, [wallets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(categoryRules));
  }, [categoryRules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECURRING, JSON.stringify(recurringItems));
  }, [recurringItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_DEMO, String(isDemoSession));
  }, [isDemoSession]);

  useEffect(() => {
    setLocalHousehold(household);
  }, [household]);

  useEffect(() => {
    setLocalHouseholdMembers(householdMembers);
  }, [householdMembers]);

  useEffect(() => {
    setLocalHouseholdBudgets(householdBudgets);
  }, [householdBudgets]);

  useEffect(() => {
    setLocalHouseholdGoals(householdGoals);
  }, [householdGoals]);

  useEffect(() => {
    setLocalEntitlements(entitlements);
  }, [entitlements]);

  // Selected Month formatted "YYYY-MM"
  const selectedMonthStr = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [selectedDate]);

  // Phase 8: Family Finance Computed Memos
  const hasFamilyPremium = useMemo(() => {
    if (household?.plan === 'family_premium') return true;
    return entitlements.some((e) => e.feature === 'family_premium');
  }, [household, entitlements]);

  const householdMonthlySummary = useMemo(() => {
    if (!household) return [];
    return calculateHouseholdMonthlySummary(household.id, `${selectedMonthStr}-01`, householdMembers, transactions);
  }, [household, selectedMonthStr, householdMembers, transactions]);

  const householdLedger = useMemo(() => {
    if (!household || !profile) return [];
    const viewingUserId = isPartnerPreview ? 'partner_preview_mode' : profile.id;
    return filterHouseholdLedger(household.id, viewingUserId, transactions);
  }, [household, profile, isPartnerPreview, transactions]);

  const changeMonth = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  // Duplicate pairs & Anomalies calculation
  const duplicatePairs = useMemo(() => {
    return scanDuplicates(transactions, 60);
  }, [transactions]);

  const anomalies = useMemo(() => {
    const list = scanAnomalies(transactions, categories);
    return list.filter((a) => !dismissedAnomalyIds.has(a.transaction.id));
  }, [transactions, categories, dismissedAnomalyIds]);

  const pendingReviewCount = duplicatePairs.length + anomalies.length;

  // Refresh AI insights
  const refreshInsights = async () => {
    if (!profile) return;
    try {
      const list = await generateAIInsights(
        transactions,
        categories,
        profile.id,
        profile.base_currency || 'INR',
        selectedDate
      );
      setInsights(list);
    } catch (err) {
      console.error('Failed to generate insights:', err);
    }
  };

  // Initial insights generation
  useEffect(() => {
    if (profile && transactions.length > 0) {
      refreshInsights();
    }
  }, [profile?.id, selectedMonthStr]);

  // Supabase Session Restore & Auth Listener
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // 1. Restore active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !isDemoSession) {
        const user = session.user;
        fetchUserData(user.id).then((remoteData) => {
          if (remoteData) {
            if (remoteData.profile) setProfile(remoteData.profile);
            if (remoteData.wallets.length > 0) setWallets(remoteData.wallets);
            if (remoteData.categories.length > 0) setCategories(remoteData.categories);
            if (remoteData.transactions.length > 0) setTransactions(remoteData.transactions);
            if (remoteData.budgets.length > 0) setBudgets(remoteData.budgets);
            if (remoteData.categoryRules.length > 0) setCategoryRules(remoteData.categoryRules);
          }
        });
      }
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        const remote = await fetchUserData(user.id);
        if (remote) {
          if (remote.profile) setProfile(remote.profile);
          if (remote.wallets.length > 0) setWallets(remote.wallets);
          if (remote.categories.length > 0) setCategories(remote.categories);
          if (remote.transactions.length > 0) setTransactions(remote.transactions);
          if (remote.budgets.length > 0) setBudgets(remote.budgets);
          if (remote.categoryRules.length > 0) setCategoryRules(remote.categoryRules);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemoSession]);

  // Outbox background sync listener
  useEffect(() => {
    const handleOnline = () => {
      syncOutbox().then((res) => {
        if (res.syncedCount > 0) {
          addToast({
            title: 'Cloud Synchronized',
            message: `Synced ${res.syncedCount} transaction update(s).`,
            type: 'success',
          });
        }
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      handleOnline();
      return () => {
        window.removeEventListener('online', handleOnline);
      };
    }
  }, []);

  // Realtime changes subscription for multi-tab / multi-device sync
  useEffect(() => {
    if (!profile || isDemoSession || !isSupabaseConfigured) return;

    const unsubscribe = subscribeToUserChanges(profile.id, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setTransactions((prev) => {
          if (prev.some((t) => t.id === payload.new.id)) return prev;
          return [payload.new as Transaction, ...prev];
        });
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === payload.new.id ? (payload.new as Transaction) : t))
        );
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [profile?.id, isDemoSession]);

  // Clear all user data for fresh signup or reset
  const clearAllUserData = () => {
    setTransactions([]);
    setBudgets([]);
    setCategoryRules([]);
    setInsights([]);
    setWallets([]);
    setCategories(DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: 'default' })));
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.RULES);
    localStorage.removeItem(STORAGE_KEYS.INSIGHTS);
    localStorage.removeItem(STORAGE_KEYS.WALLETS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  };

  // Auth Functions
  const login = async (email: string, password?: string, name?: string) => {
    setIsDemoSession(false);
    localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'false');

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || '',
      });
      if (error) {
        throw new Error(mapSupabaseAuthError(error.message));
      }
      if (data.user) {
        const remote = await fetchUserData(data.user.id);
        const newProf: Profile = remote?.profile || {
          id: data.user.id,
          email: data.user.email || email,
          display_name: name || data.user.user_metadata?.display_name || email.split('@')[0],
          base_currency: 'INR',
          ai_consent: 'none',
          onboarded_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        setProfile(newProf);
        if (remote) {
          if (remote.wallets.length > 0) setWallets(remote.wallets);
          if (remote.categories.length > 0) setCategories(remote.categories);
          if (remote.transactions.length > 0) setTransactions(remote.transactions);
          if (remote.budgets.length > 0) setBudgets(remote.budgets);
          if (remote.categoryRules.length > 0) setCategoryRules(remote.categoryRules);
        }
        addToast({ title: 'Welcome back!', message: `Logged in as ${newProf.display_name}`, type: 'success' });
        return;
      }
    }

    // Local Auth mode
    const newProf: Profile = {
      id: `user_${Date.now()}`,
      email,
      display_name: name || email.split('@')[0],
      base_currency: 'INR',
      ai_consent: 'none',
      onboarded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setProfile(newProf);
    addToast({ title: 'Welcome back!', message: `Logged in as ${newProf.display_name}`, type: 'success' });
  };

  const loginAsDemo = () => {
    setIsDemoSession(true);
    localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'true');
    const demo = getInitialDemoState('demo_user_1');
    setProfile(demo.profile);
    setWallets(demo.wallets);
    setCategories(demo.categories);
    setTransactions(demo.transactions);
    setBudgets(demo.budgets);
    setCategoryRules(demo.rules);
    addToast({ title: 'Demo Mode Active', message: 'Logged in with 40+ seeded transactions & budget data', type: 'info' });
  };

  const signup = async (email: string, name: string, password?: string) => {
    setIsDemoSession(false);
    localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'false');
    clearAllUserData();

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || '',
        options: {
          data: { display_name: name },
        },
      });
      if (error) {
        throw new Error(mapSupabaseAuthError(error.message));
      }
      const newProf: Profile = {
        id: data.user?.id || `user_${Date.now()}`,
        email,
        display_name: name,
        base_currency: 'INR',
        ai_consent: 'none',
        onboarded_at: null, // Gate to Onboarding
        created_at: new Date().toISOString(),
      };
      setProfile(newProf);
      return;
    }

    // Local signup
    const newProf: Profile = {
      id: `user_${Date.now()}`,
      email,
      display_name: name,
      base_currency: 'INR',
      ai_consent: 'none',
      onboarded_at: null, // Gate to Onboarding
      created_at: new Date().toISOString(),
    };
    setProfile(newProf);
  };

  const signInWithMagicLink = async (email: string) => {
    setIsDemoSession(false);
    localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'false');

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw new Error(mapSupabaseAuthError(error.message));
      addToast({
        title: 'Magic Link Sent!',
        message: 'Check your email for the secure login link.',
        type: 'success',
        duration: 8000,
      });
      return;
    }

    // Local simulation
    addToast({
      title: 'Local Mode Simulation',
      message: `Simulated magic link dispatched to ${email}.`,
      type: 'info',
    });
  };

  const logout = () => {
    setProfile(null);
    setIsDemoSession(false);
    localStorage.removeItem(STORAGE_KEYS.IS_DEMO);
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
    addToast({ title: 'Logged out', message: 'You have been signed out.', type: 'info' });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    setProfile(updated);
    if (!isDemoSession) {
      saveProfile(updated);
    }
    addToast({ title: 'Profile Updated', message: 'Your settings have been saved.', type: 'success' });
  };

  const completeOnboarding = async (currency: string, walletName: string, budgetCategory?: string, budgetAmount?: number) => {
    if (!profile) return;

    if (!isDemoSession) {
      setTransactions([]);
      setBudgets([]);
    }

    const updatedProf: Profile = {
      ...profile,
      base_currency: currency,
      onboarded_at: new Date().toISOString(),
    };
    setProfile(updatedProf);
    if (!isDemoSession) saveProfile(updatedProf);

    // Create primary wallet
    const newWallet: Wallet = {
      id: `wallet_${Date.now()}`,
      user_id: profile.id,
      name: walletName || 'Main Account',
      type: 'bank',
      currency,
      opening_balance: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
    };
    setWallets([newWallet]);
    if (!isDemoSession) saveWallet(newWallet, true);

    // Optional Budget
    if (budgetCategory && budgetAmount && budgetAmount > 0) {
      const newBudget: Budget = {
        id: `budget_${Date.now()}`,
        user_id: profile.id,
        category_id: budgetCategory,
        period: 'monthly',
        amount: budgetAmount,
        start_month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
        alert_threshold: 80,
        created_at: new Date().toISOString(),
      };
      setBudgets([newBudget]);
      if (!isDemoSession) saveBudget(newBudget, true);
    }

    addToast({ title: 'Setup Complete!', message: 'Welcome to ClearSpend. Start logging in one line.', type: 'success' });
  };

  // Open manual add modal with pre-filled fields & optional hint
  const openManualAdd = (prefill?: ManualPrefill) => {
    setEditingTransaction(null);
    setManualModalPrefill(prefill || null);
    setIsManualModalOpen(true);
  };

  // Add Transaction
  const addTransaction = async (data: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Transaction> => {
    if (!profile) throw new Error('Not authenticated');

    const id = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fp = data.fingerprint || generateFingerprint(data.merchant, data.note, data.amount, data.txn_date, data.wallet_id);

    const newTxn: Transaction = {
      ...data,
      id,
      user_id: profile.id,
      amount: Math.abs(Number(data.amount)),
      fingerprint: fp,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTransactions((prev) => [newTxn, ...prev]);
    if (!isDemoSession) {
      saveTransaction(newTxn, true);
    }

    // Run duplicate detection on newly inserted row
    const existingDuplicates = transactions.filter(
      (t) =>
        t.status === 'active' &&
        t.id !== newTxn.id &&
        Number(t.amount) === Number(newTxn.amount) &&
        t.kind === newTxn.kind &&
        Math.abs(new Date(t.txn_date).getTime() - new Date(newTxn.txn_date).getTime()) <= 86400000 * 2
    );

    if (existingDuplicates.length > 0) {
      newTxn.duplicate_of_id = existingDuplicates[0].id;
      addToast({
        title: 'Possible Duplicate Detected',
        message: `Matches an existing ${profile.base_currency} ${newTxn.amount} transaction. Review in Inbox.`,
        type: 'warning',
        actionLabel: 'Review',
        onAction: () => setActiveTab('review'),
      });
    }

    return newTxn;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    let updatedTxn: Transaction | null = null;
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          updatedTxn = { ...t, ...updates, updated_at: new Date().toISOString() };
          return updatedTxn;
        }
        return t;
      })
    );
    if (updatedTxn && !isDemoSession) {
      saveTransaction(updatedTxn, false);
    }
    addToast({ title: 'Transaction Updated', message: 'Changes saved successfully.', type: 'success' });
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (!isDemoSession) {
      removeTransaction(id);
    }
    addToast({ title: 'Transaction Deleted', message: 'Transaction removed from ledger.', type: 'info' });
  };

  const bulkRecategorize = async (transactionIds: string[], newCategoryId: string) => {
    const targetCat = categories.find((c) => c.id === newCategoryId);
    setTransactions((prev) =>
      prev.map((t) => {
        if (transactionIds.includes(t.id)) {
          const updated = { ...t, category_id: newCategoryId, updated_at: new Date().toISOString() };
          if (!isDemoSession) saveTransaction(updated, false);
          return updated;
        }
        return t;
      })
    );
    addToast({
      title: 'Bulk Updated',
      message: `Recategorized ${transactionIds.length} transactions to ${targetCat?.name || 'new category'}.`,
      type: 'success',
    });
  };

  const bulkDeleteTransactions = async (transactionIds: string[]) => {
    setTransactions((prev) => prev.filter((t) => !transactionIds.includes(t.id)));
    if (!isDemoSession) {
      transactionIds.forEach((id) => removeTransaction(id));
    }
    addToast({
      title: 'Transactions Deleted',
      message: `Removed ${transactionIds.length} transactions.`,
      type: 'info',
    });
  };

  // Category Rule Learning
  const learnCategoryRule = async (merchant: string, categoryId: string, applyToPast: boolean = false) => {
    if (!profile || !merchant.trim()) return { pastUpdatedCount: 0 };
    const cleanMatch = merchant.toLowerCase().trim();

    let savedRule: CategoryRule | null = null;
    let isNewRule = false;

    // Upsert rule
    setCategoryRules((prev) => {
      const idx = prev.findIndex((r) => r.match_text === cleanMatch);
      if (idx >= 0) {
        const updated = [...prev];
        savedRule = {
          ...updated[idx],
          category_id: categoryId,
          hit_count: updated[idx].hit_count + 1,
          updated_at: new Date().toISOString(),
        };
        updated[idx] = savedRule;
        return updated;
      } else {
        isNewRule = true;
        savedRule = {
          id: `rule_${Date.now()}`,
          user_id: profile.id,
          match_text: cleanMatch,
          category_id: categoryId,
          hit_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return [...prev, savedRule];
      }
    });

    if (savedRule && !isDemoSession) {
      saveRule(savedRule, isNewRule);
    }

    let pastUpdatedCount = 0;
    if (applyToPast) {
      setTransactions((prev) =>
        prev.map((t) => {
          if (
            t.status === 'active' &&
            t.category_id !== categoryId &&
            (t.merchant.toLowerCase().includes(cleanMatch) || (t.note && t.note.toLowerCase().includes(cleanMatch)))
          ) {
            pastUpdatedCount++;
            const updated = { ...t, category_id: categoryId, was_corrected: true, updated_at: new Date().toISOString() };
            if (!isDemoSession) saveTransaction(updated, false);
            return updated;
          }
          return t;
        })
      );
    }

    return { pastUpdatedCount };
  };

  // Review Merge & Duplicate Resolution
  const mergeDuplicatePair = async (originalId: string, duplicateId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === duplicateId) {
          const u = { ...t, status: 'merged' as const, updated_at: new Date().toISOString() };
          if (!isDemoSession) saveTransaction(u, false);
          return u;
        }
        if (t.id === originalId) {
          const u = { ...t, duplicate_of_id: null, updated_at: new Date().toISOString() };
          if (!isDemoSession) saveTransaction(u, false);
          return u;
        }
        return t;
      })
    );
    addToast({ title: 'Merged', message: 'Duplicate transaction marked as merged.', type: 'success' });
  };

  const keepBothDuplicates = async (duplicateId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === duplicateId) {
          const u = { ...t, duplicate_of_id: null, updated_at: new Date().toISOString() };
          if (!isDemoSession) saveTransaction(u, false);
          return u;
        }
        return t;
      })
    );
    addToast({ title: 'Kept Both', message: 'Both transactions kept active.', type: 'info' });
  };

  const dismissAnomaly = (transactionId: string) => {
    setDismissedAnomalyIds((prev) => new Set([...prev, transactionId]));
    addToast({ title: 'Verified', message: 'Transaction flagged as verified.', type: 'success' });
  };

  // Wallets CRUD
  const addWallet = async (w: Omit<Wallet, 'id' | 'user_id' | 'created_at'>) => {
    if (!profile) return;
    const newW: Wallet = { ...w, id: `wallet_${Date.now()}`, user_id: profile.id, created_at: new Date().toISOString() };
    setWallets((prev) => [...prev, newW]);
    if (!isDemoSession) saveWallet(newW, true);
    addToast({ title: 'Wallet Created', message: `${newW.name} added.`, type: 'success' });
  };

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated = { ...w, ...updates };
          if (!isDemoSession) saveWallet(updated, false);
          return updated;
        }
        return w;
      })
    );
    addToast({ title: 'Wallet Updated', message: 'Wallet details saved.', type: 'success' });
  };

  const deleteWallet = async (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
    if (!isDemoSession) removeWallet(id);
    addToast({ title: 'Wallet Removed', message: 'Wallet has been deleted.', type: 'info' });
  };

  // Categories CRUD
  const addCategory = async (cat: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
    if (!profile) return;
    const newCat: Category = { ...cat, id: `cat_${Date.now()}`, user_id: profile.id, created_at: new Date().toISOString() };
    setCategories((prev) => [...prev, newCat]);
    if (!isDemoSession) saveCategory(newCat, true);
    addToast({ title: 'Category Created', message: `${newCat.name} created.`, type: 'success' });
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          if (!isDemoSession) saveCategory(updated, false);
          return updated;
        }
        return c;
      })
    );
    addToast({ title: 'Category Updated', message: 'Category details saved.', type: 'success' });
  };

  const deleteCategory = async (id: string, reassignToCategoryId?: string) => {
    if (reassignToCategoryId) {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.category_id === id) {
            const updated = { ...t, category_id: reassignToCategoryId, updated_at: new Date().toISOString() };
            if (!isDemoSession) saveTransaction(updated, false);
            return updated;
          }
          return t;
        })
      );
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (!isDemoSession) removeCategory(id);
    addToast({ title: 'Category Deleted', message: 'Category removed and transactions reassigned.', type: 'info' });
  };

  // Budgets CRUD
  const addBudget = async (b: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => {
    if (!profile) return;
    const newB: Budget = { ...b, id: `budget_${Date.now()}`, user_id: profile.id, created_at: new Date().toISOString() };
    setBudgets((prev) => [...prev, newB]);
    if (!isDemoSession) saveBudget(newB, true);
    addToast({ title: 'Budget Set', message: `Budget allocated successfully.`, type: 'success' });
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updated = { ...b, ...updates };
          if (!isDemoSession) saveBudget(updated, false);
          return updated;
        }
        return b;
      })
    );
    addToast({ title: 'Budget Updated', message: 'Budget limit updated.', type: 'success' });
  };

  const deleteBudget = async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    if (!isDemoSession) removeBudget(id);
    addToast({ title: 'Budget Removed', message: 'Budget tracking deleted.', type: 'info' });
  };

  const getCategory3MonthAverage = (categoryId: string): number => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);

    const relevant = transactions.filter(
      (t) => t.status === 'active' && t.category_id === categoryId && t.kind === 'expense' && new Date(t.txn_date) >= cutoff
    );

    const total = relevant.reduce((sum, t) => sum + t.amount, 0);
    return Math.round(total / 3) || 2000;
  };

  // Recurring Subscriptions CRUD
  const addRecurringItem = async (data: Omit<RecurringItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const userId = profile?.id || 'offline_user';
    const newItem: RecurringItem = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setRecurringItems((prev) => [newItem, ...prev]);
    addToast({ title: 'Subscription Added', message: `${newItem.merchant} added to recurring register.`, type: 'success' });
  };

  const updateRecurringItem = async (id: string, updates: Partial<RecurringItem>) => {
    setRecurringItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r))
    );
    addToast({ title: 'Updated', message: 'Recurring item updated.', type: 'success' });
  };

  const deleteRecurringItem = async (id: string) => {
    setRecurringItems((prev) => prev.filter((r) => r.id !== id));
    addToast({ title: 'Removed', message: 'Subscription removed from register.', type: 'info' });
  };

  // Savings Goals CRUD
  const addGoal = async (data: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const userId = profile?.id || 'offline_user';
    const newGoal: Goal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setGoals((prev) => [newGoal, ...prev]);
    addToast({ title: 'Goal Created', message: `Savings goal "${newGoal.title}" created!`, type: 'success' });
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g))
    );
    addToast({ title: 'Goal Updated', message: 'Savings goal updated.', type: 'success' });
  };

  const deleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    addToast({ title: 'Goal Removed', message: 'Savings goal deleted.', type: 'info' });
  };

  // Parsing Natural Language
  const parseNaturalLanguage = async (text: string): Promise<ParseOutcome> => {
    return parseTransactionInput(text, categories, wallets, categoryRules, profile?.base_currency || 'INR');
  };

  const dismissInsight = (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  // Phase 8: Family Finance AI Actions
  const createNewHousehold = async (name: string, ownerName: string) => {
    if (!profile) return;
    const { household: newHh, member } = await createHousehold(name, ownerName || profile.display_name, profile.id);
    setHousehold(newHh);
    setHouseholdMembers([member]);
    setViewScope('household');
    addToast({ title: 'Family Room Created', message: `Welcome to ${newHh.name}! You can now invite your partner.`, type: 'success' });
  };

  const inviteHouseholdPartner = async (email: string): Promise<HouseholdInvite> => {
    if (!household || !profile) throw new Error('No active household');
    const invite = await createHouseholdInvite(household.id, email, profile.id);
    addToast({ title: 'Invite Generated', message: `Invitation link created for ${email}`, type: 'success' });
    return invite;
  };

  const updateSharingPreferences = async (
    shareSummary: boolean,
    shareCategories: boolean,
    contributionShare?: number | null
  ) => {
    if (!household || !profile) return;
    await updateMemberSharingToggles(household.id, profile.id, shareSummary, shareCategories, contributionShare || 0.5);
    setHouseholdMembers((prev) =>
      prev.map((m) =>
        m.user_id === profile.id
          ? { ...m, share_summary: shareSummary, share_categories: shareCategories, contribution_share: contributionShare !== undefined ? contributionShare : m.contribution_share }
          : m
      )
    );
    addToast({ title: 'Privacy Preferences Saved', message: 'Your household sharing rules have been updated.', type: 'success' });
  };

  const leaveCurrentHousehold = async (resolveOption: 'keep_personal' | 'transfer_owner' = 'keep_personal') => {
    if (!household || !profile) return;
    await leaveHousehold(household.id, profile.id, resolveOption);
    setHousehold(null);
    setHouseholdMembers([]);
    setHouseholdBudgets([]);
    setHouseholdGoals([]);
    setViewScope('personal');
    addToast({ title: 'Left Household', message: 'You have exited the family room. All your data is restored to private.', type: 'info' });
  };

  const addJointBudget = async (budget: Omit<HouseholdBudget, 'id' | 'created_at'>) => {
    if (!household || !profile) return;
    const newB: HouseholdBudget = {
      id: `hb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...budget,
      created_at: new Date().toISOString(),
    };
    setHouseholdBudgets((prev) => [...prev, newB]);
    addToast({ title: 'Shared Envelope Added', message: `Joint budget "${newB.name}" active.`, type: 'success' });
  };

  const addJointGoal = async (goal: Omit<HouseholdGoal, 'id' | 'created_at' | 'is_achieved'>) => {
    if (!household || !profile) return;
    const newG: HouseholdGoal = {
      id: `hg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...goal,
      is_achieved: false,
      created_at: new Date().toISOString(),
    };
    setHouseholdGoals((prev) => [...prev, newG]);
    addToast({ title: 'Joint Goal Created', message: `Goal "${newG.name}" created!`, type: 'success' });
  };

  const contributeToJointGoal = async (goalId: string, amount: number) => {
    setHouseholdGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const newSaved = g.saved_amount + amount;
          return {
            ...g,
            saved_amount: newSaved,
            is_achieved: newSaved >= g.target_amount,
          };
        }
        return g;
      })
    );
    addToast({ title: 'Contribution Logged', message: `Added ₹${amount.toLocaleString('en-IN')} to joint goal!`, type: 'success' });
  };

  const upgradeToFamilyPremium = async () => {
    if (household) {
      const updated = { ...household, plan: 'family_premium' as const };
      setHousehold(updated);
    }
    const newEnt: Entitlement = {
      id: `ent_${Date.now()}`,
      household_id: household?.id,
      user_id: profile?.id,
      feature: 'family_premium',
      granted_at: new Date().toISOString(),
      source: 'demo',
    };
    setEntitlements((prev) => [...prev, newEnt]);
    addToast({ title: 'Family Premium Unlocked 🎉', message: 'All advanced AI and multi-goal tools active!', type: 'success' });
  };

  // Reset to full demo state
  const resetToDemoData = () => {
    setIsDemoSession(true);
    localStorage.setItem(STORAGE_KEYS.IS_DEMO, 'true');
    const demo = getInitialDemoState(profile?.id || 'demo_user_1');
    setWallets(demo.wallets);
    setCategories(demo.categories);
    setTransactions(demo.transactions);
    setBudgets(demo.budgets);
    setCategoryRules(demo.rules);
    setRecurringItems((demo as any).recurringItems || []);
    setGoals((demo as any).goals || []);
    if ((demo as any).demoHousehold) {
      setHousehold((demo as any).demoHousehold.household);
      setHouseholdMembers((demo as any).demoHousehold.members);
      setHouseholdBudgets((demo as any).demoHousehold.budgets);
      setHouseholdGoals((demo as any).demoHousehold.goals);
    }
    addToast({ title: 'Ledger Reset', message: 'Restored realistic multi-month demo transactions & family room.', type: 'success' });
  };

  return (
    <StoreContext.Provider
      value={{
        profile,
        isAuthenticated: Boolean(profile),
        isOnboarded: Boolean(profile?.onboarded_at),
        isDemoSession,
        login,
        loginAsDemo,
        signup,
        signInWithMagicLink,
        logout,
        updateProfile,
        completeOnboarding,
        clearAllUserData,
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        selectedMonthStr,
        changeMonth,
        wallets,
        categories,
        transactions,
        budgets,
        categoryRules,
        insights,
        recurringItems,
        goals,
        duplicatePairs,
        anomalies,
        pendingReviewCount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        bulkRecategorize,
        bulkDeleteTransactions,
        learnCategoryRule,
        mergeDuplicatePair,
        keepBothDuplicates,
        dismissAnomaly,
        addWallet,
        updateWallet,
        deleteWallet,
        addCategory,
        updateCategory,
        deleteCategory,
        addBudget,
        updateBudget,
        deleteBudget,
        getCategory3MonthAverage,
        addRecurringItem,
        updateRecurringItem,
        deleteRecurringItem,
        addGoal,
        updateGoal,
        deleteGoal,
        parseNaturalLanguage,
        refreshInsights,
        dismissInsight,
        isManualModalOpen,
        setIsManualModalOpen,
        manualModalPrefill,
        openManualAdd,
        editingTransaction,
        setEditingTransaction,
        activeCategoryFilter,
        setActiveCategoryFilter,
        budgetSubTab,
        setBudgetSubTab,
        openSimulator,
        viewScope,
        setViewScope,
        household,
        householdMembers,
        householdBudgets,
        householdGoals,
        householdAuditLog,
        entitlements,
        hasFamilyPremium,
        isPartnerPreview,
        setIsPartnerPreview,
        householdMonthlySummary,
        householdLedger,
        createNewHousehold,
        inviteHouseholdPartner,
        updateSharingPreferences,
        leaveCurrentHousehold,
        addJointBudget,
        addJointGoal,
        contributeToJointGoal,
        upgradeToFamilyPremium,
        toasts,
        addToast,
        removeToast,
        resetToDemoData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
