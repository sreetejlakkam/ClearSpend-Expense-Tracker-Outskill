import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Flame,
  Lock,
  PieChart,
  Sparkles,
  Sliders,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { useTranslation } from '../../lib/i18n';

export const ClearScoreView: React.FC = () => {
  const {
    profile,
    wallets,
    categories,
    transactions,
    budgets,
    selectedMonthStr,
    addToast,
  } = useStore();
  const { t } = useTranslation();

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  // Filter current month transactions
  const monthTxns = useMemo(() => {
    return transactions.filter(
      (t) => t.status === 'active' && t.txn_date.startsWith(selectedMonthStr)
    );
  }, [transactions, selectedMonthStr]);

  const totalSpent = useMemo(() => {
    return monthTxns
      .filter((t) => t.kind === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTxns]);

  const totalEarned = useMemo(() => {
    return monthTxns
      .filter((t) => t.kind === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTxns]);

  const totalLiquidCash = useMemo(() => {
    const opening = wallets.reduce((sum, w) => sum + (w.opening_balance || 0), 0);
    const allIn = transactions.filter((t) => t.status === 'active' && t.kind === 'income').reduce((s, t) => s + t.amount, 0);
    const allOut = transactions.filter((t) => t.status === 'active' && t.kind === 'expense').reduce((s, t) => s + t.amount, 0);
    return Math.max(0, opening + allIn - allOut);
  }, [wallets, transactions]);

  // Fixed commitments (Rent, Utilities, Subscriptions, Bills)
  const fixedNeeds = useMemo(() => {
    return monthTxns
      .filter((t) => {
        if (t.kind !== 'expense') return false;
        const cat = categories.find((c) => c.id === t.category_id);
        const name = (cat?.name || '').toLowerCase();
        const note = (t.note || '').toLowerCase();
        return (
          name.includes('rent') ||
          name.includes('bill') ||
          name.includes('utilit') ||
          name.includes('emi') ||
          name.includes('subscri') ||
          note.includes('rent') ||
          note.includes('bill')
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTxns, categories]);

  // Budget envelope health
  const overbudgetCount = useMemo(() => {
    return budgets.filter((b) => {
      const spentInCat = monthTxns
        .filter((t) => t.kind === 'expense' && t.category_id === b.category_id)
        .reduce((sum, t) => sum + t.amount, 0);
      return spentInCat > b.amount;
    }).length;
  }, [budgets, monthTxns]);

  // What-If Simulation State
  const [incomeDeltaPct, setIncomeDeltaPct] = useState(0); // -30% to +30%
  const [expenseCutAmount, setExpenseCutAmount] = useState(0); // 0 to ₹10,000
  const [extraRunwayBuffer, setExtraRunwayBuffer] = useState(0); // 0 to ₹50,000

  // Calculation Engine
  const metrics = useMemo(() => {
    const simIncome = Math.max(0, totalEarned * (1 + incomeDeltaPct / 100));
    const simExpense = Math.max(0, totalSpent - expenseCutAmount);
    const simLiquid = Math.max(0, totalLiquidCash + extraRunwayBuffer);

    // 1. Emergency Runway (Target: 3-6 months of fixed burn)
    const monthlyBurnBase = Math.max(simExpense, 10000);
    const runwayMonths = monthlyBurnBase > 0 ? simLiquid / monthlyBurnBase : 3;
    let runwayScore = Math.min(20, Math.round((runwayMonths / 6) * 20));

    // 2. Savings Rate Velocity (Target: 20-30%+)
    const netSavings = simIncome - simExpense;
    const savingsRate = simIncome > 0 ? (netSavings / simIncome) * 100 : 0;
    let savingsScore = 0;
    if (savingsRate >= 30) savingsScore = 20;
    else if (savingsRate >= 20) savingsScore = 17;
    else if (savingsRate >= 10) savingsScore = 12;
    else if (savingsRate > 0) savingsScore = 8;
    else savingsScore = 2;

    // 3. Daily Burn Discipline
    const now = new Date();
    const daysInMonth = 30;
    const dayOfMonth = Math.min(now.getDate(), daysInMonth);
    const targetDaily = simIncome > 0 ? (simIncome * 0.7) / daysInMonth : 1000;
    const actualDaily = dayOfMonth > 0 ? simExpense / dayOfMonth : 0;
    let burnScore = 10;
    if (actualDaily <= targetDaily) burnScore = 20;
    else if (actualDaily <= targetDaily * 1.2) burnScore = 15;
    else if (actualDaily <= targetDaily * 1.5) burnScore = 9;
    else burnScore = 4;

    // 4. Fixed Commitments Ratio (Target: <= 50% of income)
    const fixedRatio = simIncome > 0 ? (fixedNeeds / simIncome) * 100 : 40;
    let fixedScore = 12;
    if (fixedRatio <= 35) fixedScore = 20;
    else if (fixedRatio <= 50) fixedScore = 16;
    else if (fixedRatio <= 65) fixedScore = 10;
    else fixedScore = 4;

    // 5. Budget Envelope Health
    let envelopeScore = 20;
    if (budgets.length > 0) {
      const healthyEnvelopes = budgets.length - overbudgetCount;
      envelopeScore = Math.round((healthyEnvelopes / budgets.length) * 20);
    }

    const totalScore = Math.min(100, Math.max(10, runwayScore + savingsScore + burnScore + fixedScore + envelopeScore));

    let grade = 'A';
    let gradeLabel = 'Strong & Resilient';
    let gradeColor = 'from-emerald-500 to-teal-600';
    let gradeBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

    if (totalScore >= 90) {
      grade = 'AAA';
      gradeLabel = 'Elite Financial Fortress';
      gradeColor = 'from-emerald-400 via-teal-500 to-cyan-500';
      gradeBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    } else if (totalScore >= 75) {
      grade = 'AA';
      gradeLabel = 'Healthy & High Pacing';
      gradeColor = 'from-teal-500 to-emerald-600';
      gradeBadgeBg = 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    } else if (totalScore >= 60) {
      grade = 'A';
      gradeLabel = 'Stable with Growth Scope';
      gradeColor = 'from-indigo-500 to-brand-600';
      gradeBadgeBg = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    } else if (totalScore >= 45) {
      grade = 'B';
      gradeLabel = 'Moderate Pacing Risk';
      gradeColor = 'from-amber-500 to-orange-600';
      gradeBadgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    } else {
      grade = 'C';
      gradeLabel = 'High Burn / Immediate Attention';
      gradeColor = 'from-rose-500 to-red-600';
      gradeBadgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }

    return {
      runwayMonths: runwayMonths.toFixed(1),
      runwayScore,
      savingsRate: Math.round(savingsRate),
      savingsScore,
      burnScore,
      fixedRatio: Math.round(fixedRatio),
      fixedScore,
      envelopeScore,
      totalScore,
      grade,
      gradeLabel,
      gradeColor,
      gradeBadgeBg,
      simIncome,
      simExpense,
      simLiquid,
    };
  }, [
    totalEarned,
    totalSpent,
    totalLiquidCash,
    fixedNeeds,
    budgets,
    overbudgetCount,
    incomeDeltaPct,
    expenseCutAmount,
    extraRunwayBuffer,
  ]);

  // Radar points geometry (5 vertices on a circle)
  const radarPoints = useMemo(() => {
    const cx = 100;
    const cy = 100;
    const maxR = 75;

    const scores = [
      metrics.runwayScore / 20,
      metrics.savingsScore / 20,
      metrics.burnScore / 20,
      metrics.fixedScore / 20,
      metrics.envelopeScore / 20,
    ];

    const coords = scores.map((ratio, i) => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const r = Math.max(0.15, ratio) * maxR;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });

    const pathData = coords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ') + ' Z';

    return { coords, pathData };
  }, [metrics]);

  const handleResetSimulation = () => {
    setIncomeDeltaPct(0);
    setExpenseCutAmount(0);
    setExtraRunwayBuffer(0);
    addToast({
      title: 'Simulation Reset',
      message: 'Restored real-time live ledger parameters.',
      type: 'info',
    });
  };

  const isSimulated = incomeDeltaPct !== 0 || expenseCutAmount !== 0 || extraRunwayBuffer !== 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-28">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 rounded-3xl text-white border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-extrabold text-indigo-200 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            ClearScore™ Financial Radar
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {t('clearscore.title', 'ClearScore™ Health Radar')}
          </h2>
          <p className="text-xs text-slate-300 max-w-lg">
            {t('clearscore.subtitle', 'Real-time 100-point financial fitness index & 5-pillar wealth radar')}
          </p>
        </div>

        {/* Big Score Hero Bubble */}
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15 shrink-0 z-10">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Overall Score</span>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">
                {metrics.totalScore}
              </span>
              <span className="text-xs text-slate-400 font-bold">/100</span>
            </div>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Grade</span>
            <span className={`text-xl sm:text-2xl font-black px-2.5 py-0.5 rounded-xl border ${metrics.gradeBadgeBg}`}>
              {metrics.grade}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 5-Pillar Radar Spider Chart & Pillar Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: SVG Spider Radar Visualizer */}
        <div className="md:col-span-5 bg-white dark:bg-surface-dark p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center relative">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 self-start">
            5-Pillar Spider Map
          </h3>

          <div className="relative w-56 h-56 my-2">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
              {/* Background Concentric Radar Polygons */}
              {[0.25, 0.5, 0.75, 1.0].map((scale, idx) => {
                const polyPoints = [0, 1, 2, 3, 4]
                  .map((i) => {
                    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                    const r = scale * 75;
                    return `${(100 + r * Math.cos(angle)).toFixed(1)},${(100 + r * Math.sin(angle)).toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={idx}
                    points={polyPoints}
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="1"
                    strokeDasharray={idx < 3 ? '2 2' : 'none'}
                  />
                );
              })}

              {/* Axis Spoke Lines */}
              {[0, 1, 2, 3, 4].map((i) => {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1="100"
                    y1="100"
                    x2={(100 + 75 * Math.cos(angle)).toFixed(1)}
                    y2={(100 + 75 * Math.sin(angle)).toFixed(1)}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Filled Radar Area */}
              <polygon
                points={radarPoints.coords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                fill="url(#radarGradient)"
                stroke="#6366f1"
                strokeWidth="2.5"
                className="transition-all duration-500 ease-out"
              />

              {/* Glowing Dots at Vertices */}
              {radarPoints.coords.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#4f46e5"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="transition-all duration-500"
                />
              ))}

              <defs>
                <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.25" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="text-center mt-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
              {metrics.gradeLabel}
            </span>
            <span className="text-[11px] text-slate-400">
              Composite score updated live from {monthTxns.length} active entries
            </span>
          </div>
        </div>

        {/* Right: Detailed 5 Pillars breakdown */}
        <div className="md:col-span-7 bg-white dark:bg-surface-dark p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pillar Performance & Weights
          </h3>

          {/* Pillar 1: Emergency Runway */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-800 dark:text-slate-200">{t('clearscore.emergency_runway', 'Emergency Runway')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{metrics.runwayMonths} mos</span>
                <span className="text-[11px] text-emerald-600 font-extrabold">({metrics.runwayScore}/20 pts)</span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(metrics.runwayScore / 20) * 100}%` }} />
            </div>
          </div>

          {/* Pillar 2: Savings Velocity */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-800 dark:text-slate-200">{t('clearscore.savings_velocity', 'Savings Rate Velocity')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{metrics.savingsRate}%</span>
                <span className="text-[11px] text-indigo-600 font-extrabold">({metrics.savingsScore}/20 pts)</span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(metrics.savingsScore / 20) * 100}%` }} />
            </div>
          </div>

          {/* Pillar 3: Daily Burn Adherence */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600">
                  <Flame className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-800 dark:text-slate-200">{t('clearscore.burn_adherence', 'Daily Burn Discipline')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">Pacing Safe</span>
                <span className="text-[11px] text-amber-600 font-extrabold">({metrics.burnScore}/20 pts)</span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(metrics.burnScore / 20) * 100}%` }} />
            </div>
          </div>

          {/* Pillar 4: Fixed Commitments */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-800 dark:text-slate-200">{t('clearscore.fixed_commitments', 'Fixed Commitments (50/30/20)')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{metrics.fixedRatio}%</span>
                <span className="text-[11px] text-cyan-600 font-extrabold">({metrics.fixedScore}/20 pts)</span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(metrics.fixedScore / 20) * 100}%` }} />
            </div>
          </div>

          {/* Pillar 5: Envelope Health */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600">
                  <PieChart className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-800 dark:text-slate-200">{t('clearscore.envelope_health', 'Budget Envelope Health')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                  {budgets.length - overbudgetCount}/{budgets.length} Envelopes
                </span>
                <span className="text-[11px] text-rose-600 font-extrabold">({metrics.envelopeScore}/20 pts)</span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(metrics.envelopeScore / 20) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive "What-If" Stress Test Playground */}
      <div className="p-5 sm:p-6 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {t('clearscore.stress_test_title', 'What-If Financial Scenario Playground')}
              </h3>
              <p className="text-[11px] text-slate-500">
                Simulate how salary raises, spending cuts, or emergency top-ups impact your financial health score.
              </p>
            </div>
          </div>

          {isSimulated && (
            <button
              onClick={handleResetSimulation}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Simulation
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Slider 1: Income Growth / Loss */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">Income Scenario:</span>
              <span className={`tabular-nums ${incomeDeltaPct > 0 ? 'text-emerald-600' : incomeDeltaPct < 0 ? 'text-rose-500' : 'text-slate-600'}`}>
                {incomeDeltaPct > 0 ? `+${incomeDeltaPct}%` : `${incomeDeltaPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="50"
              step="5"
              value={incomeDeltaPct}
              onChange={(e) => setIncomeDeltaPct(Number(e.target.value))}
              className="w-full accent-brand-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Simulated: {currSym}{Math.round(metrics.simIncome).toLocaleString()}
            </span>
          </div>

          {/* Slider 2: Monthly Spend Cut */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">Discretionary Spend Cut:</span>
              <span className="text-emerald-600 tabular-nums">
                -{currSym}{expenseCutAmount.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="15000"
              step="500"
              value={expenseCutAmount}
              onChange={(e) => setExpenseCutAmount(Number(e.target.value))}
              className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Simulated Outflow: {currSym}{Math.round(metrics.simExpense).toLocaleString()}
            </span>
          </div>

          {/* Slider 3: Emergency Fund Injection */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">Emergency Top-Up:</span>
              <span className="text-indigo-600 tabular-nums">
                +{currSym}{extraRunwayBuffer.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100000"
              step="5000"
              value={extraRunwayBuffer}
              onChange={(e) => setExtraRunwayBuffer(Number(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">
              Simulated Buffer: {currSym}{Math.round(metrics.simLiquid).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* AI Financial Prescriptions */}
      <div className="p-5 sm:p-6 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {t('clearscore.prescriptions_title', 'AI Financial Prescriptions')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                Boost Liquid Buffer to 6 Months
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Add {currSym}25,000 to liquid savings to reach an ironclad 6-month safety net and unlock an instant +8 points on ClearScore.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex items-start gap-3">
            <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                Channel {currSym}3,000/mo into SIP
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Redirecting just 10% of discretionary spend into an equity index fund compounds to {currSym}30+ Lakhs in 20 years at 12% CAGR.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
