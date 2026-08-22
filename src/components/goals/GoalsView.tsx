import React, { useState } from 'react';
import {
  PiggyBank,
  Plus,
  Target,
  Sparkles,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Goal } from '../../types';
import { GoalModal } from './GoalModal';
import confetti from 'canvas-confetti';

export const GoalsView: React.FC = () => {
  const { goals, profile, deleteGoal, updateGoal, addToast } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount || 0), 0);
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount || 0), 0);
  const totalMonthlyAutoReserve = goals
    .filter((g) => !g.is_paused)
    .reduce((sum, g) => sum + Number(g.monthly_contribution || 0), 0);

  const overallProgressPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const handleContributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const addAmt = Math.abs(parseFloat(contributeAmount));
    if (isNaN(addAmt) || addAmt <= 0) return;

    const newAmount = contributeGoal.current_amount + addAmt;
    await updateGoal(contributeGoal.id, {
      current_amount: newAmount,
    });

    confetti({
      particleCount: 60,
      spread: 65,
      origin: { y: 0.6 },
    });

    addToast({
      title: 'Contribution Added! 🎉',
      message: `Added ${currSym}${addAmt.toLocaleString()} towards "${contributeGoal.title}".`,
      type: 'success',
    });

    setContributeGoal(null);
    setContributeAmount('');
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
            Savings Goals & Milestones
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {goals.length} goal{goals.length === 1 ? '' : 's'} active • {currSym}{totalMonthlyAutoReserve.toLocaleString()}/mo auto-reserved from daily spend
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-extrabold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Hero Progress Banner */}
      <div className="p-5 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl shadow-card border border-emerald-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/25">
              <PiggyBank className="w-6 h-6 text-emerald-950" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                Total Wealth Accumulation
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black tabular-nums">
                  {currSym}{totalSaved.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-200/80 font-semibold">
                  / {currSym}{totalTarget.toLocaleString()} target
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xl font-black tabular-nums text-emerald-300">
              {overallProgressPct}%
            </span>
            <span className="text-xs text-emerald-200/80 font-semibold">Achieved</span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full transition-all duration-300"
            style={{ width: `${overallProgressPct}%` }}
          />
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) || 0;
          const remaining = Math.max(0, goal.target_amount - goal.current_amount);

          return (
            <div
              key={goal.id}
              className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs font-black"
                      style={{ backgroundColor: goal.color || '#10B981' }}
                    >
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {goal.title}
                      </h4>
                      <span className="text-[10.5px] text-slate-400">
                        Target: {goal.target_date || 'Ongoing'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setIsModalOpen(true);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete savings goal "${goal.title}"?`)) {
                          deleteGoal(goal.id);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Amounts */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs font-bold">
                    <span className="text-slate-900 dark:text-white tabular-nums">
                      {currSym}{goal.current_amount.toLocaleString()}
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      {pct}% of {currSym}{goal.target_amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: goal.color || '#10B981',
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold pt-0.5">
                    <span>{currSym}{remaining.toLocaleString()} left</span>
                    {goal.monthly_contribution > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        +{currSym}{goal.monthly_contribution.toLocaleString()}/mo reserved
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button: Quick Deposit */}
              <button
                type="button"
                onClick={() => {
                  setContributeGoal(goal);
                  setContributeAmount(String(goal.monthly_contribution || 5000));
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Deposit / Contribute Funds</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Quick Deposit Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Contribute to "{contributeGoal.title}"
            </h3>
            <p className="text-xs text-slate-500">
              Record a transfer or savings allocation towards this milestone.
            </p>

            <form onSubmit={handleContributeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contribution Amount ({currSym})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full text-sm font-black px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
                >
                  Deposit {currSym}{contributeAmount}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingGoal={editingGoal}
      />
    </div>
  );
};
