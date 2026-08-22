import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';
import { Modal } from '../common/Modal';
import { TransactionKind, TxnVisibility } from '../../types';
import { Trash2, Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const ManualAddModal: React.FC = () => {
  const {
    isManualModalOpen,
    setIsManualModalOpen,
    editingTransaction,
    setEditingTransaction,
    manualModalPrefill,
    categories,
    wallets,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    profile,
    household,
  } = useStore();

  const isEditing = Boolean(editingTransaction);

  const [amount, setAmount] = useState<string>('');
  const [kind, setKind] = useState<TransactionKind>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [txnDate, setTxnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [merchant, setMerchant] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [visibility, setVisibility] = useState<TxnVisibility>('private');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form on edit or prefill
  useEffect(() => {
    if (editingTransaction) {
      setAmount(editingTransaction.amount.toString());
      setKind(editingTransaction.kind);
      setCategoryId(editingTransaction.category_id);
      setWalletId(editingTransaction.wallet_id);
      setTxnDate(editingTransaction.txn_date);
      setMerchant(editingTransaction.merchant);
      setNote(editingTransaction.note || '');
      setVisibility(editingTransaction.visibility || 'private');
    } else if (manualModalPrefill) {
      setAmount(manualModalPrefill.amount || '');
      setKind('expense');
      const defaultExpCat = categories.find((c) => c.kind === 'expense');
      setCategoryId(defaultExpCat ? defaultExpCat.id : categories[0]?.id || '');
      setWalletId(wallets[0]?.id || '');
      setTxnDate(manualModalPrefill.date || new Date().toISOString().split('T')[0]);
      setMerchant(manualModalPrefill.merchant || '');
      setNote(manualModalPrefill.note || '');
      setVisibility('private');
    } else {
      setAmount('');
      setKind('expense');
      const defaultExpCat = categories.find((c) => c.kind === 'expense');
      setCategoryId(defaultExpCat ? defaultExpCat.id : categories[0]?.id || '');
      setWalletId(wallets[0]?.id || '');
      setTxnDate(new Date().toISOString().split('T')[0]);
      setMerchant('');
      setNote('');
      setVisibility('private');
    }
  }, [editingTransaction, manualModalPrefill, isManualModalOpen, categories, wallets]);

  const handleClose = () => {
    setIsManualModalOpen(false);
    setEditingTransaction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.abs(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      if (isEditing && editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          amount: parsedAmount,
          kind,
          category_id: categoryId,
          wallet_id: walletId,
          txn_date: txnDate,
          merchant: merchant.trim() || (kind === 'income' ? 'Income' : 'Expense'),
          note: note.trim(),
          household_id: household ? household.id : null,
          visibility,
        });
      } else {
        await addTransaction({
          amount: parsedAmount,
          kind,
          category_id: categoryId,
          wallet_id: walletId,
          txn_date: txnDate,
          merchant: merchant.trim() || (kind === 'income' ? 'Income' : 'Expense'),
          note: note.trim(),
          source: 'manual',
          status: 'active',
          was_corrected: false,
          household_id: household ? household.id : null,
          visibility,
        });
      }
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTransaction) return;
    if (confirm('Are you sure you want to delete this transaction from the ledger?')) {
      await deleteTransaction(editingTransaction.id);
      handleClose();
    }
  };

  const filteredCategories = categories.filter((c) => c.kind === kind);
  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  return (
    <Modal
      isOpen={isManualModalOpen || isEditing}
      onClose={handleClose}
      title={isEditing ? 'Edit Transaction' : 'Record Transaction'}
      subtitle={isEditing ? 'Update transaction details' : 'Enter amount and allocate to category'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {manualModalPrefill?.hint && !isEditing && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs font-bold text-amber-800 dark:text-amber-300">
            {manualModalPrefill.hint}
          </div>
        )}

        {/* Kind Toggle (Expense vs Income) */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-2xl border border-zinc-200">
          <button
            type="button"
            onClick={() => {
              setKind('expense');
              const firstExp = categories.find((c) => c.kind === 'expense');
              if (firstExp) setCategoryId(firstExp.id);
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              kind === 'expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setKind('income');
              const firstInc = categories.find((c) => c.kind === 'income');
              if (firstInc) setCategoryId(firstInc.id);
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              kind === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Income
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1">
            Amount ({currSym}) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">
              {currSym}
            </span>
            <input
              type="number"
              step="any"
              required
              autoFocus={!isEditing}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-2xl font-black text-zinc-900 pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-2xl focus:border-brand-700 focus:bg-white focus:outline-hidden tabular-nums"
            />
          </div>
        </div>

        {/* Merchant / Description */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1">
            Merchant / Description <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Zomato, Uber, DMart, Rent"
            className="w-full text-sm font-medium text-zinc-900 px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Category & Wallet Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs font-semibold text-zinc-900 px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden"
            >
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Wallet / Account</label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full text-xs font-semibold text-zinc-900 px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Transaction Date</label>
            <input
              type="date"
              value={txnDate}
              onChange={(e) => setTxnDate(e.target.value)}
              className="w-full text-xs font-semibold text-zinc-900 px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Optional Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add extra context…"
              className="w-full text-xs font-medium text-zinc-900 px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Phase 8: Family Sharing & Visibility Control */}
        {household && (
          <div className="p-3 bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/50 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <span>👨‍👩‍👧</span>
                <span>Family Sharing Visibility</span>
              </label>
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                {visibility === 'private' ? 'Private' : visibility === 'amount_only' ? 'Amount Only' : 'Shared'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-white/80 dark:bg-slate-800/80 p-1 rounded-xl border border-teal-100 dark:border-teal-900">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  visibility === 'private'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                🔒 Private
              </button>
              <button
                type="button"
                onClick={() => setVisibility('amount_only')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  visibility === 'amount_only'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                👁️ Amount
              </button>
              <button
                type="button"
                onClick={() => setVisibility('shared')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  visibility === 'shared'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                🤝 Full Shared
              </button>
            </div>

            <p className="text-[11px] text-teal-800 dark:text-teal-300/90 leading-tight">
              {visibility === 'private' && '🔒 Completely hidden from your partner. Included only in your private totals.'}
              {visibility === 'amount_only' && `👁️ Partner sees ₹${amount || '0'} in ${categories.find((c) => c.id === categoryId)?.name || 'Category'}. Merchant name and notes remain hidden.`}
              {visibility === 'shared' && '🤝 Visible to both partners in the shared family room with full merchant and note details.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-md shadow-brand-700/20 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5px]" />
              {isEditing ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
