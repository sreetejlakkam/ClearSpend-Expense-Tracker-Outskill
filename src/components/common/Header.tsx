import React from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Sun, Moon, Languages, Settings as SettingsIcon } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useTranslation, LanguageCode } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';

export const Header: React.FC = () => {
  const {
    selectedDate,
    changeMonth,
    setActiveTab,
    activeTab,
    profile,
  } = useStore();

  const { t, language, setLanguage } = useTranslation();
  const { isDark, setTheme } = useTheme();

  const monthName = selectedDate.toLocaleString(
    language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'default',
    { month: 'short', year: 'numeric' }
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
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 transition-all shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] w-full max-w-full overflow-hidden">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        
        {/* Left: Brand + Month Switcher side-by-side */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* App Title / Brand */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer flex items-center gap-1.5 sm:gap-2 group shrink-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-brand-700 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-all shrink-0">
              <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-indigo-100" />
            </div>
            <span className="font-black text-base sm:text-lg leading-none tracking-tight text-slate-900 dark:text-white">
              {t('app.title', 'ClearSpend')}
            </span>
          </div>

          {/* Month Switcher (Clean compact left-aligned pill) */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-xl p-0.5 shadow-inner-sm shrink-0">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 px-1 select-none min-w-[70px] sm:min-w-[84px] text-center capitalize">
              {monthName}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Actions: Theme, Language, and Account Settings Icon */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quick Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-indigo-600" />
            )}
          </button>

          {/* Quick Language Switcher Pill */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider border border-slate-200/80 dark:border-slate-700 transition-all shadow-xs"
            title="Switch Language (English / తెలుగు / हिन्दी)"
            aria-label="Switch Language"
          >
            <Languages className="w-3 h-3 text-brand-600 dark:text-brand-400" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Account Settings Icon in Top Right Corner */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border ${
              activeTab === 'settings'
                ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border-brand-400/80 ring-1 ring-brand-500'
                : 'bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700'
            }`}
            title="Account Settings & Preferences"
            aria-label="Account Settings"
          >
            <SettingsIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span className="hidden sm:inline font-bold">
              {profile?.display_name ? profile.display_name.split(' ')[0] : t('nav.accounts', 'Account')}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};

