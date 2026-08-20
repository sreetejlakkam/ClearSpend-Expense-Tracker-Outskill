import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AnomalyItem,
  Budget,
  Category,
  CategoryRule,
  DuplicatePair,
  Insight,
  ParsedTransactionResult,
  Profile,
  Transaction,
  Wallet,
} from '../types';
import { generateAIInsights, scanAnomalies, scanDuplicates } from './insights';
import { generateFingerprint, parseTransactionInput } from './parser';
import { getInitialDemoState } from './storage';
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

interface StoreContextType {
  // Auth & Profile
  profile: Profile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (email: string, name?: string) => Promise<void>;
  loginAsDemo: () => void;
  signup: (email: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  completeOnboarding: (currency: string, walletName: string, budgetCategory?: string, budgetAmount?: number) => Promise<void>;

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

  // AI & Parsing
  parseNaturalLanguage: (text: string) => Promise<ParsedTransactionResult>;
  refreshInsights: () => Promise<void>;
  dismissInsight: (id: string) => void;

  // UI Modals & State
  isManualModalOpen: boolean;
  setIsManualModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (txn: Transaction | null) => void;
  activeCategoryFilter: string | null;
  setActiveCategoryFilter: (catId: string | null) => void;

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
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state
  const demoData = useMemo(() => getInitialDemoState('demo_user_1'), []);

  const [profile, setProfile] = useState<Profile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : demoData.profile;
  });

  const [wallets, setWallets] = useState<Wallet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WALLETS);
    return saved ? JSON.parse(saved) : demoData.wallets;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : demoData.categories;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : demoData.transactions;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    return saved ? JSON.parse(saved) : demoData.budgets;
  });

  const [categoryRules, setCategoryRules] = useState<CategoryRule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RULES);
    return saved ? JSON.parse(saved) : demoData.rules;
  });

  const [insights, setInsights] = useState<Insight[]>([]);

  // Navigation & Selected month (August 2026 as per local context)
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 7, 20)); // August 2026
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

  // Modals & Sheets
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
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
    if (profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
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

  // Selected Month formatted "YYYY-MM"
  const selectedMonthStr = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [selectedDate]);

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

  // Auth Functions
  const login = async (email: string, name?: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: 'password123',
        });
        if (!error && data.user) {
          const newProf: Profile = {
            id: data.user.id,
            email: data.user.email || email,
            display_name: name || data.user.user_metadata?.display_name || email.split('@')[0],
            base_currency: 'INR',
            onboarded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };
          setProfile(newProf);
          addToast({ title: 'Welcome back!', message: `Logged in as ${newProf.display_name}`, type: 'success' });
          return;
        }
      } catch (err) {
        console.warn('Supabase login failed, using local auth mode:', err);
      }
    }

    // Local Auth fallback
    const newProf: Profile = {
      id: `user_${Date.now()}`,
      email,
      display_name: name || email.split('@')[0],
      base_currency: 'INR',
      onboarded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    setProfile(newProf);
    addToast({ title: 'Welcome back!', message: `Logged in as ${newProf.display_name}`, type: 'success' });
  };

  const loginAsDemo = () => {
    const demo = getInitialDemoState('demo_user_1');
    setProfile(demo.profile);
    setWallets(demo.wallets);
    setCategories(demo.categories);
    setTransactions(demo.transactions);
    setBudgets(demo.budgets);
    setCategoryRules(demo.rules);
    addToast({ title: 'Demo Mode Active', message: 'Logged in with 40+ seeded transactions & budget data', type: 'info' });
  };

  const signup = async (email: string, name: string) => {
    const newProf: Profile = {
      id: `user_${Date.now()}`,
      email,
      display_name: name,
      base_currency: 'INR',
      onboarded_at: null, // Needs onboarding
      created_at: new Date().toISOString(),
    };
    setProfile(newProf);
  };

  const logout = () => {
    setProfile(null);
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
    addToast({ title: 'Logged out', message: 'You have been signed out.', type: 'info' });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    setProfile(updated);
    addToast({ title: 'Profile Updated', message: 'Your settings have been saved.', type: 'success' });
  };

  const completeOnboarding = async (currency: string, walletName: string, budgetCategory?: string, budgetAmount?: number) => {
    if (!profile) return;
    const updatedProf: Profile = {
      ...profile,
      base_currency: currency,
      onboarded_at: new Date().toISOString(),
    };
    setProfile(updatedProf);

    // Create wallet
    const newWallet: Wallet = {
      id: `wallet_${Date.now()}`,
      user_id: profile.id,
      name: walletName || 'Main Wallet',
      type: 'bank',
      currency,
      opening_balance: 0,
      is_archived: false,
      created_at: new Date().toISOString(),
    };
    setWallets([newWallet]);

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
      setBudgets((prev) => [...prev, newBudget]);
    }

    addToast({ title: 'Setup Complete!', message: 'Welcome to ClearSpend. Start logging in one line.', type: 'success' });
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
      // Flag potential duplicate
      newTxn.duplicate_of_id = existingDuplicates[0].id;
      addToast({
        title: 'Possible Duplicate Detected',
        message: `This matches an existing ${profile.base_currency} ${newTxn.amount} transaction. Review in Inbox.`,
        type: 'warning',
        actionLabel: 'Review',
        onAction: () => setActiveTab('review'),
      });
    }

    return newTxn;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
    );
    addToast({ title: 'Transaction Updated', message: 'Changes saved successfully.', type: 'success' });
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    addToast({ title: 'Transaction Deleted', message: 'Transaction removed from ledger.', type: 'info' });
  };

  const bulkRecategorize = async (transactionIds: string[], newCategoryId: string) => {
    const targetCat = categories.find((c) => c.id === newCategoryId);
    setTransactions((prev) =>
      prev.map((t) =>
        transactionIds.includes(t.id) ? { ...t, category_id: newCategoryId, updated_at: new Date().toISOString() } : t
      )
    );
    addToast({
      title: 'Bulk Updated',
      message: `Recategorized ${transactionIds.length} transactions to ${targetCat?.name || 'new category'}.`,
      type: 'success',
    });
  };

  const bulkDeleteTransactions = async (transactionIds: string[]) => {
    setTransactions((prev) => prev.filter((t) => !transactionIds.includes(t.id)));
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

    // Upsert rule
    setCategoryRules((prev) => {
      const idx = prev.findIndex((r) => r.match_text === cleanMatch);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          category_id: categoryId,
          hit_count: updated[idx].hit_count + 1,
          updated_at: new Date().toISOString(),
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `rule_${Date.now()}`,
            user_id: profile.id,
            match_text: cleanMatch,
            category_id: categoryId,
            hit_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }
    });

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
            return { ...t, category_id: categoryId, was_corrected: true, updated_at: new Date().toISOString() };
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
          return { ...t, status: 'merged', updated_at: new Date().toISOString() };
        }
        if (t.id === originalId) {
          return { ...t, duplicate_of_id: null, updated_at: new Date().toISOString() };
        }
        return t;
      })
    );
    addToast({ title: 'Merged', message: 'Duplicate transaction marked as merged.', type: 'success' });
  };

  const keepBothDuplicates = async (duplicateId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === duplicateId ? { ...t, duplicate_of_id: null, updated_at: new Date().toISOString() } : t))
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
    addToast({ title: 'Wallet Created', message: `${newW.name} added.`, type: 'success' });
  };

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    addToast({ title: 'Wallet Updated', message: 'Wallet details saved.', type: 'success' });
  };

  const deleteWallet = async (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
    addToast({ title: 'Wallet Removed', message: 'Wallet has been deleted.', type: 'info' });
  };

  // Categories CRUD
  const addCategory = async (cat: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
    if (!profile) return;
    const newCat: Category = { ...cat, id: `cat_${Date.now()}`, user_id: profile.id, created_at: new Date().toISOString() };
    setCategories((prev) => [...prev, newCat]);
    addToast({ title: 'Category Created', message: `${newCat.name} created.`, type: 'success' });
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addToast({ title: 'Category Updated', message: 'Category details saved.', type: 'success' });
  };

  const deleteCategory = async (id: string, reassignToCategoryId?: string) => {
    if (reassignToCategoryId) {
      setTransactions((prev) =>
        prev.map((t) => (t.category_id === id ? { ...t, category_id: reassignToCategoryId } : t))
      );
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    addToast({ title: 'Category Deleted', message: 'Category removed and transactions reassigned.', type: 'info' });
  };

  // Budgets CRUD
  const addBudget = async (b: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => {
    if (!profile) return;
    const newB: Budget = { ...b, id: `budget_${Date.now()}`, user_id: profile.id, created_at: new Date().toISOString() };
    setBudgets((prev) => [...prev, newB]);
    addToast({ title: 'Budget Set', message: `Budget allocated successfully.`, type: 'success' });
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    addToast({ title: 'Budget Updated', message: 'Budget limit updated.', type: 'success' });
  };

  const deleteBudget = async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
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

  // Parsing Natural Language
  const parseNaturalLanguage = async (text: string): Promise<ParsedTransactionResult> => {
    return parseTransactionInput(text, categories, wallets, categoryRules, profile?.base_currency || 'INR');
  };

  const dismissInsight = (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  // Reset to full demo state
  const resetToDemoData = () => {
    const demo = getInitialDemoState(profile?.id || 'demo_user_1');
    setWallets(demo.wallets);
    setCategories(demo.categories);
    setTransactions(demo.transactions);
    setBudgets(demo.budgets);
    setCategoryRules(demo.rules);
    addToast({ title: 'Ledger Reset', message: 'Restored realistic 40+ demo transactions.', type: 'success' });
  };

  return (
    <StoreContext.Provider
      value={{
        profile,
        isAuthenticated: Boolean(profile),
        isOnboarded: Boolean(profile?.onboarded_at),
        login,
        loginAsDemo,
        signup,
        logout,
        updateProfile,
        completeOnboarding,
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
        parseNaturalLanguage,
        refreshInsights,
        dismissInsight,
        isManualModalOpen,
        setIsManualModalOpen,
        editingTransaction,
        setEditingTransaction,
        activeCategoryFilter,
        setActiveCategoryFilter,
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
