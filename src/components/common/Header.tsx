import React from 'react';
import { ChevronLeft, ChevronRight, ShieldAlert, Sparkles, Sun, Moon, Languages } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useTranslation, LanguageCode } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

export const Header: React.FC = () => {
  const {
    selectedDate,
    changeMonth,
    pendingReviewCount,
    setActiveTab,
    activeTab,
  } = useStore();


  const { t, language, setLanguage } = useTranslation();
  const { isDark, setTheme } = useTheme();

  const monthName = selectedDate.toLocaleString(
    language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'default',
    { month: 'long', year: 'numeric' }
  );

  const toggleLanguage = () => {
    const nextLang: Record<LanguageCode, LanguageCode> = {
      en: 'te',
      te: 'hi',
      hi: 'en',
    };
    setLanguage(nextLang[language]);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 transition-all shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* App Title / Brand */}
        <div className="flex items-center gap-2">
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer flex items-center gap-2 sm:gap-2.5 group"
          >
            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-brand-700 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-all shrink-0">
              <Sparkles className="w-4 sm:w-4.5 h-4 sm:h-4.5 text-indigo-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                {t('app.title', 'ClearSpend')}
                <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200/70 dark:border-brand-800 shadow-xs">
                  {t('header.ai_coach', 'AI Coach')}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Month Switcher */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-0.5 sm:p-1 shadow-inner-sm">
          <button
            onClick={() => changeMonth(-1)}
            className="p-1 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </button>
          <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 px-1.5 sm:px-2 select-none min-w-[90px] sm:min-w-[110px] text-center capitalize">
            {monthName}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-1 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-indigo-600" />}
          </button>

          {/* Quick Language Switcher Pill */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider border border-slate-200/80 dark:border-slate-700 transition-all shadow-xs"
            title="Switch Language (English / తెలుగు / हिन्दी)"
          >
            <Languages className="w-3 h-3 text-brand-600" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* FinAI Quick Trigger */}
          <button
            onClick={() => setActiveTab('finai')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'finai'
                ? 'bg-gradient-to-r from-brand-700 to-indigo-600 text-white shadow-md shadow-brand-700/20'
                : 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 hover:bg-indigo-100'
            }`}
            title="Ask FinAI Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-900" />
            <span className="hidden sm:inline">{t('header.finai', 'FinAI')}</span>
          </button>

          {/* Review Inbox Alert Button */}
          {pendingReviewCount > 0 && (
            <button
              onClick={() => setActiveTab('review')}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'review'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800 hover:bg-amber-100'
              }`}
              title="Items in Review Inbox"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">{t('header.review', 'Review')}</span>
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-amber-600 text-white shadow-xs">
                {pendingReviewCount}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
