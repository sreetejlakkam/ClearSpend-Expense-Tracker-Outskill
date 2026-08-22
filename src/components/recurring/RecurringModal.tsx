import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useStore } from '../../lib/store';
import { RecurringItem } from '../../types';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: RecurringItem | null;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  editingItem,
}) => {
  const { categories, wallets, addRecurringItem, updateRecurringItem, profile } = useStore();

  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
  const [dueDay, setDueDay] = useState('1');
  const [isActive, setIsActive] = useState(true);

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  useEffect(() => {
    if (editingItem) {
      setMerchant(editingItem.merchant);
      setAmount(String(editingItem.amount));
      setCategoryId(editingItem.category_id);
      setWalletId(editingItem.wallet_id || wallets[0]?.id || '');
      setFrequency(editingItem.frequency);
      setDueDay(String(editingItem.due_day));
      setIsActive(editingItem.is_active);
    } else {
      setMerchant('');
      setAmount('');
      const expCat = categories.find((c) => c.kind === 'expense');
      setCategoryId(expCat ? expCat.id : categories[0]?.id || '');
      setWalletId(wallets[0]?.id || '');
      setFrequency('monthly');
      setDueDay('1');
      setIsActive(true);
    }
  }, [editingItem, isOpen, categories, wallets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.abs(parseFloat(amount));
    if (!merchant.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (editingItem) {
      await updateRecurringItem(editingItem.id, {
        merchant: merchant.trim(),
        amount: parsedAmount,
        category_id: categoryId || categories[0]?.id || '',
        wallet_id: walletId || undefined,
        frequency,
        due_day: parseInt(dueDay, 10) || 1,
        is_active: isActive,
      });
    } else {
      await addRecurringItem({
        merchant: merchant.trim(),
        amount: parsedAmount,
        category_id: categoryId || categories[0]?.id || '',
        wallet_id: walletId || undefined,
        frequency,
        due_day: parseInt(dueDay, 10) || 1,
        is_active: isActive,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Recurring Subscription' : 'New Recurring Subscription'}
      subtitle="Track auto-debits, rent, utilities, and subscriptions"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Subscription / Merchant Name
          </label>
          <input
            type="text"
            required
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Netflix 4K, Apartment Rent, Gym"
            className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Amount ({currSym})
            </label>
            <input
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Day of Month (1–31)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              required
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Debit Account / Card
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded accent-brand-600"
            />
            <span>Active Auto-Debit</span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-extrabold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm transition-all"
            >
              {editingItem ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
