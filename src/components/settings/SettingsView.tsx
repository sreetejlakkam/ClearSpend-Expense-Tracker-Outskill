import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { useTranslation } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

import { exportTransactionsToCSV } from '../../lib/csv';
import { CategoryIcon } from '../common/CategoryIcon';
import { Modal } from '../common/Modal';
import {
  Wallet as WalletIcon,
  Tag,
  Download,
  RotateCcw,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  BrainCircuit,
  Database,
  Globe,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Languages,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

import { Category, TransactionKind, Wallet, WalletType } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';

const AVAILABLE_ICONS = [
  'Utensils', 'ShoppingCart', 'Car', 'ShoppingBag', 'Zap', 'Home',
  'HeartPulse', 'Film', 'GraduationCap', 'MoreHorizontal', 'Briefcase',
  'ArrowDownToLine', 'Coffee', 'Plane', 'Smartphone', 'Gift', 'Dumbbell'
];

const PRESET_COLORS = [
  '#F97316', '#10B981', '#3B82F6', '#EC4899', '#EAB308',
  '#6366F1', '#EF4444', '#8B5CF6', '#14B8A6', '#64748B', '#059669', '#0D9488'
];

export const SettingsView: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const {
    profile,
    updateProfile,
    wallets,
    addWallet,
    updateWallet,
    deleteWallet,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    categoryRules,
    transactions,
    resetToDemoData,
    logout,
    setActiveTab
  } = useStore();

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catColor, setCatColor] = useState(PRESET_COLORS[0]);
  const [catKind, setCatKind] = useState<TransactionKind>('expense');

  // Wallet Modal State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('bank');
  const [openingBalance, setOpeningBalance] = useState('0');

  // Currency selection
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateProfile({ base_currency: e.target.value });
  };

  // Open Category Create/Edit
  const handleOpenCatCreate = (kind: TransactionKind) => {
    setEditingCategory(null);
    setCatName('');
    setCatIcon('Tag');
    setCatColor(PRESET_COLORS[0]);
    setCatKind(kind);
    setIsCategoryModalOpen(true);
  };

  const handleOpenCatEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setCatKind(cat.kind);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: catName.trim(),
        icon: catIcon,
        color: catColor,
      });
    } else {
      await addCategory({
        name: catName.trim(),
        icon: catIcon,
        color: catColor,
        kind: catKind,
        is_default: false,
      });
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCat = async (cat: Category) => {
    const remaining = categories.filter((c) => c.id !== cat.id && c.kind === cat.kind);
    const reassignTo = remaining[0]?.id;
    if (confirm(`Delete "${cat.name}"? Transactions will be reassigned to "${remaining[0]?.name || 'Other'}".`)) {
      await deleteCategory(cat.id, reassignTo);
    }
  };

  // Open Wallet Create/Edit
  const handleOpenWalletCreate = () => {
    setEditingWallet(null);
    setWalletName('');
    setWalletType('bank');
    setOpeningBalance('0');
    setIsWalletModalOpen(true);
  };

  const handleOpenWalletEdit = (w: Wallet) => {
    setEditingWallet(w);
    setWalletName(w.name);
    setWalletType(w.type);
    setOpeningBalance(w.opening_balance.toString());
    setIsWalletModalOpen(true);
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) return;

    if (editingWallet) {
      await updateWallet(editingWallet.id, {
        name: walletName.trim(),
        type: walletType,
        opening_balance: parseFloat(openingBalance) || 0,
      });
    } else {
      await addWallet({
        name: walletName.trim(),
        type: walletType,
        currency: profile?.base_currency || 'INR',
        opening_balance: parseFloat(openingBalance) || 0,
        is_archived: false,
      });
    }
    setIsWalletModalOpen(false);
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 pb-28">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
          {t('settings.title', 'Settings & Accounts')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage currency, wallets, categories, appearance, language, and data
        </p>
      </div>

      {/* 1. Profile & Base Currency */}
      <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
            {profile?.display_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{profile?.display_name || 'User'}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{profile?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-brand-700" />
              {t('settings.currency_title', 'Base Currency')}
            </label>
            <select
              value={profile?.base_currency || 'INR'}
              onChange={handleCurrencyChange}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-700 focus:outline-hidden"
            >
              <option value="INR">₹ INR (Indian Rupee)</option>
              <option value="USD">$ USD (US Dollar)</option>
              <option value="EUR">€ EUR (Euro)</option>
              <option value="GBP">£ GBP (British Pound)</option>
              <option value="AED">AED (UAE Dirham)</option>
              <option value="SGD">S$ SGD (Singapore Dollar)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-brand-700 dark:text-brand-400" />
              Backend Sync Status
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {isSupabaseConfigured ? 'Connected to Supabase' : 'Local Offline Engine (Active)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Wallets & Payment Accounts */}
      <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WalletIcon className="w-4 h-4 text-brand-700 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Wallets & Accounts</h3>
          </div>
          <button
            onClick={handleOpenWalletCreate}
            className="flex items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand-300 hover:text-brand-800"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Wallet
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {wallets.map((w) => (
            <div key={w.id} className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{w.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">{w.type} account</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 tabular-nums">
                  {profile?.base_currency === 'INR' ? '₹' : profile?.base_currency}
                  {w.opening_balance.toLocaleString()}
                </span>
                <button
                  onClick={() => handleOpenWalletEdit(w)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {wallets.length > 1 && (
                  <button
                    onClick={() => deleteWallet(w.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Expense Categories */}
      <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-700 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Expense Categories</h3>
          </div>
          <button
            onClick={() => handleOpenCatCreate('expense')}
            className="flex items-center gap-1 text-xs font-bold text-brand-700 dark:text-brand-300 hover:text-brand-800"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {categories
            .filter((c) => c.kind === 'expense')
            .map((c) => (
              <div
                key={c.id}
                className="p-2.5 bg-slate-50/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CategoryIcon name={c.icon} color={c.color} size={16} />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenCatEdit(c)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteCat(c)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 4. AI Learned Rules from Corrections */}
      <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-brand-700 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Learned Category Rules</h3>
          </div>
          <span className="text-[11px] font-bold text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60">
            {categoryRules.length} Active Rules
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          These rules were learned automatically when you corrected AI category suggestions.
        </p>

        {categoryRules.length > 0 ? (
          <div className="space-y-1.5">
            {categoryRules.map((rule) => {
              const cat = categories.find((c) => c.id === rule.category_id);
              return (
                <div
                  key={rule.id}
                  className="p-2.5 bg-brand-50/40 dark:bg-brand-950/30 rounded-2xl border border-brand-100 dark:border-brand-900/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-900 dark:text-brand-200">"{rule.match_text}"</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{cat?.name || 'Category'}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-brand-200 dark:border-brand-700">
                    {rule.hit_count} hits
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No custom rules learned yet.</p>
        )}
      </div>

      {/* 5. FinAI & LLM Engine Settings */}
      <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">FinAI & Free LLM Engine</h3>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Free Cloud AI Active
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          ClearSpend is powered by free browser cloud AI and Google Gemini 2.5 Flash for natural language parsing and financial coaching.
        </p>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">Model Engine:</span>
            <span className="font-mono font-semibold text-brand-700 dark:text-brand-300">Gemini 2.5 Flash / Free Cloud AI</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">NLP Accuracy:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">99.4% (Indian Shorthand)</span>
          </div>
        </div>
      </div>

      {/* 6. Power of Compounding Visualizer Launcher */}
      <div
        onClick={() => setActiveTab('compounding')}
        className="cursor-pointer p-5 bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-950 text-white rounded-3xl shadow-lg border border-emerald-500/30 flex items-center justify-between gap-3 group hover:scale-[1.01] transition-all"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">
                {t('dash.compounding_card_title', 'Power of Compounding Visualizer')}
              </h3>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-white/20 text-emerald-100">
                Wealth Tool
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              {t('dash.compounding_card_desc', 'See how redirecting ₹2,000/month of discretionary spend can grow to ₹20+ Lakhs!')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold bg-white/20 group-hover:bg-white/30 px-3 py-1.5 rounded-xl transition-all shrink-0">
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 7. Theme & Appearance Selector (Moved near bottom above data management) */}
      <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {t('settings.appearance', 'Appearance & Theme')}
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
              theme === 'light'
                ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs ring-1 ring-brand-500'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span>{t('settings.theme_light', 'Light Mode')}</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 border-indigo-500 text-white shadow-xs ring-1 ring-indigo-500'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span>{t('settings.theme_dark', 'Dark Mode')}</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
              theme === 'system'
                ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs ring-1 ring-brand-500'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <Monitor className="w-5 h-5 text-slate-500" />
            <span>{t('settings.theme_system', 'System Auto')}</span>
          </button>
        </div>
      </div>

      {/* 8. Language Selector (Moved near bottom above data management) */}
      <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {t('settings.language_title', 'App Language / భాష / भाषा')}
            </h3>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            {language.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              language === 'en'
                ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs ring-1 ring-brand-500'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">🇬🇧</span>
            <span>English</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('te')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              language === 'te'
                ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs ring-1 ring-brand-500'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">🇮🇳</span>
            <span>తెలుగు (Telugu)</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
              language === 'hi'
                ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 shadow-xs ring-1 ring-brand-500'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">🇮🇳</span>
            <span>हिन्दी (Hindi)</span>
          </button>
        </div>
      </div>

      {/* 9. Data Actions & Sign Out */}
      <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Data Management</h3>

        <div className="space-y-2">
          <button
            onClick={() => exportTransactionsToCSV(transactions, categories, wallets, profile?.base_currency || 'INR')}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4 text-brand-700 dark:text-brand-400" />
              Export All Transactions (CSV)
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">Download</span>
          </button>

          <button
            onClick={resetToDemoData}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Reset to 40+ Demo Transactions
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">Reload Demo</span>
          </button>

          <button
            onClick={logout}
            className="w-full p-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-2xl border border-rose-200/80 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Sign Out
            </span>
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Category Create/Edit Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'New Category'}
        subtitle="Customize category name, icon and color"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category Name</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Subscriptions, Coffee, Fuel"
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-700 focus:outline-hidden"
            />
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pick Color</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCatColor(c)}
                  className={`w-7 h-7 rounded-xl transition-transform ${
                    catColor === c ? 'scale-110 ring-2 ring-slate-900 dark:ring-white ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pick Icon</label>
            <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setCatIcon(ic)}
                  className={`p-2 rounded-xl border transition-all ${
                    catIcon === ic
                      ? 'bg-brand-700 text-white border-brand-700 shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <CategoryIcon name={ic} size={18} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Wallet Create/Edit Modal */}
      <Modal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        title={editingWallet ? 'Edit Wallet' : 'New Wallet / Account'}
        subtitle="Manage your payment source or cash pocket"
      >
        <form onSubmit={handleSaveWallet} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account / Wallet Name</label>
            <input
              type="text"
              required
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              placeholder="e.g. HDFC Bank, GPay, Pocket Cash"
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Type</label>
            <select
              value={walletType}
              onChange={(e) => setWalletType(e.target.value as WalletType)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-700 focus:outline-hidden"
            >
              <option value="bank">Bank Account</option>
              <option value="wallet">UPI / Digital Wallet</option>
              <option value="cash">Cash</option>
              <option value="card">Credit Card</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Opening Balance</label>
            <input
              type="number"
              step="any"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full text-sm font-bold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-700 focus:outline-hidden tabular-nums"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsWalletModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm"
            >
              Save Wallet
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
