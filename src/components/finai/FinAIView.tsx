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
  Loader2
} from 'lucide-react';

import { useStore } from '../../lib/store';
import {
  ChatMessage,
  buildFinancialContext,
  queryGeminiAI
} from '../../lib/finai';

const INITIAL_PROMPTS = [
  { icon: '🍔', label: 'How much did I spend on Zomato & Swiggy?' },
  { icon: '🏆', label: 'What was my highest expense this month?' },
  { icon: '🏦', label: 'What is my HDFC Bank balance?' },
  { icon: '🛍️', label: 'Can I afford to buy a ₹10,000 gadget?' },
  { icon: '⚡', label: 'What is my daily burn rate and runway?' },
  { icon: '📊', label: 'Where did I spend the most this month?' },
  { icon: '💡', label: 'Give me 3 actionable tips to cut spending' },
  { icon: '🎯', label: 'Am I on track with my budgets?' },
];


export const FinAIView: React.FC = () => {
  const {
    profile,
    wallets,
    categories,
    transactions,
    budgets,
    selectedMonthStr,
    addToast
  } = useStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('clearspend_gemini_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);

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

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'finai',
      text: `👋 Hi **${profile?.display_name || 'there'}**! I'm **FinAI**, your AI Financial Copilot.

I have analyzed your **${selectedMonthStr}** ledger:
- **Income:** **${currSym}${totalEarned.toLocaleString()}**
- **Expenses:** **${currSym}${totalSpent.toLocaleString()}**
- **Savings Rate:** **${savingsRate}%** (${currSym}${netBalance.toLocaleString()} saved)

Ask me anything about your spending patterns, how to optimize budgets, or tap a suggestion below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

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
      const financialContext = buildFinancialContext(
        profile,
        wallets,
        categories,
        transactions,
        budgets,
        selectedMonthStr
      );

      const aiReply = await queryGeminiAI(text, financialContext, apiKey, {
        profile,
        wallets,
        categories,
        transactions,
        budgets,
        selectedMonthStr,
      });

      const botMsg: ChatMessage = {

        id: (Date.now() + 1).toString(),
        sender: 'finai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
      addToast({
        title: 'Gemini API Key Saved',
        message: 'FinAI is now connected to live Gemini models!',
        type: 'success',
      });
    } else {
      localStorage.removeItem('clearspend_gemini_key');
      addToast({
        title: 'Using Built-in AI Engine',
        message: 'FinAI will use the local zero-config financial model.',
        type: 'info',
      });
    }
    setShowKeyModal(false);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'reset',
        sender: 'finai',
        text: `Chat history cleared. How can I help you manage your finances today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
              <h4 key={idx} className="font-extrabold text-slate-900 text-sm sm:text-base mt-2 mb-1 flex items-center gap-1.5">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-brand-600 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(line.substring(2)) }} />
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+)\.\s/)?.[1] || '1';
            const rest = line.replace(/^\d+\.\s/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-brand-700 font-extrabold">{num}.</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(rest) }} />
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700">$1</em>');
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Top Banner: FinAI Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Sparkles className="w-6 h-6 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">FinAI Copilot</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gemini 2.5 Active
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Personal financial intelligence grounded in your real spending data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors border border-white/10"
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-indigo-300" />
            <span>{apiKey ? 'API Key Set' : 'Custom API Key'}</span>
          </button>

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
      <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold block">Spent</span>
            <span className="text-xs font-black text-slate-900 tabular-nums truncate block">
              {currSym}{totalSpent.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold block">Income</span>
            <span className="text-xs font-black text-emerald-700 tabular-nums truncate block">
              {currSym}{totalEarned.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <PiggyBank className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold block">Saved</span>
            <span className="text-xs font-black text-indigo-700 tabular-nums truncate block">
              {savingsRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4 min-h-[380px] max-h-[520px] flex flex-col justify-between overflow-hidden">
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
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs sm:text-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-brand-700 to-indigo-600 text-white shadow-md shadow-brand-700/20 rounded-tr-xs'
                    : 'bg-slate-50 border border-slate-200/90 text-slate-800 shadow-xs rounded-tl-xs'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="font-semibold leading-relaxed">{msg.text}</p>
                ) : (
                  renderFormattedText(msg.text)
                )}
                <span
                  className={`text-[9px] font-bold block mt-1.5 text-right ${
                    msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
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
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl rounded-tl-xs flex items-center gap-2 text-xs font-bold text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>FinAI is crunching your numbers…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x">
            {INITIAL_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.label)}
                disabled={isLoading}
                className="shrink-0 snap-start px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs hover:scale-[1.02] active:scale-95 disabled:opacity-50"
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
            className="relative flex items-center bg-slate-50 border border-slate-300 focus-within:border-brand-600 rounded-2xl p-1 transition-all"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask FinAI: 'How can I save ₹5000 more?' or 'Audit my food spend'…"
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
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

      {/* Optional Gemini API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Google Gemini API Key</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2">
              <p>
                FinAI includes a <strong>free, zero-config local intelligence model</strong> out of the box.
              </p>
              <p>
                To enable live cloud reasoning with <strong>Gemini 2.5 Flash</strong>, you can paste your free API key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-700 font-bold underline"
                >
                  Google AI Studio
                </a>
                .
              </p>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-xs font-mono font-semibold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-brand-600 focus:outline-hidden"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-extrabold shadow-sm transition-all"
                >
                  Save API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
