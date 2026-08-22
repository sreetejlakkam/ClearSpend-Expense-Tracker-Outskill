import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useStore } from '../../lib/store';
import { Goal } from '../../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
}

const PRESET_GOAL_ICONS = [
  'ShieldCheck', 'Plane', 'Laptop', 'Car', 'Home', 'PiggyBank', 'Gift', 'TrendingUp', 'HeartPulse'
];

const PRESET_GOAL_COLORS = [
  '#10B981', '#EC4899', '#6366F1', '#F59E0B', '#3B82F6', '#8B5CF6', '#14B8A6'
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  editingGoal,
}) => {
  const { addGoal, updateGoal, profile } = useStore();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Savings');
  const [icon, setIcon] = useState(PRESET_GOAL_ICONS[0]);
  const [color, setColor] = useState(PRESET_GOAL_COLORS[0]);
  const [isPaused, setIsPaused] = useState(false);

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setTargetAmount(String(editingGoal.target_amount));
      setCurrentAmount(String(editingGoal.current_amount || 0));
      setMonthlyContribution(String(editingGoal.monthly_contribution || 0));
      setTargetDate(editingGoal.target_date || '');
      setCategory(editingGoal.category || 'Savings');
      setIcon(editingGoal.icon || PRESET_GOAL_ICONS[0]);
      setColor(editingGoal.color || PRESET_GOAL_COLORS[0]);
      setIsPaused(editingGoal.is_paused);
    } else {
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('0');
      setMonthlyContribution('');
      // Default target date: 1 year from today
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() + 1);
      setTargetDate(defaultDate.toISOString().split('T')[0]);
      setCategory('Savings');
      setIcon(PRESET_GOAL_ICONS[0]);
      setColor(PRESET_GOAL_COLORS[0]);
      setIsPaused(false);
    }
  }, [editingGoal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = Math.abs(parseFloat(targetAmount));
    const parsedCurrent = Math.abs(parseFloat(currentAmount)) || 0;
    const parsedMonthly = Math.abs(parseFloat(monthlyContribution)) || 0;

    if (!title.trim() || isNaN(parsedTarget) || parsedTarget <= 0) return;

    if (editingGoal) {
      await updateGoal(editingGoal.id, {
        title: title.trim(),
        target_amount: parsedTarget,
        current_amount: parsedCurrent,
        monthly_contribution: parsedMonthly,
        target_date: targetDate,
        category,
        icon,
        color,
        is_paused: isPaused,
      });
    } else {
      await addGoal({
        title: title.trim(),
        target_amount: parsedTarget,
        current_amount: parsedCurrent,
        monthly_contribution: parsedMonthly,
        target_date: targetDate,
        category,
        icon,
        color,
        is_paused: isPaused,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
      subtitle="Auto-reserves monthly contributions to guarantee financial milestones"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Goal Name
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Emergency Fund, Japan Trip, MacBook"
            className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Amount ({currSym})
            </label>
            <input
              type="number"
              step="any"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="100000"
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Currently Saved ({currSym})
            </label>
            <input
              type="number"
              step="any"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="0"
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Auto-Reserve ({currSym})
            </label>
            <input
              type="number"
              step="any"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Target Completion Date
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Badge Accent Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {PRESET_GOAL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-xl transition-transform ${
                  color === c ? 'scale-110 ring-2 ring-slate-900 dark:ring-white ring-offset-2' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={!isPaused}
              onChange={(e) => setIsPaused(!e.target.checked)}
              className="rounded accent-brand-600"
            />
            <span>Active Goal (Auto-Reserving)</span>
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
              {editingGoal ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
