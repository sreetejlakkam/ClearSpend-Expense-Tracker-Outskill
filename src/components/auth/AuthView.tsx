import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Bot,
  Eye,
  EyeOff,
  Compass
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, signup, loginAsDemo } = useStore();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'demo'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim()) return;

    setLoading(true);
    try {
      if (authMode === 'signup') {
        if (!name.trim()) {
          setErrorMessage('Please enter your name');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await signup(email.trim(), name.trim(), password);
      } else {
        await login(email.trim(), password, name.trim() || undefined);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/30 to-slate-100 dark:from-slate-950 dark:via-surface-dark dark:to-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-700 via-indigo-600 to-blue-500 text-white shadow-xl shadow-indigo-500/25 mb-1 animate-pulse-subtle">
            <Sparkles className="w-8 h-8 text-indigo-100" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
              ClearSpend
              <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800 shadow-xs">
                FinAI
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Autonomous AI expense copilot & wealth coach. Type one line, catch duplicates, and keep your budget on track.
            </p>
          </div>
        </div>

        {/* 4 Core Value Pillars */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <Zap className="w-4 h-4 text-brand-600 dark:text-brand-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">1-Line Add</span>
            <span className="text-[9px] text-slate-400">Zero Friction</span>
          </div>
          <div className="p-2.5 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">FinAI Bot</span>
            <span className="text-[9px] text-slate-400">Grounded AI</span>
          </div>
          <div className="p-2.5 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">Self-Healing</span>
            <span className="text-[9px] text-slate-400">Duplicate Guard</span>
          </div>
          <div className="p-2.5 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">Smart Pace</span>
            <span className="text-[9px] text-slate-400">Safe Allowance</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-surface-dark p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                authMode === 'signin'
                  ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                authMode === 'signup'
                  ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('demo'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                authMode === 'demo'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300'
              }`}
            >
              ⚡ Demo Mode
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          {authMode === 'demo' ? (
            /* Instant Demo Preview Tab */
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Interactive Demo Sandbox</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">
                  Test ClearSpend with realistic Indian transactions (Zomato, Swiggy, Zepto, Rent), wallets, planted duplicate pairs, and 5-month visual infographics.
                </p>
              </div>

              <button
                type="button"
                onClick={loginAsDemo}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <span>Launch Interactive Demo Sandbox</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>
          ) : (
            /* Email / Password Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Your Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full text-xs font-semibold pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full text-xs font-semibold pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full text-xs font-semibold pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-700 to-indigo-600 hover:from-brand-800 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-brand-700/25 flex items-center justify-center gap-1.5 transition-all active:scale-98 disabled:opacity-60"
              >
                <span>{loading ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Sign In with Email'}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
              </button>

              {/* Local Mode exploration button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={loginAsDemo}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Explore without an account (Local Mode)</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security & Privacy Banner */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            256-Bit Encryption
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Local-First Privacy
          </span>
          <span>•</span>
          <span>Zero Data Resale</span>
        </div>
      </div>
    </div>
  );
};
