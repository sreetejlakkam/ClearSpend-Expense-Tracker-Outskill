import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Key,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Loader2,
  Cpu,
  ExternalLink
} from 'lucide-react';

import { useStore } from '../../lib/store';
import { useTranslation } from '../../lib/i18n';
import {
  ChatMessage,
  queryFinAIChat
} from '../../lib/finai';

const INITIAL_PROMPTS = [
  { icon: '🍔', label: 'How much did I spend on Zomato & Swiggy?' },
  { icon: '📈', label: 'What if I invest ₹2,000 monthly over 20 years?' },
  { icon: '🏆', label: 'What was my highest expense this month?' },
  { icon: '🏦', label: 'What is my HDFC Bank balance?' },
  { icon: '🛍️', label: 'Can I afford to buy a ₹10,000 gadget?' },
  { icon: '⚡', label: 'What is my daily burn rate and runway?' },
  { icon: '📊', label: 'Where did I spend the most this month?' },
  { icon: '💡', label: 'Give me 3 actionable tips to cut spending' },
];

export const FinAIView: React.FC = () => {
  const { language } = useTranslation();
  const {
    profile,
    wallets,
    categories,
    transactions,
    budgets,
    selectedMonthStr,
    updateProfile,
    addToast
  } = useStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('clearspend_gemini_key') || '');
  const [preferredModel, setPreferredModel] = useState<'auto' | 'gemini' | 'qwen' | 'deepseek'>('auto');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingModelSwitch, setPendingModelSwitch] = useState<'auto' | 'gemini' | 'qwen' | 'deepseek' | null>(null);

  const isCloudConsentGranted = profile?.ai_consent === 'cloud';

  const handleModelChange = (newModel: 'auto' | 'gemini' | 'qwen' | 'deepseek') => {
    if (newModel === 'gemini' && !apiKey) {
      setShowKeyModal(true);
      return;
    }
    if (newModel !== 'auto' && !isCloudConsentGranted) {
      setPendingModelSwitch(newModel);
      setShowConsentModal(true);
      return;
    }
    setPreferredModel(newModel);
  };

  const handleGrantConsent = async () => {
    await updateProfile({ ai_consent: 'cloud' });
    if (pendingModelSwitch) {
      setPreferredModel(pendingModelSwitch);
      setPendingModelSwitch(null);
    }
    setShowConsentModal(false);
    addToast({
      title: 'Cloud AI Enabled',
      message: 'Cloud reasoning enabled with privacy-first anonymisation.',
      type: 'success',
    });
  };

  const handleStayOffline = async () => {
    await updateProfile({ ai_consent: 'none' });
    setPreferredModel('auto');
    setPendingModelSwitch(null);
    setShowConsentModal(false);
    addToast({
      title: 'Offline Mode Active',
      message: 'FinAI will run 100% locally on your device.',
      type: 'info',
    });
  };

  const currSym = profile?.base_currency === 'INR' ? '₹' : (profile?.base_currency || '₹');

  // Compute live summary for the context banner
  const monthTxns = transactions.filter(
    (t) => t.status === 'active' && t.txn_date.startsWith(selectedMonthStr)
  );
  const totalSpent = monthTxns
    .filter((t) => t.kind === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalEarned = monthTxns
    .filter((t) => t.kind === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalEarned - totalSpent;
  const savingsRate = totalEarned > 0 ? Math.max(0, Math.round(((totalEarned - totalSpent) / totalEarned) * 100)) : 0;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    let welcomeText = `👋 Hi **${profile?.display_name || 'there'}**! I'm **FinAI**, your Free AI Financial Copilot.
    
I am directly connected to your **${selectedMonthStr}** ledger and free LLM reasoning engine:
- **Income:** **${currSym}${totalEarned.toLocaleString()}**
- **Expenses:** **${currSym}${totalSpent.toLocaleString()}**
- **Savings Rate:** **${savingsRate}%** (${currSym}${netBalance.toLocaleString()} retained)

Ask me anything about your merchants (Zomato, Swiggy, Uber), affordability queries, or compounding investment potential!`;

    if (language === 'te') {
      welcomeText = `👋 నమస్తే **${profile?.display_name || 'గారు'}**! నేను **ఫిన్‌ఏఐ**, మీ ఉచిత ఏఐ ఆర్థిక కోపైలట్.

మీ **${selectedMonthStr}** లావాదేవీల సారాంశం:
- **ఆదాయం:** **${currSym}${totalEarned.toLocaleString()}**
- **ఖర్చులు:** **${currSym}${totalSpent.toLocaleString()}**
- **పొదుపు రేటు:** **${savingsRate}%** (${currSym}${netBalance.toLocaleString()} నికర పొదుపు)

మీ ఖర్చుల వివరాలు, నిర్దిష్ట వ్యాపారుల ఖర్చులు లేదా చక్రవడ్డీ పెట్టుబడి లెక్కల గురించి నన్ను అడగండి!`;
    } else if (language === 'hi') {
      welcomeText = `👋 नमस्ते **${profile?.display_name || 'जी'}**! मैं **फिनएआई** हूँ, आपका निःशुल्क एआई वित्तीय कोपायलट।

आपके **${selectedMonthStr}** का ब्योरा:
- **आय:** **${currSym}${totalEarned.toLocaleString()}**
- **खर्च:** **${currSym}${totalSpent.toLocaleString()}**
- **बचत दर:** **${savingsRate}%** (${currSym}${netBalance.toLocaleString()} शुद्ध बचत)

अपने खर्चों, बजट या चक्रवृद्धि निवेश के बारे में कुछ भी पूछें!`;
    }

    return [
      {
        id: 'welcome',
        sender: 'finai',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: preferredModel === 'gemini' ? 'Google Gemini 2.5 Flash' : preferredModel === 'deepseek' ? 'DeepSeek Free AI' : 'Qwen 2.5 Free AI',
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await queryFinAIChat(
        text,
        {
          profile,
          wallets,
          categories,
          transactions,
          budgets,
          selectedMonthStr,
        },
        {
          apiKey,
          preferredModel,
          language,
        }
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'finai',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: response.modelUsed,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      addToast({
        title: 'Query Error',
        message: err?.message || 'Failed to get response from FinAI',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = tempApiKey.trim();
    setApiKey(cleanKey);
    if (cleanKey) {
      localStorage.setItem('clearspend_gemini_key', cleanKey);
      setPreferredModel('gemini');
      addToast({
        title: 'Google Gemini 2.5 Flash Active',
        message: 'FinAI is now connected to live Google Gemini models!',
        type: 'success',
      });
    } else {
      localStorage.removeItem('clearspend_gemini_key');
      setPreferredModel('qwen');
      addToast({
        title: 'Using Free AI Engine',
        message: 'FinAI will use the built-in free Qwen 2.5 AI engine.',
        type: 'info',
      });
    }
    setShowKeyModal(false);
  };

  const handleClearChat = () => {
    const activeLabel = preferredModel === 'gemini' ? 'Google Gemini 2.5 Flash' : preferredModel === 'deepseek' ? 'DeepSeek Free AI' : 'Qwen 2.5 Free AI';
    setMessages([
      {
        id: 'reset',
        sender: 'finai',
        text: `Chat history cleared. How can I help you optimize your spending and wealth today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: activeLabel,
      },
    ]);
  };

  // Helper to format basic markdown (bold, lists, headers) into styled JSX
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base mt-2 mb-1 flex items-center gap-1.5">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-slate-800 dark:text-slate-200">
                <span className="text-brand-600 dark:text-brand-400 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(line.substring(2)) }} />
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+)\.\s/)?.[1] || '1';
            const rest = line.replace(/^\d+\.\s/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-slate-800 dark:text-slate-200">
                <span className="text-brand-700 dark:text-brand-400 font-extrabold">{num}.</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(rest) }} />
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} className="text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700 dark:text-slate-300">$1</em>');
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-4 pb-28">
      {/* Top Banner: FinAI Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 rounded-3xl text-white shadow-xl border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Sparkles className="w-6 h-6 text-indigo-100" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">FinAI Copilot</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Free AI Model Active
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 truncate">
              Personal financial copilot grounded in your real live spending data
            </p>
          </div>
        </div>

        {/* Model Selector & Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
          <select
            value={preferredModel}
            onChange={(e) => handleModelChange(e.target.value as any)}
            className="text-[11px] font-bold px-2.5 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-slate-100 focus:outline-hidden cursor-pointer"
          >
            <option value="auto" className="bg-slate-900 text-white">⚡ Auto (Smart Engine)</option>
            <option value="qwen" className="bg-slate-900 text-white">🚀 Qwen 2.5 Free AI</option>
            <option value="deepseek" className="bg-slate-900 text-white">🧠 DeepSeek Free AI</option>
            <option value="gemini" className="bg-slate-900 text-white">🤖 Google Gemini 2.5 Flash</option>
          </select>

          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-Time Financial Snapshot Strip */}
      <div className="grid grid-cols-3 gap-2 bg-white dark:bg-surface-dark p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">Spent</span>
            <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums truncate block">
              {currSym}{totalSpent.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">Income</span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums truncate block">
              {currSym}{totalEarned.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
            <PiggyBank className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">Saved</span>
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 tabular-nums truncate block">
              {savingsRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white dark:bg-surface-dark rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card p-4 min-h-[380px] max-h-[520px] flex flex-col justify-between overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'finai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-brand-700 to-indigo-600 text-white shadow-md shadow-brand-700/20 rounded-tr-xs'
                    : 'bg-slate-50 dark:bg-slate-850 border border-slate-200/90 dark:border-slate-750 text-slate-800 dark:text-slate-200 shadow-xs rounded-tl-xs'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="font-semibold leading-relaxed">{msg.text}</p>
                ) : (
                  renderFormattedText(msg.text)
                )}

                <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[9px]">
                  {msg.sender === 'finai' && msg.modelUsed && (
                    <span className="font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <Cpu className="w-2.5 h-2.5" />
                      {msg.modelUsed}
                    </span>
                  )}
                  <span
                    className={`font-bold ml-auto ${
                      msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl rounded-tl-xs flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>FinAI is reasoning with your ledger data…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x">
            {INITIAL_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.label)}
                disabled={isLoading}
                className="shrink-0 snap-start px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus-within:border-brand-600 rounded-2xl p-1 transition-all"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask FinAI: 'How much on Swiggy?', 'Can I buy a ₹15k phone?'…"
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
            />

            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="p-2 rounded-xl bg-gradient-to-r from-brand-700 to-indigo-600 hover:from-brand-800 hover:to-indigo-700 text-white disabled:opacity-40 transition-all shadow-xs shrink-0"
              title="Send Prompt"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Free Gemini API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Google Gemini & Free AI</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
              <p>
                FinAI includes a <strong>free, zero-config cloud AI model</strong> running right in your browser.
              </p>
              <p>
                To enable direct high-speed cloud reasoning with <strong>Gemini 2.5 Flash</strong>, you can paste your free API key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-700 dark:text-brand-400 font-bold underline inline-flex items-center gap-0.5"
                >
                  Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>{' '}
                (100% free, 15 RPM).
              </p>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs font-mono font-semibold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-600 focus:outline-hidden"
              />

              <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setPreferredModel('qwen');
                    setShowKeyModal(false);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 transition-colors"
                >
                  🚀 Use Free Qwen 2.5 (No Key)
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-extrabold shadow-sm transition-all"
                  >
                    Activate Gemini
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cloud AI Privacy & Data Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Cloud AI Data Consent</h3>
              </div>
              <button
                onClick={() => setShowConsentModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-3">
              <p>
                To provide generative financial intelligence with <strong>Google Gemini 2.5 Flash</strong>, <strong>Qwen 2.5 Free AI</strong>, or <strong>DeepSeek Free AI</strong>, FinAI securely processes minimal anonymised financial context for your active month queries.
              </p>
              
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <div>
                    <strong className="text-slate-900 dark:text-white block">What leaves your device:</strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Anonymised transaction amounts and category names for your active month query.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">✗</span>
                  <div>
                    <strong className="text-slate-900 dark:text-white block">What NEVER leaves your device:</strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Your name, email, credentials, bank accounts, wallet IDs, or raw note text.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleStayOffline}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Stay 100% Offline
              </button>
              <button
                type="button"
                onClick={handleGrantConsent}
                className="px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-extrabold shadow-sm transition-all"
              >
                Allow Cloud AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
