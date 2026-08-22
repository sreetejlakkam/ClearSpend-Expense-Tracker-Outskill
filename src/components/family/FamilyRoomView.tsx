import React, { useState, useMemo } from 'react';
import {
  Users,
  Shield,
  Sparkles,
  UserPlus,
  LogOut,
  Download,
  Eye,
  EyeOff,
  Target,
  Layers,
  AlertCircle,
  Plus,
  Send,
  Lock,
  PieChart as PieIcon,
  Crown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Search,
  CheckCircle2,
  Calendar,
  Wallet,
  Zap,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { useTranslation } from '../../lib/i18n';
import { sendFamilyAIChatMessage } from '../../lib/familyAI';
import { Modal } from '../common/Modal';
import { CategoryIcon } from '../common/CategoryIcon';

export const FamilyRoomView: React.FC = () => {
  const { t } = useTranslation();
  const {
    profile,
    household,
    householdMembers,
    householdBudgets,
    householdGoals,
    householdMonthlySummary,
    householdLedger,
    recurringItems,
    isPartnerPreview,
    setIsPartnerPreview,
    createNewHousehold,
    inviteHouseholdPartner,
    updateSharingPreferences,
    leaveCurrentHousehold,
    addJointBudget,
    addJointGoal,
    contributeToJointGoal,
    upgradeToFamilyPremium,
    hasFamilyPremium,
    selectedMonthStr,
    changeMonth,
    selectedDate,
    categories,
    resetToDemoData,
    addToast,
  } = useStore();

  // Local View States
  const [chartLens, setChartLens] = useState<'together' | 'just_me'>('together');
  const [ledgerMemberFilter, setLedgerMemberFilter] = useState<'all' | 'mine' | 'partner'>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [budgetName, setBudgetName] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalReturnPct, setGoalReturnPct] = useState('12');

  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [walletResolution, setWalletResolution] = useState<'keep_personal' | 'transfer_owner'>('keep_personal');

  // Family AI state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `👋 Welcome to Family AI! I'm your joint financial copilot. Ask me about your combined savings capacity, vacation affordability, SIP projections, or goal timelines.`,
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Current User Member Object
  const currentMember = useMemo(() => {
    return householdMembers.find((m) => m.user_id === profile?.id) || householdMembers[0];
  }, [householdMembers, profile?.id]);

  const partnerMember = useMemo(() => {
    return householdMembers.find((m) => m.user_id !== profile?.id) || householdMembers[1];
  }, [householdMembers, profile?.id]);

  // Combined Totals from Layer A Summary
  const combinedIncome = useMemo(() => {
    return householdMonthlySummary.reduce((sum, i) => sum + (i.total_income || 0), 0);
  }, [householdMonthlySummary]);

  const combinedExpense = useMemo(() => {
    return householdMonthlySummary.reduce((sum, i) => sum + (i.total_expense || 0), 0);
  }, [householdMonthlySummary]);

  const combinedSavings = combinedIncome - combinedExpense;
  const combinedSavingsRate = combinedIncome > 0 ? Math.round((combinedSavings / combinedIncome) * 100) : 0;
  const hasIncompleteSummary = householdMonthlySummary.some((i) => i.is_estimated);

  // Contribution Split Percentages
  const userSummary = householdMonthlySummary.find((i) => i.user_id === profile?.id) || householdMonthlySummary[0];
  const partnerSummary = householdMonthlySummary.find((i) => i.user_id !== profile?.id) || householdMonthlySummary[1];

  const userIncome = userSummary?.total_income || 0;
  const partnerIncome = partnerSummary?.total_income || 0;
  const totalSummaryIncome = userIncome + partnerIncome;

  const userIncomePct = totalSummaryIncome > 0 ? Math.round((userIncome / totalSummaryIncome) * 100) : 60;
  const partnerIncomePct = 100 - userIncomePct;

  // Filtered Shared Ledger for active month
  const filteredHouseholdLedger = useMemo(() => {
    return householdLedger.filter((row) => {
      // Month match
      if (!row.txn_date.startsWith(selectedMonthStr)) return false;

      // Member filter
      if (ledgerMemberFilter === 'mine' && row.user_id !== profile?.id) return false;
      if (ledgerMemberFilter === 'partner' && row.user_id === profile?.id) return false;

      // Search
      if (ledgerSearch.trim()) {
        const q = ledgerSearch.toLowerCase();
        const merch = (row.merchant || '').toLowerCase();
        const note = (row.note || '').toLowerCase();
        return merch.includes(q) || note.includes(q);
      }

      return true;
    });
  }, [householdLedger, selectedMonthStr, ledgerMemberFilter, ledgerSearch, profile?.id]);

  // Handlers
  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseholdName.trim()) return;
    await createNewHousehold(newHouseholdName.trim(), ownerName.trim() || profile?.display_name || 'You');
    setIsCreateModalOpen(false);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const invite = await inviteHouseholdPartner(inviteEmail.trim());
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://clearspend-ai-expense-tracker.vercel.app';
    const link = `${origin}/?join_token=${invite.token}`;
    setCreatedInviteLink(link);
    setInviteEmail('');
  };

  const handleToggleSummary = async () => {
    if (!currentMember) return;
    await updateSharingPreferences(!currentMember.share_summary, currentMember.share_categories);
  };

  const handleToggleCategories = async () => {
    if (!currentMember) return;
    await updateSharingPreferences(currentMember.share_summary, !currentMember.share_categories);
  };

  const handleAddBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(budgetAmount);
    if (!budgetName.trim() || isNaN(amt) || amt <= 0 || !household || !profile) return;
    await addJointBudget({
      household_id: household.id,
      name: budgetName.trim(),
      amount: amt,
      period: 'monthly',
      start_month: new Date().toISOString().slice(0, 7) + '-01',
      created_by: profile.id,
    });
    setBudgetName('');
    setBudgetAmount('');
    setIsAddBudgetOpen(false);
  };

  const handleAddGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTarget);
    const retPct = parseFloat(goalReturnPct) || 12;
    if (!goalName.trim() || isNaN(target) || target <= 0 || !household || !profile) return;

    if (!hasFamilyPremium && householdGoals.length >= 1) {
      addToast({ title: 'Free Tier Goal Limit', message: 'Upgrade to Family Premium for unlimited joint goals and dual SIP projections.', type: 'info' });
      return;
    }

    await addJointGoal({
      household_id: household.id,
      name: goalName.trim(),
      target_amount: target,
      saved_amount: 0,
      expected_return_pct: retPct,
      created_by: profile.id,
    });
    setGoalName('');
    setGoalTarget('');
    setIsAddGoalOpen(false);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (!contributeGoalId || isNaN(amt) || amt <= 0) return;
    await contributeToJointGoal(contributeGoalId, amt);
    setContributeGoalId(null);
    setDepositAmount('');
  };

  const handleConfirmLeave = async () => {
    await leaveCurrentHousehold(walletResolution);
    setIsLeaveModalOpen(false);
  };

  const handleDownloadFamilyData = () => {
    const exportData = {
      household,
      members: householdMembers,
      monthlySummaries: householdMonthlySummary,
      sharedBudgets: householdBudgets,
      sharedGoals: householdGoals,
      sharedLedger: householdLedger,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `clearspend_${household?.name.toLowerCase().replace(/\s+/g, '_') || 'family'}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast({ title: 'Export Complete', message: 'Family financial data downloaded as JSON.', type: 'success' });
  };

  const handleAskAI = async (customPrompt?: string) => {
    const textToSend = customPrompt || aiQuestion;
    if (!textToSend.trim() || !household) return;

    setAiChatHistory((prev) => [...prev, { role: 'user', text: textToSend.trim() }]);
    setAiQuestion('');
    setIsAiLoading(true);

    try {
      const reply = await sendFamilyAIChatMessage(textToSend.trim(), {
        household,
        members: householdMembers,
        monthlySummaries: [{ month: selectedMonthStr, items: householdMonthlySummary }],
        sharedLedger: householdLedger,
        sharedBudgets: householdBudgets,
        sharedGoals: householdGoals,
        recurringItems,
      });

      setAiChatHistory((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      console.error(err);
      setAiChatHistory((prev) => [
        ...prev,
        { role: 'assistant', text: '⚠️ Could not generate an answer. Please check your connection and try again.' },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // If user does not have a household yet, show Onboarding Card with 1-Tap Demo Loader
  if (!household) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-gradient-to-br from-teal-900/90 via-slate-900 to-indigo-950 border border-teal-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center mx-auto border border-teal-500/30">
            <Users className="w-8 h-8" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Shared Household Finance
            </h2>
            <p className="text-xs sm:text-sm text-teal-200/80 max-w-md mx-auto leading-relaxed">
              Two incomes, two spending patterns, one joint financial plan. Individual private ledgers plus a shared planning room.
            </p>
          </div>

          {/* 2-Layer Privacy Guarantee Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1.5 text-left">
              <div className="flex items-center gap-2 text-teal-400 font-black text-xs">
                <Shield className="w-4 h-4" />
                <span>Layer A: Summary Sharing</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Shares monthly income, expense & savings totals only. No categories, no merchants, no dates. Powers joint planning without exposing line items.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1.5 text-left">
              <div className="flex items-center gap-2 text-indigo-400 font-black text-xs">
                <Lock className="w-4 h-4" />
                <span>Layer B: Per-Txn Privacy</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Choose what partner sees: <b>Private</b> (hidden), <b>Amount Only</b> (masked merchant), or <b>Shared</b> (full details for joint rent/groceries).
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => resetToDemoData()}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-sm font-black rounded-2xl shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Load 5-Month Demo Room</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold rounded-2xl transition-all"
            >
              Create New Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Family Room View
  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-5 pb-24">
      
      {/* 0. Month Navigation Bar for 5-Month History Browsing */}
      <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
            Joint Planning Month:
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-white px-2.5 py-0.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-xl border border-teal-200 dark:border-teal-800">
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Combined Header Banner */}
      <div className="bg-gradient-to-br from-teal-950 via-slate-900 to-indigo-950 border border-teal-500/30 rounded-3xl p-5 sm:p-7 text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">👨‍👩‍👧</span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{household.name}</h1>
              {hasFamilyPremium && (
                <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>
              )}
            </div>
            <p className="text-xs text-teal-300/80">
              {householdMembers.filter((m) => m.status === 'active').length} active partners • Joint Planning Active
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPartnerPreview(!isPartnerPreview)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isPartnerPreview
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="Preview what your partner sees"
            >
              {isPartnerPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isPartnerPreview ? 'Exit Partner Preview' : t('family.partner_preview', 'Preview Partner View')}</span>
            </button>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t('family.invite_partner', 'Invite Partner')}</span>
            </button>
          </div>
        </div>

        {/* Incomplete Summary Banner */}
        {hasIncompleteSummary && (
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Partner has summary sharing paused. Household totals reflect partial numbers and are flagged as incomplete.
            </span>
          </div>
        )}

        {/* Together / Just Me Lens Toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold text-teal-300">Financial Lens:</span>
          <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setChartLens('together')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                chartLens === 'together'
                  ? 'bg-teal-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              👨‍👩‍👧 {t('family.together', 'Together')}
            </button>
            <button
              onClick={() => setChartLens('just_me')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                chartLens === 'just_me'
                  ? 'bg-teal-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              👤 {t('family.just_me', 'Just Me')}
            </button>
          </div>
        </div>

        {/* 3 Metric Hero Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
          <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] sm:text-xs font-bold text-teal-300 block uppercase">
              {chartLens === 'together' ? t('family.combined_income', 'Combined Income') : 'My Income'}
            </span>
            <span className="text-base sm:text-2xl font-black tracking-tight text-white block mt-0.5">
              ₹{(chartLens === 'together' ? combinedIncome : userIncome).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] sm:text-xs font-bold text-rose-300 block uppercase">
              {chartLens === 'together' ? t('family.combined_outflow', 'Combined Outflow') : 'My Outflow'}
            </span>
            <span className="text-base sm:text-2xl font-black tracking-tight text-white block mt-0.5">
              ₹{(chartLens === 'together' ? combinedExpense : (userSummary?.total_expense || 0)).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-300 block uppercase">
              {chartLens === 'together' ? t('family.combined_savings', 'Combined Savings') : 'My Savings'}
            </span>
            <span className="text-base sm:text-2xl font-black tracking-tight text-emerald-400 block mt-0.5">
              ₹{(chartLens === 'together' ? combinedSavings : (userSummary?.net_savings || 0)).toLocaleString('en-IN')}
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-teal-300/80 mt-0.5 block">
              {chartLens === 'together' ? combinedSavingsRate : (userIncome > 0 ? Math.round(((userSummary?.net_savings || 0) / userIncome) * 100) : 0)}% savings rate
            </span>
          </div>
        </div>

        {/* Per-Member Income Contribution Split Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-300">
            <span>{currentMember?.display_name || 'Aarav (You)'} ({userIncomePct}%)</span>
            <span>{partnerMember?.display_name || 'Priya (Partner)'} ({partnerIncomePct}%)</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex border border-white/10">
            <div className="h-full bg-teal-500 transition-all" style={{ width: `${userIncomePct}%` }} />
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${partnerIncomePct}%` }} />
          </div>
        </div>
      </div>

      {/* 2. INFOGRAPHICS SUITE: Visual Comparison, Split Dial & Compounding Wealth Engine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Infographic A: Income & Outflow Proportional Dual Comparison */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <PieIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Income vs Outflow Proportions</span>
            </h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
              {selectedMonthStr}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* User Breakdown */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  {currentMember?.display_name || 'Aarav (You)'}
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-extrabold">
                  +₹{userIncome.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Personal Outflow: ₹{(userSummary?.total_expense || 0).toLocaleString('en-IN')}</span>
                <span className="font-bold text-emerald-600">Net: +₹{(userSummary?.net_savings || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Partner Breakdown */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {partnerMember?.display_name || 'Priya (Partner)'}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                  +₹{partnerIncome.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Personal Outflow: ₹{(partnerSummary?.total_expense || 0).toLocaleString('en-IN')}</span>
                <span className="font-bold text-emerald-600">Net: +₹{(partnerSummary?.net_savings || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Infographic B: Fair-Share Contribution Settlement Dial */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Fair Share Split & Settlement</span>
            </h3>
            <span className="text-[10px] font-extrabold text-slate-500">
              Ratio {userIncomePct} : {partnerIncomePct}
            </span>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 rounded-2xl border border-teal-200/60 dark:border-teal-800/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
              <span>Shared Fixed Living Costs</span>
              <span>₹45,000 / month</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{currentMember?.display_name?.split(' ')[0] || 'Aarav'} Share ({userIncomePct}%)</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  ₹{Math.round(45000 * (userIncomePct / 100)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{partnerMember?.display_name?.split(' ')[0] || 'Priya'} Share ({partnerIncomePct}%)</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  ₹{Math.round(45000 * (partnerIncomePct / 100)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Current shared expenses are fully settled for {selectedMonthStr}.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Infographic C: Joint Wealth Velocity & 20-Year Compounding Projection */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Joint Wealth Compounding Velocity
              </h3>
              <p className="text-[11px] text-slate-300">
                Combined surplus of ₹{combinedSavings.toLocaleString('en-IN')}/mo at 12% CAGR equity index return
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
            {combinedSavingsRate}% Combined Savings Rate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">In 10 Years</span>
            <div className="text-xl font-black text-teal-300">₹69.7 Lakhs</div>
            <span className="text-[10px] text-slate-400">Total Invested: ₹36 Lakhs</span>
          </div>

          <div className="p-3.5 bg-white/10 rounded-2xl border border-white/20 space-y-1">
            <span className="text-[10px] font-bold text-amber-300 uppercase">In 20 Years (4.2× Multiplier)</span>
            <div className="text-xl font-black text-amber-300">₹3.02 Crore</div>
            <span className="text-[10px] text-slate-300">Total Invested: ₹72 Lakhs</span>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">In 30 Years (9.8× Multiplier)</span>
            <div className="text-xl font-black text-emerald-300">₹10.6 Crore</div>
            <span className="text-[10px] text-slate-400">Total Invested: ₹1.08 Crore</span>
          </div>
        </div>
      </div>

      {/* 3. Joint Envelopes & Budgets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Shared Household Envelopes</span>
          </h3>
          <button
            onClick={() => setIsAddBudgetOpen(true)}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Joint Envelope</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {householdBudgets.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{b.name}</span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-full border border-teal-200 dark:border-teal-800">
                  Joint
                </span>
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white">
                ₹{b.amount.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/{b.period}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Joint Financial Goals with Dual Contribution Split */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Joint Wealth & Savings Milestones</span>
          </h3>
          <button
            onClick={() => setIsAddGoalOpen(true)}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Joint Goal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {householdGoals.map((g) => {
            const pct = Math.min(100, Math.round((g.saved_amount / g.target_amount) * 100));
            return (
              <div
                key={g.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">{g.name}</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{pct}% saved</span>
                </div>

                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all rounded-full" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Saved ₹{g.saved_amount.toLocaleString('en-IN')} of ₹{g.target_amount.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => setContributeGoalId(g.id)}
                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg hover:bg-emerald-100 text-[11px]"
                  >
                    + Deposit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. SHARED HOUSEHOLD LEDGER TABLE */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Shared Household Ledger • {selectedMonthStr}</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Joint expenses from both partner wallets filtered through Layer B privacy policy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setLedgerMemberFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  ledgerMemberFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                All ({filteredHouseholdLedger.length})
              </button>
              <button
                onClick={() => setLedgerMemberFilter('mine')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  ledgerMemberFilter === 'mine' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                You
              </button>
              <button
                onClick={() => setLedgerMemberFilter('partner')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  ledgerMemberFilter === 'partner' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                Partner
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={ledgerSearch}
            onChange={(e) => setLedgerSearch(e.target.value)}
            placeholder="Search shared rent, groceries, utilities..."
            className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:border-teal-500"
          />
        </div>

        {/* Items List */}
        <div className="space-y-2">
          {filteredHouseholdLedger.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No shared transactions recorded for {selectedMonthStr}. Use the Month Selector above to view April, May, June, July, or August 2026.
            </div>
          ) : (
            filteredHouseholdLedger.map((row) => {
              const isOwn = row.user_id === profile?.id;
              const cat = categories.find((c) => c.id === row.category_id);
              return (
                <div
                  key={row.id}
                  className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-xs">
                      <CategoryIcon name={cat?.icon || 'Tag'} className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white">{row.merchant}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          isOwn
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          {isOwn ? 'Aarav (You)' : 'Priya (Partner)'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{row.txn_date}</span>
                        <span>•</span>
                        <span>{cat?.name || 'Shared'}</span>
                        {row.note && (
                          <>
                            <span>•</span>
                            <span className="italic">{row.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`font-black text-sm block ${
                      row.kind === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                    }`}>
                      {row.kind === 'income' ? '+' : '-'}₹{row.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      {row.visibility}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Family AI Copilot Room */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 border border-teal-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">Family Finance AI Planner</h3>
              <p className="text-[11px] text-teal-300/80">Joint capacity, emergency buffer checks & dual SIP projections</p>
            </div>
          </div>
          {!hasFamilyPremium && (
            <button
              onClick={upgradeToFamilyPremium}
              className="px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg text-[10px] font-black uppercase flex items-center gap-1"
            >
              <Crown className="w-3 h-3" />
              Trial Active
            </button>
          )}
        </div>

        {/* Prompt Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => handleAskAI('How much can we realistically save each month?')}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-teal-200 border border-teal-400/20 transition-all text-left"
          >
            📊 How much can we save each month?
          </button>
          <button
            onClick={() => handleAskAI('Can we afford a ₹1L vacation trip?')}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-teal-200 border border-teal-400/20 transition-all text-left"
          >
            🏖️ Can we afford a ₹1L vacation?
          </button>
          <button
            onClick={() => handleAskAI('What if we both invest ₹10,000 more every month in SIP?')}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-teal-200 border border-teal-400/20 transition-all text-left"
          >
            🚀 What if we invest ₹10K more each?
          </button>
          <button
            onClick={() => handleAskAI('When can we reach our ₹20L down payment goal?')}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-teal-200 border border-teal-400/20 transition-all text-left"
          >
            🎯 When can we reach our ₹20L goal?
          </button>
        </div>

        {/* Chat History Box */}
        <div className="max-h-64 overflow-y-auto space-y-3 p-3 bg-black/40 rounded-2xl border border-white/10 text-xs">
          {aiChatHistory.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl leading-relaxed ${
                item.role === 'user'
                  ? 'bg-teal-600/40 text-white ml-6 border border-teal-400/30'
                  : 'bg-white/5 text-slate-200 mr-4 border border-white/5'
              }`}
            >
              <div className="font-bold text-[10px] text-teal-400 mb-1">
                {item.role === 'user' ? 'You' : 'Family AI'}
              </div>
              <div className="whitespace-pre-line">{item.text}</div>
            </div>
          ))}
          {isAiLoading && (
            <div className="p-3 bg-white/5 rounded-xl text-teal-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Analyzing joint numbers & calculating arithmetic…</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            placeholder="Ask Family AI anything about your combined finances…"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/30 border border-teal-500/30 text-white placeholder:text-slate-400 text-xs focus:outline-hidden focus:border-teal-400"
          />
          <button
            onClick={() => handleAskAI()}
            disabled={isAiLoading || !aiQuestion.trim()}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* 7. Members & Privacy Controls */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Members & Privacy Controls</span>
        </h3>

        {/* Members Roster */}
        <div className="space-y-2">
          {householdMembers.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">{m.display_name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {m.role === 'owner' ? 'Owner' : 'Member'} • Sharing: {m.share_summary ? 'Monthly summary totals' : 'Sharing paused'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                {m.status}
              </span>
            </div>
          ))}
        </div>

        {/* Your Personal Sharing Toggles */}
        {currentMember && (
          <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900 space-y-3">
            <span className="text-xs font-black text-teal-900 dark:text-teal-200 block">
              Your Personal Sharing Rules (Layer A)
            </span>

            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Share Monthly Summary</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Shares total income, expenses, and savings</span>
              </div>
              <button
                onClick={handleToggleSummary}
                className={`px-3 py-1 rounded-xl font-bold text-xs transition-all ${
                  currentMember.share_summary
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {currentMember.share_summary ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Share Category Totals</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Category amounts only (merchants hidden)</span>
              </div>
              <button
                onClick={handleToggleCategories}
                className={`px-3 py-1 rounded-xl font-bold text-xs transition-all ${
                  currentMember.share_categories
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {currentMember.share_categories ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}

        {/* Export & Leave Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={handleDownloadFamilyData}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Family Data (JSON)</span>
          </button>

          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ml-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave Household</span>
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setCreatedInviteLink(null);
        }}
        title="Invite Your Partner"
      >
        {createdInviteLink ? (
          <div className="space-y-4">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 space-y-2">
              <span className="font-bold block">✨ Invitation Link Generated!</span>
              <p className="text-[11px]">Send this link to your partner. They will see an explicit privacy consent screen before accepting.</p>
              <input
                type="text"
                readOnly
                value={createdInviteLink}
                className="w-full text-xs font-mono p-2 bg-white dark:bg-slate-800 rounded-lg border border-teal-300 dark:border-teal-700"
              />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdInviteLink);
                addToast({ title: 'Link Copied', message: 'Invite link copied to clipboard.', type: 'success' });
              }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
            >
              Copy Link to Clipboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Partner's Email Address
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
              >
                Create Invite Link
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Joint Budget Modal */}
      <Modal isOpen={isAddBudgetOpen} onClose={() => setIsAddBudgetOpen(false)} title="Add Shared Envelope">
        <form onSubmit={handleAddBudgetSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Envelope Name</label>
            <input
              type="text"
              required
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              placeholder="e.g. Shared Rent, Groceries, Dining Out"
              className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Amount (₹)</label>
            <input
              type="number"
              required
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="45000"
              className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddBudgetOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
            >
              Save Envelope
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Joint Goal Modal */}
      <Modal isOpen={isAddGoalOpen} onClose={() => setIsAddGoalOpen(false)} title="Create Joint Financial Goal">
        <form onSubmit={handleAddGoalSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Goal Title</label>
            <input
              type="text"
              required
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="e.g. 2BHK Down Payment, Annual Vacation"
              className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Target Amount (₹)</label>
            <input
              type="number"
              required
              value={goalTarget}
              onChange={(e) => setGoalTarget(e.target.value)}
              placeholder="2500000"
              className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assumed Annual Return (% CAGR)</label>
            <input
              type="number"
              value={goalReturnPct}
              onChange={(e) => setGoalReturnPct(e.target.value)}
              className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddGoalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              Create Goal
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Goal Contribution Deposit Modal */}
      <Modal isOpen={Boolean(contributeGoalId)} onClose={() => setContributeGoalId(null)} title="Deposit Funds to Joint Goal">
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contribution Amount (₹)</label>
            <input
              type="number"
              required
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="10000"
              className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setContributeGoalId(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              Confirm Deposit
            </button>
          </div>
        </form>
      </Modal>

      {/* Leave Household Modal */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Exit Household Planning">
        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200">
            <span className="font-bold block mb-1">⚠️ Please read these exit terms carefully:</span>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>Your transactions remain strictly <b>yours</b>. None of your data is deleted or transferred.</li>
              <li>Your partner's access to your data ends <b>immediately and retroactively</b>.</li>
              <li>All your transactions will be unlinked from the household and reverted to 100% private.</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Shared Wallet Resolution
            </label>
            <select
              value={walletResolution}
              onChange={(e) => setWalletResolution(e.target.value as any)}
              className="w-full text-xs font-semibold p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="keep_personal">Convert shared wallet to my private wallet</option>
              <option value="transfer_owner">Transfer shared wallet ownership to partner</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300"
            >
              Stay in Room
            </button>
            <button
              type="submit"
              onClick={handleConfirmLeave}
              className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
            >
              Confirm Exit
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Household Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Your Family Room"
      >
        <form onSubmit={handleCreateHousehold} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Family Room Name
            </label>
            <input
              type="text"
              required
              value={newHouseholdName}
              onChange={(e) => setNewHouseholdName(e.target.value)}
              placeholder="e.g. Sharma Family, Our Shared Nest"
              className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-teal-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Your Display Name
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder={profile?.display_name || 'Your name'}
              className="w-full text-sm font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-teal-500 focus:outline-hidden"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
            >
              Create Room
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
