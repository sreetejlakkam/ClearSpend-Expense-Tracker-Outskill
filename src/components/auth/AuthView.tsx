import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { Sparkles, ArrowRight, ShieldCheck, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, signup, loginAsDemo } = useStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('sreetej@clearspend.app');
  const [name, setName] = useState('Sreetej Lakkam');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      if (isSignUp) {
        await signup(email, name || 'User');
      } else {
        await login(email, name);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-brand-700 text-white shadow-lg shadow-brand-700/20 mb-1">
            <Sparkles className="w-7 h-7 text-emerald-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            ClearSpend
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed">
            AI-powered expense tracker & money coach. Log spending in one line, trust the numbers, and get warned before you overspend.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
            <Zap className="w-4 h-4 text-brand-700 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-zinc-800 block">1-Line Log</span>
            <span className="text-[10px] text-zinc-400">Zero friction</span>
          </div>
          <div className="p-2.5 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-zinc-800 block">Self-Healing</span>
            <span className="text-[10px] text-zinc-400">Duplicate guard</span>
          </div>
          <div className="p-2.5 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
            <TrendingUp className="w-4 h-4 text-amber-600 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-zinc-800 block">AI Forecast</span>
            <span className="text-[10px] text-zinc-400">Pace warning</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-900">
              {isSignUp ? 'Create your account' : 'Sign in to ClearSpend'}
            </h3>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-bold text-brand-700 hover:text-brand-800"
            >
              {isSignUp ? 'Have an account? Sign in' : 'New? Sign up'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sreetej Lakkam"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs font-semibold px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs font-semibold px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-brand-700 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-700/20 flex items-center justify-center gap-1.5 transition-all active:scale-98"
            >
              <span>{isSignUp ? 'Start Onboarding' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
            </button>
          </form>

          {/* Quick Demo One-Click Access */}
          <div className="pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={loginAsDemo}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Explore Instant Demo (40+ Seeded Transactions)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
