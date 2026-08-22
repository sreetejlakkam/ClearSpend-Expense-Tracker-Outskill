import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Clock
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { RecurringItem } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import { RecurringModal } from './RecurringModal';

export const RecurringView: React.FC = () => {
  const { recurringItems, categories, wallets, profile, deleteRecurringItem } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringItem | null>(null);

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');
  const todayDate = new Date();
  const currentDay = todayDate.getDate();

  // Total Monthly Fixed Commitments
  const totalMonthlyCommitment = recurringItems
    .filter((r) => r.is_active)
    .reduce((sum, r) => sum + r.amount, 0);

  // T-3 day warnings (due within next 3 days)
  const upcomingDebits = recurringItems.filter((r) => {
    if (!r.is_active) return false;
    const diff = r.due_day - currentDay;
    return diff >= 0 && diff <= 3;
  });

  const getDueBadge = (dueDay: number) => {
    const diff = dueDay - currentDay;
    if (diff === 0) {
      return (
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
          Due Today
        </span>
      );
    }
    if (diff === 1) {
      return (
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Due Tomorrow
        </span>
      );
    }
    if (diff > 1 && diff <= 3) {
      return (
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          Due in {diff} days
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="text-[10px] font-semibold text-slate-400">
          Paid on {dueDay}th
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
        Due on {dueDay}th
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
            Recurring Subscriptions & Fixed Commitments
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {recurringItems.length} active subscription{recurringItems.length === 1 ? '' : 's'} • {currSym}{totalMonthlyCommitment.toLocaleString()} / month committed
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-extrabold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* T-3 Warning Banner */}
      {upcomingDebits.length > 0 && (
        <div className="p-4 bg-amber-50/95 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-3xl shadow-xs flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
              Upcoming Auto-Debits Alert ({upcomingDebits.length})
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
              {upcomingDebits.map((d) => `${d.merchant} (${currSym}${d.amount}) on day ${d.due_day}`).join(', ')}. Ensure your accounts have sufficient balance.
            </p>
          </div>
        </div>
      )}

      {/* Monthly Commitment Hero Card */}
      <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-700/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase text-slate-400 block">
              Total Fixed Commitments
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {currSym}{totalMonthlyCommitment.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-500">/ month</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px]">Active Subscriptions</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {recurringItems.filter((r) => r.is_active).length}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div>
            <span className="text-slate-400 block text-[10px]">Auto-Debits</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              Auto-Reserved
            </span>
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {recurringItems.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Recurring Subscriptions</h4>
            <p className="text-xs text-slate-400">Add Netflix, Rent, Spotify, EMIs, or Gym to automate tracking.</p>
          </div>
        ) : (
          recurringItems.map((item) => {
            const cat = categories.find((c) => c.id === item.category_id);
            const wallet = wallets.find((w) => w.id === item.wallet_id);

            return (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <CategoryIcon name={cat?.icon || 'Zap'} color={cat?.color || '#6366F1'} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                        {item.merchant}
                      </h4>
                      {getDueBadge(item.due_day)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {cat?.name || 'Subscription'} • {wallet ? wallet.name : 'Primary Account'} • Day {item.due_day} of month
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums block">
                      {currSym}{item.amount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      {item.frequency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove subscription "${item.merchant}"?`)) {
                          deleteRecurringItem(item.id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
      />
    </div>
  );
};
