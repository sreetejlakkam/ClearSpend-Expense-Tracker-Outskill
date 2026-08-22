import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Languages, Settings as SettingsIcon, UserCircle, Info, Sun, Moon } from 'lucide-react';
import { useStore } from '../../lib/store';
import { useTranslation, LanguageCode } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';
import { AboutModal } from './AboutModal';

export const Header: React.FC = () => {
  const {
    selectedDate,
    changeMonth,
    setActiveTab,
    activeTab,
    profile,
    isAuthenticated,
    viewScope,
    setViewScope,
    household,
  } = useStore();

  const { t, language, setLanguage } = useTranslation();
  const { isDark, setTheme } = useTheme();
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

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
    if (isDark) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  // Extract user initials
  const displayName = profile?.display_name || 'ClearSpend User';
  const firstName = displayName.split(' ')[0];
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header
        className={`sticky top-0 z-30 transition-all shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] w-full max-w-full overflow-hidden ${
          viewScope === 'household'
            ? 'bg-teal-950/90 dark:bg-teal-950/95 backdrop-blur-xl border-b-2 border-teal-500/50 text-white'
            : 'bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800'
        }`}
      >
        {viewScope === 'household' && (
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-[10px] font-bold py-0.5 px-3 text-center flex items-center justify-center gap-1.5 shadow-xs">
            <span>👨‍👩‍👧</span>
            <span>{household?.name || 'Shared Family Room'} • Combined Household Lens Active</span>
          </div>
        )}
        <div className="max-w-4xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-1 sm:gap-2">
          
          {/* Left: App Logo & Brand (Click opens About Us modal) */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="cursor-pointer flex items-center gap-1.5 sm:gap-2 group text-left focus:outline-hidden"
              title="About ClearSpend • Click to view mission & architecture"
              aria-label="About ClearSpend"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-brand-700 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-all shrink-0">
                <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-indigo-100" />
              </div>
              <div className="hidden md:flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-black text-sm sm:text-base leading-none tracking-tight text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {t('app.title', 'ClearSpend')}
                  </span>
                  <Info className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline" />
                </div>
              </div>
            </button>
          </div>

          {/* Center: Household Scope Switcher & Month Switcher */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 min-w-0">
            {/* Household Switcher Pill (👤 My Money ⇄ 👨‍👩‍👧 Family) */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-xl p-0.5 shadow-inner-sm shrink-0">
              <button
                onClick={() => setViewScope('personal')}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                  viewScope === 'personal'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Personal Private Ledger (My Money)"
              >
                <span>👤</span>
                <span className="hidden sm:inline">My Money</span>
              </button>
              <button
                onClick={() => setViewScope('household')}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                  viewScope === 'household'
                    ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-xs font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400'
                }`}
                title="Shared Household Planning (Family Room)"
              >
                <span>👨‍👩‍👧</span>
                <span className="hidden sm:inline">Family</span>
              </button>
            </div>

            {/* Month Switcher */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 rounded-xl p-0.5 shadow-inner-sm shrink-0">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
              <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 px-1 sm:px-1.5 select-none min-w-[50px] sm:min-w-[70px] text-center capitalize">
                {monthName}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Light/Dark Mode Button + Language Switcher + Account Details in Settings Button */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-all shadow-xs"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </button>

            {/* Quick Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-0.5 px-1.5 sm:px-2 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider border border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-all shadow-xs"
              title="Switch Language (English / తెలుగు / हिन्दी)"
              aria-label="Switch Language"
            >
              <Languages className="w-3 h-3 text-brand-600 dark:text-brand-400" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Account Login Details in the Settings Icon Button (Far Right) */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1 sm:gap-1.5 p-1 sm:px-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border ${
                activeTab === 'settings'
                  ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border-brand-400/80 ring-1 ring-brand-500'
                  : 'bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
              title={`Logged in as ${displayName} (${profile?.email || 'Active Account'}) • Account Settings`}
              aria-label="Account Settings"
            >
              {/* Avatar Pill with Active Status Indicator */}
              <div className="relative flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center text-[9px] font-black shadow-xs">
                  {userInitials || <UserCircle className="w-3.5 h-3.5" />}
                </div>
                {isAuthenticated && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white dark:border-surface-dark" />
                )}
              </div>

              {/* User Name & Settings Cog on sm+ */}
              <div className="hidden sm:flex items-center gap-1">
                <span className="text-[11px] font-bold truncate max-w-[70px]">
                  {firstName}
                </span>
                <SettingsIcon className="w-3 h-3 text-slate-400 dark:text-slate-400" />
              </div>
            </button>
          </div>

        </div>
      </header>

      {/* About ClearSpend Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </>
  );
};


