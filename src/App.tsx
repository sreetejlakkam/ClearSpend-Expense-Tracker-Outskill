import React, { useEffect } from 'react';
import { useStore } from './lib/store';
import { AuthView } from './components/auth/AuthView';
import { OnboardingView } from './components/onboarding/OnboardingView';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer } from './components/common/Toast';
import { QuickAddBar } from './components/quickadd/QuickAddBar';
import { ManualAddModal } from './components/quickadd/ManualAddModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { InsightsView } from './components/insights/InsightsView';
import { FinAIView } from './components/finai/FinAIView';
import { CompoundingView } from './components/compounding/CompoundingView';
import { ReviewInboxView } from './components/review/ReviewInboxView';
import { SettingsView } from './components/settings/SettingsView';
import { FamilyRoomView } from './components/family/FamilyRoomView';
import { parseBankSMS } from './lib/smsParser';

export const AppContent: React.FC = () => {
  const { isAuthenticated, isOnboarded, activeTab, viewScope, openManualAdd, addToast } = useStore();

  // Web Share Target SMS Handler (PWA)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const sharedText = urlParams.get('text') || urlParams.get('title');

    if (sharedText) {
      const parsedSms = parseBankSMS(sharedText);
      if (parsedSms.isTransaction && parsedSms.amount) {
        openManualAdd({
          amount: String(parsedSms.amount),
          merchant: parsedSms.merchant,
          date: parsedSms.txn_date,
          note: `Shared via SMS: ${parsedSms.bank_name || 'Bank'}`,
        });
        addToast({
          title: 'SMS Parsed!',
          message: `Detected ${parsedSms.bank_name || 'Bank'} transaction for ₹${parsedSms.amount}.`,
          type: 'success',
        });
      } else {
        openManualAdd({
          note: sharedText,
        });
      }
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [openManualAdd, addToast]);

  // Auth Gate
  if (!isAuthenticated) {
    return (
      <>
        <AuthView />
        <ToastContainer />
      </>
    );
  }

  // Onboarding Gate
  if (!isOnboarded) {
    return (
      <>
        <OnboardingView />
        <ToastContainer />
      </>
    );
  }

  // Main App Interface
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark flex flex-col font-sans selection:bg-brand-100 selection:text-brand-900 transition-colors duration-150 w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <Header />

      {/* Main Dynamic View Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 overflow-x-hidden">

        {activeTab === 'dashboard' && (viewScope === 'household' ? <FamilyRoomView /> : <DashboardView />)}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'budgets' && <BudgetsView />}
        {activeTab === 'finai' && <FinAIView />}
        {activeTab === 'compounding' && <CompoundingView />}
        {activeTab === 'insights' && <InsightsView />}
        {activeTab === 'review' && <ReviewInboxView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Sticky Signature Quick-Add Bar */}
      <QuickAddBar />



      {/* Sticky Bottom Navigation Bar */}
      <BottomNav />

      {/* Modals & Toasts */}
      <ManualAddModal />
      <ToastContainer />
    </div>
  );
};
