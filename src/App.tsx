import React from 'react';
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
import { ReviewInboxView } from './components/review/ReviewInboxView';
import { SettingsView } from './components/settings/SettingsView';

export const AppContent: React.FC = () => {
  const { isAuthenticated, isOnboarded, activeTab } = useStore();

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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Top Header */}
      <Header />

      {/* Main Dynamic View Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-4">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'budgets' && <BudgetsView />}
        {activeTab === 'finai' && <FinAIView />}
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
