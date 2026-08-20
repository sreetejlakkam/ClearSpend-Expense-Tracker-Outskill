import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { Sparkles, RefreshCw, X, TrendingUp, Calendar, Repeat, ShieldCheck, Zap } from 'lucide-react';
import { InsightType } from '../../types';

export const InsightsView: React.FC = () => {
  const { insights, refreshInsights, dismissInsight } = useStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshInsights();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case 'forecast':
        return <Calendar className="w-5 h-5 text-teal-400" />;
      case 'top_mover':
        return <TrendingUp className="w-5 h-5 text-amber-400" />;
      case 'subscription':
        return <Repeat className="w-5 h-5 text-indigo-400" />;
      case 'streak':
        return <Zap className="w-5 h-5 text-emerald-400" />;
      case 'anomaly':
      default:
        return <ShieldCheck className="w-5 h-5 text-rose-400" />;
    }
  };

  const getCardGradient = (type: InsightType) => {
    switch (type) {
      case 'forecast':
        return 'from-brand-900 to-teal-950 border-teal-700/40 text-teal-100';
      case 'top_mover':
        return 'from-zinc-900 to-amber-950 border-amber-800/40 text-amber-100';
      case 'subscription':
        return 'from-zinc-900 to-indigo-950 border-indigo-800/40 text-indigo-100';
      case 'streak':
        return 'from-zinc-900 to-emerald-950 border-emerald-800/40 text-emerald-100';
      default:
        return 'from-zinc-900 to-zinc-950 border-zinc-700/40 text-zinc-100';
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 leading-tight">AI Money Coach</h2>
            <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-600" />
              Active
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Proactive spending intelligence, end-of-month forecasts & hidden subscription alerts
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-200/80 hover:bg-zinc-50 text-xs font-bold text-zinc-800 shadow-xs transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand-700 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Insight Cards List */}
      {insights.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {insights.map((card) => (
            <div
              key={card.id}
              className={`p-5 bg-gradient-to-br ${getCardGradient(
                card.type
              )} rounded-3xl border shadow-card relative group transition-all`}
            >
              <button
                onClick={() => dismissInsight(card.id)}
                className="absolute top-3.5 right-3.5 text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-xs">
                  {getInsightIcon(card.type)}
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/70 block">
                    {card.type.replace('_', ' ')}
                  </span>
                  <h4 className="text-sm font-bold text-white leading-snug pr-4">
                    {card.title}
                  </h4>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-white/85 pt-1">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-zinc-200/80 text-center shadow-card space-y-3">
          <Sparkles className="w-10 h-10 text-brand-600 mx-auto animate-pulse" />
          <h4 className="text-sm font-bold text-zinc-800">All insights reviewed!</h4>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Tap refresh to re-evaluate your monthly numbers with the AI finance engine.
          </p>
          <button
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generate New Insights
          </button>
        </div>
      )}
    </div>
  );
};
