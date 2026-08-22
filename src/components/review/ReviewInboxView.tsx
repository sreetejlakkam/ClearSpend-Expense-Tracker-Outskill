import { useStore } from '../../lib/store';
import {
  ShieldCheck,
  ShieldAlert,
  GitMerge,
  Check,
  Trash2,
  AlertTriangle,
  Edit2
} from 'lucide-react';

export const ReviewInboxView: React.FC = () => {
  const {
    duplicatePairs,
    anomalies,
    categories,
    wallets,
    profile,
    mergeDuplicatePair,
    keepBothDuplicates,
    deleteTransaction,
    dismissAnomaly,
    setEditingTransaction,
    pendingReviewCount,
  } = useStore();

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  return (
    <div className="space-y-5 pb-28">
      {/* Inbox Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 leading-tight">Review Inbox</h2>
            {pendingReviewCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                {pendingReviewCount} Action{pendingReviewCount > 1 ? 's' : ''} Needed
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                Clean Ledger
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Self-healing ledger guard: catches duplicates and unusual spending spikes
          </p>
        </div>
      </div>

      {/* When there are items to review */}
      {pendingReviewCount > 0 ? (
        <div className="space-y-6">
          {/* 1. Suspected Duplicate Pairs */}
          {duplicatePairs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Suspected Duplicate Pairs ({duplicatePairs.length})</span>
              </div>

              {duplicatePairs.map((pair) => {
                const origCat = categories.find((c) => c.id === pair.original.category_id);
                const dupCat = categories.find((c) => c.id === pair.duplicate.category_id);
                const origWallet = wallets.find((w) => w.id === pair.original.wallet_id);
                const dupWallet = wallets.find((w) => w.id === pair.duplicate.wallet_id);

                return (
                  <div
                    key={pair.id}
                    className="p-4 bg-white rounded-3xl border-2 border-amber-300 shadow-card space-y-3"
                  >
                    {/* Reason header */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          {pair.reason}
                        </span>
                        {pair.tier === 'rapid_tap' && (
                          <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            ⚡ Rapid Tap (&lt;120s)
                          </span>
                        )}
                        {pair.tier === 'exact' && (
                          <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            🔒 Exact Match
                          </span>
                        )}
                        {pair.tier === 'probable' && (
                          <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            ⚠️ Probable
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-300">
                        {Math.round(pair.similarity * 100)}% match
                      </span>
                    </div>

                    {/* Side-by-Side Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Original (Older) */}
                      <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">
                            Original (Older)
                          </span>
                          <span className="text-xs font-extrabold text-zinc-900 tabular-nums">
                            {currSym}{pair.original.amount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-zinc-900">{pair.original.merchant}</p>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 flex-wrap">
                          <span>{origCat?.name || 'Category'}</span>
                          <span>•</span>
                          <span>{origWallet?.name || 'Wallet'}</span>
                          <span>•</span>
                          <span>{pair.original.txn_date}</span>
                        </div>
                      </div>

                      {/* Duplicate (Newer) */}
                      <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-amber-800">
                            Suspected Duplicate
                          </span>
                          <span className="text-xs font-extrabold text-zinc-900 tabular-nums">
                            {currSym}{pair.duplicate.amount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-zinc-900">{pair.duplicate.merchant}</p>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 flex-wrap">
                          <span>{dupCat?.name || 'Category'}</span>
                          <span>•</span>
                          <span>{dupWallet?.name || 'Wallet'}</span>
                          <span>•</span>
                          <span>{pair.duplicate.txn_date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-1 flex items-center justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => deleteTransaction(pair.duplicate.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Duplicate
                      </button>

                      <button
                        onClick={() => keepBothDuplicates(pair.duplicate.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Keep Both
                      </button>

                      <button
                        onClick={() => mergeDuplicatePair(pair.original.id, pair.duplicate.id)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 shadow-xs flex items-center gap-1.5 transition-all"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        Merge (Keep Older)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Spending Anomalies (> 3x Category Median) */}
          {anomalies.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Unusual Spending Spikes ({anomalies.length})</span>
              </div>

              {anomalies.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-3xl border border-rose-200/90 shadow-card space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-rose-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Unusually large — is this right?
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 px-2 py-0.5 rounded-full bg-rose-100">
                      {item.multiplier}x Category Median
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-900">{item.transaction.merchant}</p>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        <span>{item.categoryName}</span> • <span>{item.transaction.txn_date}</span> •{' '}
                        <span>Category median is {currSym}{item.medianAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-rose-600 tabular-nums">
                      {currSym}{item.transaction.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingTransaction(item.transaction)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Amount
                    </button>

                    <button
                      onClick={() => dismissAnomaly(item.transaction.id)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Confirm & Keep
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty State: Ledger is 100% Clean */
        <div className="p-10 bg-white rounded-3xl border border-zinc-200/80 text-center shadow-card space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-8 h-8 stroke-[2.2px]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">Nothing to review. Your ledger is clean.</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 leading-relaxed">
              No duplicate entries, credit card income errors, or abnormal transaction spikes detected in your history.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
