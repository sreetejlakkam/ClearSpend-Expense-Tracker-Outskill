import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { Sparkles, ArrowRight, Check, Wallet as WalletIcon, Globe, PiggyBank } from 'lucide-react';

export const OnboardingView: React.FC = () => {
  const { completeOnboarding, categories } = useStore();

  const [step, setStep] = useState<number>(1);
  const [currency, setCurrency] = useState('INR');
  const [walletName, setWalletName] = useState('HDFC Bank');
  const [budgetCategory, setBudgetCategory] = useState<string>(categories[0]?.id || '');
  const [budgetAmount, setBudgetAmount] = useState<string>('8000');
  const [isFinishing, setIsFinishing] = useState(false);

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      await completeOnboarding(
        currency,
        walletName,
        budgetCategory || undefined,
        parseFloat(budgetAmount) || 0
      );
    } finally {
      setIsFinishing(false);
    }
  };

  const currSymbol = currency === 'INR' ? '₹' : currency;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-700 text-white shadow-md shadow-brand-700/20 mb-1">
            <Sparkles className="w-6 h-6 text-emerald-300" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Welcome to ClearSpend</h2>
          <p className="text-xs text-zinc-500">Quick 3-step setup to tailor your spending coach</p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? 'w-8 bg-brand-700'
                  : step > s
                  ? 'w-2 bg-emerald-600'
                  : 'w-2 bg-zinc-200'
              }`}
            />
          ))}
        </div>

        {/* Step Card */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-card space-y-4">
          {/* STEP 1: Currency */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-brand-800 font-bold text-xs">
                <Globe className="w-4 h-4 text-brand-700" />
                <span>Step 1 of 3: Primary Currency</span>
              </div>
              <h3 className="text-base font-extrabold text-zinc-900">
                What currency do you spend in?
              </h3>
              <p className="text-xs text-zinc-500">
                ClearSpend formats all one-line amounts and category budgets with this currency.
              </p>

              <div className="space-y-2">
                {[
                  { code: 'INR', label: 'Indian Rupee (₹)', default: true },
                  { code: 'USD', label: 'US Dollar ($)' },
                  { code: 'EUR', label: 'Euro (€)' },
                  { code: 'GBP', label: 'British Pound (£)' },
                  { code: 'AED', label: 'UAE Dirham (AED)' },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                      currency === c.code
                        ? 'border-brand-700 bg-brand-50/70 text-brand-950 ring-2 ring-brand-700/20'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
                    }`}
                  >
                    <span>{c.label}</span>
                    {currency === c.code && <Check className="w-4 h-4 text-brand-700 stroke-[3px]" />}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full mt-2 py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
              </button>
            </div>
          )}

          {/* STEP 2: First Wallet */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-brand-800 font-bold text-xs">
                <WalletIcon className="w-4 h-4 text-brand-700" />
                <span>Step 2 of 3: Primary Account</span>
              </div>
              <h3 className="text-base font-extrabold text-zinc-900">
                Name your main payment wallet
              </h3>
              <p className="text-xs text-zinc-500">
                Where do most of your UPI, cash, or card expenses leave from?
              </p>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="e.g. HDFC Salary A/c, GPay, Pocket Cash"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Initial Budget (Skippable) */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-brand-800 font-bold text-xs">
                <PiggyBank className="w-4 h-4 text-brand-700" />
                <span>Step 3 of 3: Spending Guard (Optional)</span>
              </div>
              <h3 className="text-base font-extrabold text-zinc-900">
                Set a monthly budget target
              </h3>
              <p className="text-xs text-zinc-500">
                ClearSpend will warn you before you blow this category budget.
              </p>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Category</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden"
                >
                  {categories
                    .filter((c) => c.kind === 'expense')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Monthly Limit ({currSymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="e.g. 8000"
                  className="w-full text-lg font-bold px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden tabular-nums"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 rounded-xl"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  disabled={isFinishing}
                  onClick={handleFinish}
                  className="flex-1 py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3px]" />
                  <span>Start Tracking</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
