import React from 'react';
import { Crown, Check } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Modal } from '../common/Modal';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { upgradeToFamilyPremium, addToast } = useStore();

  const handleUpgrade = async () => {
    await upgradeToFamilyPremium();
    addToast({
      title: 'Family Premium Activated! 👑',
      message: '14-day free trial active. Unlimited joint goals, dual SIP projections, and unrestricted Family AI unlocked.',
      type: 'success',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center space-y-4 pt-1 pb-2">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
          <Crown className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            ClearSpend Family Premium
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Unlock complete joint wealth planning for both partners with zero privacy compromises.
          </p>
        </div>

        {/* Feature List */}
        <div className="space-y-2 text-left p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3px]" />
            <span><b>Unlimited joint goals</b> with dual-contributor milestones</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3px]" />
            <span><b>Dual SIP compounding projections</b> for wealth acceleration</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3px]" />
            <span><b>Unrestricted Family AI Copilot</b> with zero sentinel leaks</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3px]" />
            <span><b>Realtime Postgres syncing</b> across both devices</span>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            ₹199<span className="text-xs font-normal text-slate-500">/month for the whole household</span>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
            14-Day Free Trial • Cancel anytime with 1 tap
          </p>
        </div>

        {/* Action Button */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleUpgrade}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
          >
            Start 14-Day Free Family Trial
          </button>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
};
