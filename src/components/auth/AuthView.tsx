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
  EyeOff
} from 'lucide-react';


export const AuthView: React.FC = () => {
  const { login, signup, loginAsDemo } = useStore();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'demo'>('signin');
  const [email, setEmail] = useState('sreetej@clearspend.app');
  const [name, setName] = useState('Sreetej Lakkam');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      if (authMode === 'signup') {
        await signup(email, name || 'User');
      } else {
        await login(email, name);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Simulate OAuth or call Supabase OAuth
      await login('sreetej.google@clearspend.app', 'Sreetej Lakkam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/30 to-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-700 via-indigo-600 to-blue-500 text-white shadow-xl shadow-indigo-500/25 mb-1 animate-pulse-subtle">
            <Sparkles className="w-8 h-8 text-indigo-100" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              ClearSpend
              <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/80 shadow-xs">
                FinAI 2.5
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              Autonomous AI expense copilot & wealth coach. Type one line, catch duplicates, and let Gemini keep your budget on track.
            </p>
          </div>
        </div>

        {/* 4 Core Value Pillars */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <Zap className="w-4 h-4 text-brand-600 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-800 block">1-Line Add</span>
            <span className="text-[9px] text-slate-400">Zero Taps</span>
          </div>
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <Bot className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-800 block">FinAI Bot</span>
            <span className="text-[9px] text-slate-400">Gemini 2.5</span>
          </div>
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-800 block">Self-Healing</span>
            <span className="text-[9px] text-slate-400">Duplicate Guard</span>
          </div>
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <TrendingUp className="w-4 h-4 text-amber-600 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-800 block">Smart Pace</span>
            <span className="text-[9px] text-slate-400">Forecast</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-card space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                authMode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                authMode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('demo')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                authMode === 'demo'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              ⚡ Demo
            </button>
          </div>

          {authMode === 'demo' ? (
            /* Instant Demo Preview Tab */
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Instant Demo Sandbox</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
                  Pre-seeded with <strong>40+ realistic Indian transactions</strong> (Zomato, Swiggy, Zepto, Rent), 4 wallets, planted duplicate pairs, and active budget pace warnings.
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sreetej Lakkam"
                      className="w-full text-xs font-semibold pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-brand-600 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full text-xs font-semibold pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-brand-600 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs font-semibold pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-brand-600 focus:bg-white focus:outline-hidden"
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
                className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-700 to-indigo-600 hover:from-brand-800 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-brand-700/25 flex items-center justify-center gap-1.5 transition-all active:scale-98"
              >
                <span>{authMode === 'signup' ? 'Create Account' : 'Sign In with Email'}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
              </button>

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                  <span className="bg-white px-2">Or continue with</span>
                </div>
              </div>

              {/* Google OAuth Simulation Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-colors shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.37 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          )}

          {/* Quick Demo Footer Action if on Sign In */}
          {authMode !== 'demo' && (
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={loginAsDemo}
                className="text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors inline-flex items-center gap-1"
              >
                <span>Want to test first?</span>
                <span className="underline">Launch 1-Click Demo</span>
              </button>
            </div>
          )}
        </div>

        {/* Security & Privacy Banner */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            256-Bit SSL
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            Supabase RLS Privacy
          </span>
          <span>•</span>
          <span>Zero Data Resale</span>
        </div>
      </div>
    </div>
  );
};
