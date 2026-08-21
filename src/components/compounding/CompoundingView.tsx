import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  Coins
} from 'lucide-react';



import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  calculateMonthlySIPCompounding,
  formatIndianCurrency,
  COMPOUNDING_PRESETS
} from '../../lib/compounding';
import { useTranslation } from '../../lib/i18n';
import { useStore } from '../../lib/store';

export const CompoundingView: React.FC = () => {
  const { t } = useTranslation();
  const { profile, setActiveTab } = useStore();
  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  const [monthlyAmount, setMonthlyAmount] = useState<number>(2000);
  const [years, setYears] = useState<number>(20);
  const [cagrRate, setCagrRate] = useState<number>(12);

  const result = useMemo(() => {
    return calculateMonthlySIPCompounding(monthlyAmount, years, cagrRate);
  }, [monthlyAmount, years, cagrRate]);

  const chartData = useMemo(() => {
    return result.yearlyMilestones.map((m) => ({
      name: `Yr ${m.year}`,
      year: m.year,
      invested: m.invested,
      wealth: m.wealth,
      gain: m.wealthGain,
    }));
  }, [result]);

  return (
    <div className="space-y-5 pb-28 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 dark:from-black dark:via-indigo-950 dark:to-slate-950 rounded-3xl text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                {t('compound.title', 'Power of Compounding Visualizer')}
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Wealth Multiplier
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl leading-relaxed">
              {t(
                'compound.subtitle',
                'Discover the massive opportunity cost of small, recurring discretionary expenses when invested over time.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Preset Discretionary Habits Selector */}
      <div className="space-y-2">
        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 px-1 block">
          {t('compound.presets_title', 'Tap a common discretionary habit to simulate:')}
        </span>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          {COMPOUNDING_PRESETS.map((preset) => {
            const isSelected = monthlyAmount === preset.monthlyAmount;
            return (
              <button
                key={preset.id}
                onClick={() => setMonthlyAmount(preset.monthlyAmount)}
                className={`snap-start shrink-0 min-w-[200px] p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-950 dark:text-brand-100 shadow-sm ring-1 ring-brand-500'
                    : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-base">{preset.icon}</span>
                  <span className="text-xs font-black text-brand-700 dark:text-brand-400 tabular-nums">
                    {currSym}{preset.monthlyAmount.toLocaleString()}/mo
                  </span>
                </div>
                <div className="text-xs font-bold truncate">{preset.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Controls & Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Controls Column */}
        <div className="md:col-span-5 bg-white dark:bg-surface-dark p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
          {/* Monthly Amount Input & Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('compound.monthly_amount', 'Monthly Avoided Spend')}
              </label>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                <span className="text-xs font-bold text-slate-500">{currSym}</span>
                <input
                  type="number"
                  step="500"
                  min="500"
                  max="100000"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Math.max(100, Number(e.target.value) || 0))}
                  className="w-20 text-xs font-extrabold text-slate-900 dark:text-white bg-transparent text-right focus:outline-hidden tabular-nums"
                />
              </div>
            </div>
            <input
              type="range"
              min="500"
              max="25000"
              step="500"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>{currSym}500/mo</span>
              <span>{currSym}10,000/mo</span>
              <span>{currSym}25,000/mo</span>
            </div>
          </div>

          {/* Time Horizon Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('compound.investment_period', 'Investment Horizon')}
              </label>
              <span className="text-xs font-extrabold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-xl">
                {years} Years ({years * 12} Months)
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[5, 10, 15, 20, 30].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setYears(yr)}
                  className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                    years === yr
                      ? 'bg-brand-700 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {yr}y
                </button>
              ))}
            </div>
          </div>

          {/* Expected Return CAGR Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('compound.expected_cagr', 'Expected Return (CAGR)')}
              </label>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">
                {cagrRate}% p.a.
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { rate: 10, label: '10% (Debt/Hybrid)' },
                { rate: 12, label: '12% (Nifty Index)' },
                { rate: 15, label: '15% (Midcap Equity)' },
              ].map((item) => (
                <button
                  key={item.rate}
                  onClick={() => setCagrRate(item.rate)}
                  className={`py-1.5 px-1 text-[11px] font-bold rounded-xl transition-all ${
                    cagrRate === item.rate
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Big Impact Results Grid */}
        <div className="md:col-span-7 grid grid-cols-2 gap-3">
          {/* Estimated Wealth */}
          <div className="col-span-2 p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                {t('compound.estimated_wealth', 'Potential Total Wealth')}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-black text-white">
                {result.multiplier}x Multiplier
              </span>
            </div>

            <div className="my-1">
              <div className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums">
                {formatIndianCurrency(result.estimatedWealth)}
              </div>
              <div className="text-xs text-emerald-100 mt-1">
                Exact: {currSym}{result.estimatedWealth.toLocaleString()}
              </div>
            </div>

            <div className="pt-3 border-t border-white/20 mt-2 flex items-center justify-between text-xs text-emerald-50">
              <span>Redirecting {currSym}{monthlyAmount.toLocaleString()}/mo</span>
              <span className="font-extrabold text-white">Over {years} Years</span>
            </div>
          </div>

          {/* Invested Capital */}
          <div className="p-4 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 shadow-card">
            <div className="flex items-center gap-1.5 mb-1.5 text-slate-500 dark:text-slate-400">
              <Coins className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-bold uppercase">
                {t('compound.total_invested', 'Total Saved')}
              </span>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatIndianCurrency(result.totalInvested)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {currSym}{result.totalInvested.toLocaleString()}
            </div>
          </div>

          {/* Wealth Gained */}
          <div className="p-4 rounded-3xl bg-white dark:bg-surface-dark border border-slate-200/80 dark:border-slate-800 shadow-card">
            <div className="flex items-center gap-1.5 mb-1.5 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase">
                {t('compound.wealth_gain', 'Compound Gains')}
              </span>
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{formatIndianCurrency(result.wealthGained)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {result.multiplier > 1 ? `${Math.round((result.wealthGained / result.totalInvested) * 100)}% return on capital` : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Compounding Chart & Growth Progression */}
      <div className="p-5 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Wealth Growth Trajectory (Principal vs Returns)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Notice how the green area (pure compound gains) explodes exponentially in later years!
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Invested
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Wealth
            </span>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={10}
                tickLine={false}
                tickFormatter={(val) => (val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : `₹${val}`)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
                formatter={(val: number, name: string) => [
                  `₹${val.toLocaleString()}`,
                  name === 'wealth' ? 'Compounded Wealth' : 'Your Invested Capital',
                ]}
              />
              <Area
                type="monotone"
                dataKey="invested"
                stroke="#6366F1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#investedGrad)"
              />
              <Area
                type="monotone"
                dataKey="wealth"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#wealthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action Banner to Ask FinAI */}
      <div className="p-4 bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 border border-brand-200/80 dark:border-indigo-800/50 rounded-3xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
              Want personalized advice on where to trim expenses?
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Ask FinAI to audit your ledger and find the best categories to unlock your monthly SIP budget!
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('finai')}
          className="px-3.5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-extrabold text-xs shadow-xs transition-all shrink-0 flex items-center gap-1.5"
        >
          <span>Ask FinAI</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
