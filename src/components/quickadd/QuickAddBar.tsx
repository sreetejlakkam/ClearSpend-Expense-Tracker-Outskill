import React, { useState, useRef } from 'react';
import { Sparkles, ArrowRight, Check, SlidersHorizontal, Loader2, X } from 'lucide-react';
import { useStore } from '../../lib/store';
import { ParsedTransactionResult } from '../../types';
import confetti from 'canvas-confetti';

export const QuickAddBar: React.FC = () => {
  const {
    categories,
    wallets,
    addTransaction,
    parseNaturalLanguage,
    learnCategoryRule,
    transactions,
    profile,
    setIsManualModalOpen,
    addToast,
  } = useStore();

  const [inputVal, setInputVal] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedCard, setParsedCard] = useState<ParsedTransactionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialSuggestedCatId, setInitialSuggestedCatId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isParsing) return;

    setIsParsing(true);
    try {
      const result = await parseNaturalLanguage(inputVal.trim());
      setParsedCard(result);
      setInitialSuggestedCatId(result.category_id);
    } catch (err) {
      console.error('Error parsing transaction:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveParsed = async () => {
    if (!parsedCard || isSaving) return;

    setIsSaving(true);
    try {
      const isCorrected = initialSuggestedCatId !== null && parsedCard.category_id !== initialSuggestedCatId;
      const targetCat = categories.find((c) => c.id === parsedCard.category_id);

      await addTransaction({
        amount: parsedCard.amount,
        kind: parsedCard.kind,
        category_id: parsedCard.category_id || categories[0]?.id || '',
        wallet_id: parsedCard.wallet_id || wallets[0]?.id || '',
        txn_date: parsedCard.txn_date,
        merchant: parsedCard.merchant || 'Expense',
        note: parsedCard.note || inputVal,
        source: 'nl',
        ai_confidence: parsedCard.category_confidence,
        ai_suggested_category_id: initialSuggestedCatId || parsedCard.category_id,
        was_corrected: isCorrected,
        status: 'active',
      });

      // Subtle celebration confetti for fast logging!
      try {
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.9 },
          colors: ['#0F766E', '#10B981', '#F59E0B'],
        });
      } catch {}

      // If user corrected category, trigger learning rule and retroactive update offer
      if (isCorrected && parsedCard.merchant) {
        const cleanMerchant = parsedCard.merchant.toLowerCase().trim();
        // Check how many past transactions match this merchant and have a different category
        const pastMatchingCount = transactions.filter(
          (t) =>
            t.status === 'active' &&
            t.category_id !== parsedCard.category_id &&
            (t.merchant.toLowerCase().includes(cleanMerchant) || (t.note && t.note.toLowerCase().includes(cleanMerchant)))
        ).length;

        await learnCategoryRule(parsedCard.merchant, parsedCard.category_id, false);

        if (pastMatchingCount > 0) {
          addToast({
            title: `Learned — filed under ${targetCat?.name || 'Category'}`,
            message: `Also apply this rule to ${pastMatchingCount} past transaction(s) from "${parsedCard.merchant}"?`,
            type: 'info',
            actionLabel: `Apply to ${pastMatchingCount} past`,
            onAction: async () => {
              const res = await learnCategoryRule(parsedCard.merchant, parsedCard.category_id, true);
              addToast({
                title: 'Updated Past Transactions',
                message: `Updated ${res.pastUpdatedCount} past transactions to ${targetCat?.name}.`,
                type: 'success',
              });
            },
            duration: 8000,
          });
        } else {
          addToast({
            title: 'Rule Learned',
            message: `I'll file "${parsedCard.merchant}" under ${targetCat?.name || 'Category'} from now on.`,
            type: 'success',
          });
        }
      }

      // Reset state
      setInputVal('');
      setParsedCard(null);
      setInitialSuggestedCatId(null);
    } catch (err: any) {
      addToast({ title: 'Save Failed', message: err.message || 'Could not save transaction', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const currSymbol = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  // Confidence badge visual styles
  const getConfidenceBadge = (confidence: number = 0.5) => {
    if (confidence >= 0.8) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          High Confidence
        </span>
      );
    } else if (confidence >= 0.5) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          Check This
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          Guess (Verify)
        </span>
      );
    }
  };

  return (
    <div className="fixed bottom-14 left-0 right-0 z-30 px-3 py-2 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        {/* Optimistic Parsing Skeleton */}
        {isParsing && (
          <div className="mb-2 p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-modal border border-brand-200/80 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-brand-700 font-semibold text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-brand-700" />
                <span>AI parsing sentence & categorizing…</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">gemini-2.5-flash</span>
            </div>
            <div className="mt-2 flex gap-2">
              <div className="h-6 w-16 bg-zinc-200/80 rounded-lg animate-pulse" />
              <div className="h-6 w-28 bg-zinc-200/80 rounded-lg animate-pulse" />
              <div className="h-6 w-20 bg-zinc-200/80 rounded-lg animate-pulse" />
            </div>
          </div>
        )}

        {/* Confirmation Card with Inline Editable Fields */}
        {parsedCard && !isParsing && (
          <div className="mb-2 p-4 bg-white/98 backdrop-blur-xl rounded-3xl shadow-modal border-2 border-brand-600/60 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  Ready to Record
                </span>
                {getConfidenceBadge(parsedCard.category_confidence)}
              </div>
              <button
                onClick={() => setParsedCard(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main editable amount & type */}
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-zinc-600">{currSymbol}</span>
                <input
                  type="number"
                  step="any"
                  value={parsedCard.amount}
                  onChange={(e) =>
                    setParsedCard({ ...parsedCard, amount: Math.abs(parseFloat(e.target.value) || 0) })
                  }
                  className="text-2xl font-extrabold text-zinc-900 w-32 border-b-2 border-dashed border-zinc-300 focus:border-brand-600 focus:outline-hidden py-0.5 tabular-nums bg-transparent"
                />
              </div>

              {/* Expense vs Income Toggle */}
              <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setParsedCard({ ...parsedCard, kind: 'expense' })}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    parsedCard.kind === 'expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setParsedCard({ ...parsedCard, kind: 'income' })}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    parsedCard.kind === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            {/* Merchant / Description inline input */}
            <div className="mt-2.5">
              <input
                type="text"
                value={parsedCard.merchant}
                onChange={(e) => setParsedCard({ ...parsedCard, merchant: e.target.value })}
                placeholder="Merchant / Item name"
                className="w-full text-xs font-semibold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1.5 focus:border-brand-600 focus:outline-hidden"
              />
            </div>

            {/* Selectors row (Category, Wallet, Date) */}
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              {/* Category selector */}
              <div className="col-span-1">
                <label className="text-[10px] font-semibold text-zinc-500 block mb-0.5">Category</label>
                <select
                  value={parsedCard.category_id}
                  onChange={(e) => setParsedCard({ ...parsedCard, category_id: e.target.value })}
                  className={`w-full text-xs font-semibold bg-zinc-50 border rounded-xl px-2 py-1.5 focus:outline-hidden truncate ${
                    initialSuggestedCatId !== parsedCard.category_id
                      ? 'border-brand-500 bg-brand-50 text-brand-900'
                      : 'border-zinc-200 text-zinc-800'
                  }`}
                >
                  {categories
                    .filter((c) => c.kind === parsedCard.kind)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Wallet selector */}
              <div className="col-span-1">
                <label className="text-[10px] font-semibold text-zinc-500 block mb-0.5">Wallet</label>
                <select
                  value={parsedCard.wallet_id || wallets[0]?.id}
                  onChange={(e) => setParsedCard({ ...parsedCard, wallet_id: e.target.value })}
                  className="w-full text-xs font-semibold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl px-2 py-1.5 focus:outline-hidden truncate"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date selector */}
              <div className="col-span-1">
                <label className="text-[10px] font-semibold text-zinc-500 block mb-0.5">Date</label>
                <input
                  type="date"
                  value={parsedCard.txn_date}
                  onChange={(e) => setParsedCard({ ...parsedCard, txn_date: e.target.value })}
                  className="w-full text-xs font-semibold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-xl px-1.5 py-1.5 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-3.5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsManualModalOpen(true);
                  setParsedCard(null);
                }}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 transition-colors flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Add Details
              </button>

              <button
                type="button"
                onClick={handleSaveParsed}
                disabled={isSaving}
                className="flex-1 bg-brand-700 hover:bg-brand-800 active:scale-98 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-brand-700/20 flex items-center justify-center gap-1.5 transition-all"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3px]" />
                    <span>Save Transaction</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* The Signature Quick-Add Input Bar */}
        <form
          onSubmit={handleParse}
          className="relative flex items-center bg-white/95 backdrop-blur-xl border-2 border-brand-600/70 focus-within:border-brand-700 rounded-2xl shadow-xl shadow-brand-950/10 p-1.5 transition-all"
        >
          <div className="pl-3 pr-2 text-brand-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-pulse text-brand-600" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type e.g. '380 zomato lunch' or '2k rent yesterday'…"
            disabled={isParsing}
            className="flex-1 text-xs sm:text-sm font-medium text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-hidden py-1.5 pr-2 min-w-0"
          />

          <div className="flex items-center gap-1">
            {inputVal.trim().length > 0 && (
              <button
                type="submit"
                disabled={isParsing}
                className="w-8 h-8 rounded-xl bg-brand-700 hover:bg-brand-800 text-white flex items-center justify-center shadow-sm transition-all active:scale-95 shrink-0"
                title="Parse with AI"
              >
                {isParsing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              title="Manual Form"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
