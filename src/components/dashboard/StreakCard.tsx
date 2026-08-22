import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, CheckCircle2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../lib/store';
import { useTranslation } from '../../lib/i18n';
import { calculateStreaks, loadStreakState, recordNoSpendToday, StreakState } from '../../lib/streaks';

export const StreakCard: React.FC = () => {
  const { transactions, addToast } = useStore();
  const { t } = useTranslation();
  const [streakState, setStreakState] = useState<StreakState>(() => loadStreakState());
  const [showMilestoneModal, setShowMilestoneModal] = useState<number | null>(null);

  useEffect(() => {
    const updated = calculateStreaks(transactions, streakState);
    setStreakState(updated);
    if (updated.milestoneReached) {
      setShowMilestoneModal(updated.milestoneReached);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [transactions]);

  const handleNoSpendClick = () => {
    if (streakState.loggedToday) return;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    const updated = recordNoSpendToday(streakState);
    setStreakState(updated);

    addToast({
      title: 'Zero Spend Day Logged! 🎉',
      message: 'Great financial discipline! Your daily streak is preserved.',
      type: 'success',
    });
  };

  const getMilestoneBadgeName = (days: number) => {
    if (days >= 100) return 'Century Club 🏆';
    if (days >= 60) return 'Financial Wizard 🧙‍♂️';
    if (days >= 30) return 'Budget Master 👑';
    if (days >= 14) return 'Habit Builder ⚡';
    return 'Discipline Starter 🌱';
  };

  return (
    <>
      <div className="rounded-3xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 shadow-card p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Streak Counter & Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 animate-pulse-subtle">
              <Flame className="w-7 h-7 fill-white stroke-orange-600" />
            </div>
            {streakState.currentStreak >= 7 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                ★
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {streakState.currentStreak} {t('streaks.days_active', 'Days Active')}
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                {getMilestoneBadgeName(streakState.currentStreak)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {streakState.loggedToday ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('streaks.logged_today', 'Logged Today ✨')}
                </span>
              ) : (
                'Log an expense or tap No Spend to keep the streak going!'
              )}
            </p>
          </div>
        </div>

        {/* Action Button: No Spend Today */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleNoSpendClick}
            disabled={streakState.loggedToday}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm ${
              streakState.loggedToday
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white shadow-emerald-600/25'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{streakState.loggedToday ? t('streaks.logged_today', 'Logged Today ✨') : t('streaks.no_spend_btn', 'No spend today 🎉')}</span>
          </button>
        </div>
      </div>

      {/* Milestone Celebratory Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-orange-500/30">
              <Award className="w-8 h-8 stroke-[2.5px]" />
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                Milestone Unlocked
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {showMilestoneModal}-Day Streak!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                You've earned the <strong>{getMilestoneBadgeName(showMilestoneModal)}</strong> badge. Consistent money awareness is the foundation of wealth compounding.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowMilestoneModal(null)}
              className="w-full py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all"
            >
              Keep Compounding 🚀
            </button>
          </div>
        </div>
      )}
    </>
  );
};
