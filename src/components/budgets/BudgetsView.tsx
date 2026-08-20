import React, { useState, useMemo } from 'react';
import { useStore } from '../../lib/store';
import { CategoryIcon } from '../common/CategoryIcon';
import { Modal } from '../common/Modal';
import { PiggyBank, Plus, Edit2, Trash2, Sparkles } from 'lucide-react';
import { Budget } from '../../types';

export const BudgetsView: React.FC = () => {
  const {
    budgets,
    categories,
    transactions,
    selectedMonthStr,
    selectedDate,
    profile,
    addBudget,
    updateBudget,
    deleteBudget,
    getCategory3MonthAverage,
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [alertThreshold, setAlertThreshold] = useState<number>(80);

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  // Days in selected month
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const daysElapsed = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 1);

  // Filter expense transactions for this month
  const monthExpenses = useMemo(() => {
    return transactions.filter(
      (t) => t.status === 'active' && t.kind === 'expense' && t.txn_date.startsWith(selectedMonthStr)
    );
  }, [transactions, selectedMonthStr]);

  // Handle open create/edit modal
  const handleOpenCreate = () => {
    setEditingBudget(null);
    const availableCat = categories.find((c) => c.kind === 'expense');
    const firstCatId = availableCat ? availableCat.id : '';
    setSelectedCatId(firstCatId);
    if (firstCatId) {
      const avg = getCategory3MonthAverage(firstCatId);
      setAmount(avg > 0 ? avg.toString() : '5000');
    } else {
      setAmount('5000');
    }
    setAlertThreshold(80);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setSelectedCatId(b.category_id || '');
    setAmount(b.amount.toString());
    setAlertThreshold(b.alert_threshold || 80);
    setIsModalOpen(true);
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCatId(catId);
    if (!editingBudget) {
      const avg = getCategory3MonthAverage(catId);
      if (avg > 0) setAmount(avg.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (editingBudget) {
      await updateBudget(editingBudget.id, {
        category_id: selectedCatId || null,
        amount: parsedAmount,
        alert_threshold: alertThreshold,
      });
    } else {
      await addBudget({
        category_id: selectedCatId || null,
        period: 'monthly',
        amount: parsedAmount,
        start_month: `${selectedMonthStr}-01`,
        alert_threshold: alertThreshold,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this budget?')) {
      await deleteBudget(id);
    }
  };

  const suggestedAverage = selectedCatId ? getCategory3MonthAverage(selectedCatId) : 0;

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 leading-tight">Monthly Budgets</h2>
          <p className="text-xs text-zinc-500">
            Track category limits and proactive daily spend targets
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-sm shadow-brand-700/20 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Budget</span>
        </button>
      </div>

      {/* Budgets List */}
      {budgets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.category_id);
            const spent = monthExpenses
              .filter((t) => t.category_id === b.category_id)
              .reduce((sum, t) => sum + t.amount, 0);

            const pct = (spent / b.amount) * 100;
            const remaining = Math.max(b.amount - spent, 0);
            const dailyCap = Math.round(remaining / daysRemaining);
            const projected = daysElapsed > 0 ? (spent / daysElapsed) * daysInMonth : spent;
            const isOverBudget = spent > b.amount;
            const isWarning = pct >= b.alert_threshold && !isOverBudget;

            return (
              <div
                key={b.id}
                className={`p-4.5 bg-white rounded-3xl border shadow-card space-y-3.5 transition-all ${
                  isOverBudget
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : isWarning
                    ? 'border-amber-300'
                    : 'border-zinc-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat?.color || '#0F766E'}18` }}
                    >
                      <CategoryIcon
                        name={cat?.icon || 'PiggyBank'}
                        color={cat?.color || '#0F766E'}
                        size={20}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{cat?.name || 'Overall'}</h4>
                      <span className="text-[11px] text-zinc-400 font-medium">Monthly allocation</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Numbers */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-lg font-black text-zinc-900 tabular-nums">
                      {currSym}{spent.toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-400 font-normal"> / {currSym}{b.amount.toLocaleString()}</span>
                  </div>
                  <span
                    className={`text-xs font-black tabular-nums ${
                      isOverBudget
                        ? 'text-rose-600'
                        : isWarning
                        ? 'text-amber-600'
                        : 'text-brand-700'
                    }`}
                  >
                    {Math.round(pct)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverBudget
                        ? 'bg-rose-600'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-brand-600'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                {/* Target Guidance */}
                <div className="pt-1 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">
                    Projected: <span className="font-bold text-zinc-800">{currSym}{Math.round(projected).toLocaleString()}</span>
                  </span>
                  <span
                    className={`font-bold ${
                      isOverBudget
                        ? 'text-rose-600'
                        : isWarning
                        ? 'text-amber-700'
                        : 'text-brand-700'
                    }`}
                  >
                    {isOverBudget
                      ? `Over by ${currSym}${Math.round(spent - b.amount).toLocaleString()}`
                      : `${currSym}${dailyCap}/day remaining`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-zinc-200/80 text-center shadow-card space-y-3">
          <PiggyBank className="w-10 h-10 text-zinc-300 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-800">No monthly budgets configured</h4>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Set budget limits for your frequent categories to get warned before you overspend.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Budget
          </button>
        </div>
      )}

      {/* Create / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Budget' : 'Set Category Budget'}
        subtitle="Control monthly limits and pace warnings"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Select Category</label>
            <select
              value={selectedCatId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden"
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
              Monthly Limit ({currSym})
            </label>
            <input
              type="number"
              required
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 8000"
              className="w-full text-xl font-bold px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:bg-white focus:outline-hidden tabular-nums"
            />
            {/* Suggested 3-Month Average Hint */}
            {suggestedAverage > 0 && (
              <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-600" />
                <span>
                  Suggested based on last 3 months average:{' '}
                  <button
                    type="button"
                    onClick={() => setAmount(suggestedAverage.toString())}
                    className="font-bold text-brand-700 underline hover:text-brand-800"
                  >
                    {currSym}{suggestedAverage.toLocaleString()}/mo
                  </button>
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Alert Threshold ({alertThreshold}%)
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
              className="w-full accent-brand-700"
            />
            <span className="text-[11px] text-zinc-400">
              Turn bar amber when {alertThreshold}% of budget is reached.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl shadow-sm"
            >
              {editingBudget ? 'Save Changes' : 'Create Budget'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
