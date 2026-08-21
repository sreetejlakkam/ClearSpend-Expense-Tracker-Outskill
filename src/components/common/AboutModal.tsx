import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Bot,
  TrendingUp,
  Zap,
  CheckCircle2,
  Github,
  ExternalLink,
  X,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Banner */}
        <div className="relative bg-gradient-to-br from-brand-700 via-indigo-900 to-slate-950 p-5 sm:p-6 text-white overflow-hidden shrink-0">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-500/20 rounded-full blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-xl transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950/40 rounded-[14px] flex items-center justify-center backdrop-blur-xs">
                <Sparkles className="w-6 h-6 text-emerald-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">ClearSpend</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  v1.2.0 • AI Active
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5 font-medium">
                Autonomous AI Expense Tracker & Money Coach
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto scrollbar-thin text-slate-700 dark:text-slate-200">
          {/* Mission Quote */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs leading-relaxed">
            <p className="font-semibold italic text-slate-800 dark:text-slate-100">
              "Log spending in one line, trust the numbers, and get warned before your month goes wrong — not after."
            </p>
          </div>

          {/* 4 Pillars */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Core Architecture & Superpowers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">One-Line AI Logging</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  Parses natural Indian shorthand like <em>"380 zomato"</em> or <em>"2k rent yesterday"</em> in milliseconds.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Self-Healing Ledger</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  Flags duplicate charges and &gt;3x category anomaly spikes with a dedicated Review Inbox.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">FinAI Gemini Copilot</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  Context-aware assistant answering real queries about spending velocity, dining leaks & debt reduction.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Compounding Multiplier</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                  Translates small avoidable spends (₹2,000/mo) into ₹20+ Lakhs long-term wealth visualizer.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Tech Highlights */}
          <div className="space-y-2.5 pt-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Privacy & Engineering Guarantee
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Zero Bank Scraping:</strong> No fragile SMS parsers or bank password access required. Your data stays in your control.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Encrypted & Local First:</strong> Full offline capabilities with persistent storage and optional Supabase cloud sync.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Multi-Lingual:</strong> Native support for English, తెలుగు (Telugu), and हिन्दी (Hindi).</span>
              </li>
            </ul>
          </div>

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['React 18', 'TypeScript', 'Tailwind CSS', 'Gemini 2.5 Flash', 'Supabase', 'Recharts', 'Lucide'].map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <a
            href="https://github.com/sreetejlakkam/ClearSpend-AI-Expense-Tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub Repository</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
