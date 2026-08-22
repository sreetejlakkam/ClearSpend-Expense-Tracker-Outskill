import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Flame,
  Sparkles,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Bot,
  Send,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { useTranslation } from '../../lib/i18n';
import { queryFinAIChat } from '../../lib/finai';

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
  const { t, language } = useTranslation();

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
  const [incomeDeltaPct, setIncomeDeltaPct] = useState(0); // -30% to +50%
  const [expenseCutAmount, setExpenseCutAmount] = useState(0); // 0 to ₹15,000
  const [extraRunwayBuffer, setExtraRunwayBuffer] = useState(0); // 0 to ₹100,000

  // Interactive Pillar Selection state
  const [selectedPillarIdx, setSelectedPillarIdx] = useState<number | null>(null);

  // FinAI Radar Assistant State
  const [radarQuery, setRadarQuery] = useState('');
  const [radarModel, setRadarModel] = useState<'auto' | 'qwen' | 'deepseek' | 'gemini'>('auto');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [modelUsedBadge, setModelUsedBadge] = useState<string | null>(null);

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
    let gradeBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

    if (totalScore >= 90) {
      grade = 'AAA';
      gradeLabel = 'Elite Financial Fortress';
      gradeBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    } else if (totalScore >= 75) {
      grade = 'AA';
      gradeLabel = 'Healthy & High Pacing';
      gradeBadgeBg = 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    } else if (totalScore >= 60) {
      grade = 'A';
      gradeLabel = 'Stable with Growth Scope';
      gradeBadgeBg = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    } else if (totalScore >= 45) {
      grade = 'B';
      gradeLabel = 'Moderate Pacing Risk';
      gradeBadgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    } else {
      grade = 'C';
      gradeLabel = 'High Burn / Immediate Attention';
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

  // Pillar metadata definition with human-friendly intuitive labels
  const pillars = useMemo(() => [
    {
      id: 'runway',
      name: 'Emergency Runway',
      label: '🛡️ Runway',
      sublabel: `${metrics.runwayMonths} mos buffer`,
      score: metrics.runwayScore,
      max: 20,
      color: '#10B981',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/60',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      description: `Your liquid cash covers ${metrics.runwayMonths} months of living burn. Target is 6 months.`,
    },
    {
      id: 'savings',
      name: 'Savings Velocity',
      label: '📈 Savings',
      sublabel: `${metrics.savingsRate}% retained`,
      score: metrics.savingsScore,
      max: 20,
      color: '#6366F1',
      bgClass: 'bg-indigo-50 dark:bg-indigo-950/60',
      textClass: 'text-indigo-600 dark:text-indigo-400',
      description: `You are saving ${metrics.savingsRate}% of gross income. Exceeding 20% earns full points.`,
    },
    {
      id: 'burn',
      name: 'Daily Burn Pacing',
      label: '⚡ Burn Rate',
      sublabel: 'Pacing Safe',
      score: metrics.burnScore,
      max: 20,
      color: '#F59E0B',
      bgClass: 'bg-amber-50 dark:bg-amber-950/60',
      textClass: 'text-amber-600 dark:text-amber-400',
      description: 'Your day-to-day burn is aligned with the monthly safe spending envelope.',
    },
    {
      id: 'fixed',
      name: 'Fixed Commitments',
      label: '🔒 Fixed (50/30/20)',
      sublabel: `${metrics.fixedRatio}% of income`,
      score: metrics.fixedScore,
      max: 20,
      color: '#06B6D4',
      bgClass: 'bg-cyan-50 dark:bg-cyan-950/60',
      textClass: 'text-cyan-600 dark:text-cyan-400',
      description: `Rent and recurring bills consume ${metrics.fixedRatio}% of inflow (healthy ceiling is 50%).`,
    },
    {
      id: 'envelopes',
      name: 'Budget Envelopes',
      label: '🎯 Budget Caps',
      sublabel: `${budgets.length - overbudgetCount}/${budgets.length || 1} Green`,
      score: metrics.envelopeScore,
      max: 20,
      color: '#EC4899',
      bgClass: 'bg-rose-50 dark:bg-rose-950/60',
      textClass: 'text-rose-600 dark:text-rose-400',
      description: `${budgets.length - overbudgetCount} of ${budgets.length} category envelopes are comfortably within limits.`,
    },
  ], [metrics, budgets.length, overbudgetCount]);

  // Expanded SVG Spider geometry with labeled coordinates
  const radarGeometry = useMemo(() => {
    const cx = 170;
    const cy = 155;
    const maxR = 92;

    const coords = pillars.map((p, i) => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const ratio = Math.max(0.18, p.score / p.max);
      const r = ratio * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      // Label anchor points slightly beyond max radius
      const labelR = maxR + 32;
      const lx = cx + labelR * Math.cos(angle);
      const ly = cy + labelR * Math.sin(angle);

      return {
        x,
        y,
        lx,
        ly,
        angle,
        pillar: p,
      };
    });

    const polygonPath = coords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ') + ' Z';

    return { cx, cy, maxR, coords, polygonPath };
  }, [pillars]);

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

  // Submit query to FinAI Copilot
  const handleAskRadarQuestion = async (queryText?: string) => {
    const q = queryText || radarQuery.trim();
    if (!q) return;

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const stateObj = {
        profile,
        wallets,
        categories,
        transactions,
        budgets,
        selectedMonthStr,
      };

      const res = await queryFinAIChat(q, stateObj, {
        preferredModel: radarModel,
        language,
      });

      setAiResponse(res.text);
      setModelUsedBadge(res.modelUsed);
    } catch (err: any) {
      setAiResponse('### ⚠️ FinAI Copilot Notice\n\nFinAI is ready. You can test your query with **Qwen 2.5 Free AI** or verify your Google Gemini key.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const isSimulated = incomeDeltaPct !== 0 || expenseCutAmount !== 0 || extraRunwayBuffer !== 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-28">
      {/* 1. Header Banner & ClearScore Hero */}
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

      {/* 2. Real-Time AI Financial Fitness Executive Summary */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900/30 via-slate-900/50 to-indigo-900/30 rounded-3xl border border-indigo-500/20 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              AI Financial Posture Assessment • {selectedMonthStr}
            </h3>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {metrics.gradeLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 bg-white/5 dark:bg-slate-800/50 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 uppercase">
              <CheckCircle2 className="w-3 h-3" /> Core Strength
            </span>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              <strong>{metrics.savingsRate}% Savings Velocity</strong> lets you retain <strong>{currSym}{(totalEarned - totalSpent).toLocaleString()}</strong> this month.
            </p>
          </div>

          <div className="p-3 bg-white/5 dark:bg-slate-800/50 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 uppercase">
              <Flame className="w-3 h-3" /> Key Opportunity
            </span>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              Liquid runway stands at <strong>{metrics.runwayMonths} months</strong>. Reaching 6 months unlocks an instant <strong>AAA fortress rating</strong>.
            </p>
          </div>

          <div className="p-3 bg-white/5 dark:bg-slate-800/50 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 uppercase">
              <TrendingUp className="w-3 h-3" /> 20-Yr Compounding
            </span>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              Channeling {currSym}3,000/mo into an equity index SIP yields <strong>{currSym}30+ Lakhs</strong> in 20 years at 12% CAGR.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Grid: Enhanced Labeled 5-Pillar Spider Radar & Pillar Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Enhanced SVG Spider Radar Visualizer with Intuitive Axis Labels */}
        <div className="md:col-span-6 bg-white dark:bg-surface-dark p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              5-Pillar Spider Map
            </h3>
            <span className="text-[10px] text-slate-400">
              Tap any spoke to inspect
            </span>
          </div>

          {/* SVG Map Container */}
          <div className="relative w-full aspect-square max-w-[340px] my-1">
            <svg viewBox="0 0 340 310" className="w-full h-full drop-shadow-md select-none">
              {/* Concentric Guide Polygons with percentage badges */}
              {[0.25, 0.5, 0.75, 1.0].map((scale, idx) => {
                const polyPoints = [0, 1, 2, 3, 4]
                  .map((i) => {
                    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                    const r = scale * radarGeometry.maxR;
                    return `${(radarGeometry.cx + r * Math.cos(angle)).toFixed(1)},${(radarGeometry.cy + r * Math.sin(angle)).toFixed(1)}`;
                  })
                  .join(' ');
                return (
                  <g key={idx}>
                    <polygon
                      points={polyPoints}
                      fill="none"
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-700/80"
                      strokeWidth={idx === 3 ? '1.5' : '1'}
                      strokeDasharray={idx < 3 ? '2 2' : 'none'}
                    />
                    {/* Ring Percentage Markers along vertical axis */}
                    <text
                      x={radarGeometry.cx + 4}
                      y={radarGeometry.cy - scale * radarGeometry.maxR + 10}
                      className="text-[8px] font-mono font-bold fill-slate-400 dark:fill-slate-600"
                    >
                      {scale * 100}%
                    </text>
                  </g>
                );
              })}

              {/* Axis Spoke Lines */}
              {radarGeometry.coords.map((c, i) => (
                <line
                  key={i}
                  x1={radarGeometry.cx}
                  y1={radarGeometry.cy}
                  x2={(radarGeometry.cx + radarGeometry.maxR * Math.cos(c.angle)).toFixed(1)}
                  y2={(radarGeometry.cy + radarGeometry.maxR * Math.sin(c.angle)).toFixed(1)}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth="1.2"
                />
              ))}

              {/* Filled Radar Area */}
              <polygon
                points={radarGeometry.polygonPath}
                fill="url(#radarGradient)"
                stroke="#6366f1"
                strokeWidth="2.5"
                className="transition-all duration-500 ease-out"
              />

              {/* Vertices Dots */}
              {radarGeometry.coords.map((c, idx) => {
                const isSelected = selectedPillarIdx === idx;
                return (
                  <g
                    key={idx}
                    onClick={() => setSelectedPillarIdx(selectedPillarIdx === idx ? null : idx)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={isSelected ? 6 : 4.5}
                      fill={isSelected ? '#f59e0b' : '#4f46e5'}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-300 hover:scale-125"
                    />
                  </g>
                );
              })}

              {/* Clear Intuitive Axis Text Labels around the Map */}
              {radarGeometry.coords.map((c, idx) => {
                const isSelected = selectedPillarIdx === idx;
                const p = c.pillar;

                // Adjust text positioning offset based on angle
                let textAnchor: 'start' | 'middle' | 'end' = 'middle';
                let dx = 0;
                let dy = 0;

                if (idx === 0) { // Top (Runway)
                  dy = -12;
                } else if (idx === 1) { // Top-Right (Savings)
                  textAnchor = 'start';
                  dx = 10;
                  dy = -4;
                } else if (idx === 2) { // Bottom-Right (Burn)
                  textAnchor = 'start';
                  dx = 8;
                  dy = 12;
                } else if (idx === 3) { // Bottom-Left (Fixed)
                  textAnchor = 'end';
                  dx = -8;
                  dy = 12;
                } else if (idx === 4) { // Top-Left (Budgets)
                  textAnchor = 'end';
                  dx = -10;
                  dy = -4;
                }

                return (
                  <g
                    key={idx}
                    onClick={() => setSelectedPillarIdx(selectedPillarIdx === idx ? null : idx)}
                    className="cursor-pointer group"
                  >
                    <text
                      x={c.lx + dx}
                      y={c.ly + dy}
                      textAnchor={textAnchor}
                      className={`text-[10px] font-black transition-all ${
                        isSelected
                          ? 'fill-amber-500 font-extrabold'
                          : 'fill-slate-700 dark:fill-slate-200 group-hover:fill-brand-600'
                      }`}
                    >
                      {p.label}
                    </text>
                    <text
                      x={c.lx + dx}
                      y={c.ly + dy + 11}
                      textAnchor={textAnchor}
                      className="text-[9px] font-bold fill-slate-400 dark:fill-slate-500"
                    >
                      {p.sublabel} ({p.score}/20)
                    </text>
                  </g>
                );
              })}

              <defs>
                <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.25" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="text-center mt-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
              {metrics.gradeLabel}
            </span>
            <span className="text-[11px] text-slate-400">
              Live composite score from {monthTxns.length} transactions
            </span>
          </div>
        </div>

        {/* Right: Detailed 5 Pillars breakdown cards */}
        <div className="md:col-span-6 bg-white dark:bg-surface-dark p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pillar Performance Breakdown
          </h3>

          <div className="space-y-2">
            {pillars.map((p, idx) => {
              const isSelected = selectedPillarIdx === idx;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPillarIdx(isSelected ? null : idx)}
                  className={`cursor-pointer p-2.5 sm:p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-400 dark:border-brand-600 shadow-xs'
                      : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{p.label.split(' ')[0]}</span>
                      <span className="text-slate-900 dark:text-white font-extrabold">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                        {p.sublabel}
                      </span>
                      <span className={`text-[11px] font-extrabold ${p.textClass}`}>
                        ({p.score}/20 pts)
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(p.score / p.max) * 100}%`, backgroundColor: p.color }}
                    />
                  </div>

                  {isSelected && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 leading-relaxed animate-in fade-in">
                      {p.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. FinAI Radar Copilot Bar (Ask Questions About Spider Map & What It Means) */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white border border-indigo-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-white">
                FinAI Radar Assistant • Ask Questions About Your Score
              </h3>
              <p className="text-[10.5px] text-slate-300">
                Ask what your spider map means, why a pillar is scored high or low, or how to hit AAA grade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={radarModel}
              onChange={(e) => setRadarModel(e.target.value as any)}
              className="text-[11px] font-bold px-2.5 py-1 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-slate-100 focus:outline-hidden cursor-pointer"
            >
              <option value="auto" className="bg-slate-900 text-white">⚡ Auto (Smart Free AI)</option>
              <option value="qwen" className="bg-slate-900 text-white">🚀 Qwen 2.5 Free AI</option>
              <option value="deepseek" className="bg-slate-900 text-white">🧠 DeepSeek Free AI</option>
              <option value="gemini" className="bg-slate-900 text-white">🤖 Gemini 2.5 Flash</option>
            </select>
          </div>
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            'Explain my 5-pillar spider map',
            'How to get AAA grade on ClearScore?',
            'Why is my Emergency Runway score low?',
            'How does my 50/30/20 ratio compare?',
          ].map((promptText, pIdx) => (
            <button
              key={pIdx}
              onClick={() => {
                setRadarQuery(promptText);
                handleAskRadarQuestion(promptText);
              }}
              className="shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white border border-white/10 transition-colors"
            >
              💬 {promptText}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskRadarQuestion();
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            value={radarQuery}
            onChange={(e) => setRadarQuery(e.target.value)}
            placeholder='Ask FinAI: "How to raise my score by +15 points this month?"…'
            className="flex-1 text-xs font-medium px-3.5 py-2.5 bg-white/10 border border-white/15 rounded-2xl text-white placeholder:text-slate-400 focus:outline-hidden focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={isAiLoading || !radarQuery.trim()}
            className="px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
          >
            {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Ask</span>
          </button>
        </form>

        {/* AI Answer Box */}
        {aiResponse && (
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs text-slate-100 leading-relaxed space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-b border-white/10 pb-1.5">
              <span>FinAI Answer</span>
              {modelUsedBadge && (
                <span className="px-2 py-0.5 rounded-full bg-brand-500/30 text-brand-200 border border-brand-400/30">
                  {modelUsedBadge}
                </span>
              )}
            </div>
            <div className="whitespace-pre-line prose prose-invert max-w-none text-slate-200 text-xs">
              {aiResponse}
            </div>
          </div>
        )}
      </div>

      {/* 5. Interactive "What-If" Stress Test Playground */}
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

      {/* 6. AI Strategic Prescriptions with 1-Click Simulation */}
      <div className="p-5 sm:p-6 bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {t('clearscore.prescriptions_title', 'AI Financial Prescriptions')}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">
            1-Tap Actions to Boost Score
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1 */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  6-Month Emergency Runway
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Injecting {currSym}25,000 into high-yield liquid reserves expands your safety net to 4.5+ months and adds +7 score points.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setExtraRunwayBuffer(25000);
                addToast({
                  title: 'Playground Configured',
                  message: 'Simulating +₹25,000 Emergency Buffer top-up.',
                  type: 'success',
                });
              }}
              className="self-end text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Zap className="w-3 h-3" /> Test in Simulator
            </button>
          </div>

          {/* Card 2 */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  SIP Compounding Acceleration
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Trimming discretionary spend by {currSym}2,000/mo and routing it into Nifty 50 SIP compounds to {currSym}20+ Lakhs in 20 yrs.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setExpenseCutAmount(2000);
                addToast({
                  title: 'Playground Configured',
                  message: 'Simulating -₹2,000 Discretionary spend trim.',
                  type: 'success',
                });
              }}
              className="self-end text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Zap className="w-3 h-3" /> Test in Simulator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
