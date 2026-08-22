# ClearSpend — AI-Powered Expense Tracker & Wealth Coach

> **"Log spending in one line, trust the numbers, get warned before your month goes wrong, and compound your wealth."**

ClearSpend is a modern, privacy-first personal expense tracker and AI financial coach designed for salaried professionals and students managing spending across cash, UPI, and cards.

---

## 🌐 Live Production Links
- **🚀 Live Web Application:** [https://clearspend-ai-expense-tracker.vercel.app](https://clearspend-ai-expense-tracker.vercel.app)
- **📖 Comprehensive Product & Architecture Guide:** [APP_GUIDE.md](APP_GUIDE.md)
- **📂 GitHub Repository:** [https://github.com/sreetejlakkam/ClearSpend-AI-Expense-Tracker](https://github.com/sreetejlakkam/ClearSpend-AI-Expense-Tracker)

---

## 🌟 The 4 Core Problems ClearSpend Solves

1. **Logging Friction:** Traditional trackers require 5+ fields per expense, leading to abandonment within two weeks.  
   👉 **Solution:** **One-line natural language quick-add** (e.g. *"380 zomato lunch"*, *"2.2k shell petrol"*, *"85k salary hdfc"*).
2. **Untrustworthy Data:** Automatic bank imports produce duplicates, wrong categories, and credit-card payments booked as income.  
   👉 **Solution:** **Self-healing ledger guard** with duplicate detection, >3x median anomaly detection, and a dedicated **Review Inbox**.
3. **Passive Insights:** Standard apps show a rearview pie chart of a month that is already blown.  
   👉 **Solution:** **Proactive envelope budget warnings** and end-of-month spending pace forecasts (*"At this pace you'll spend ₹X on Food — cap it at ₹Z/day to stay on track"*).
4. **Discretionary Spending Blindness:** People underestimate the compounding potential of small avoidable daily spends.  
   👉 **Solution:** **Power of Compounding Visualizer** showing how redirecting ₹2,000/month can grow to ₹20+ Lakhs in long-term index funds.

---

## 🚀 Key Features

- **⭐ One-Line Natural Language Quick Add:**
  - Understands Indian shorthand (`2k` = 2000, `1.5k` = 1500, `₹`, `rs`).
  - Resolves relative dates (`yesterday`, `last friday`, `day before yesterday`).
  - Surfaces AI Confidence badges: **High** (>0.8), **Check this** (0.5–0.8), **Guess** (<0.5).
- **⭐ Multi-Tiered FinAI Intelligence Copilot:**
  - Answers specific financial questions using real ledger transactions (e.g. *"How much did I spend on Zomato this month?"*).
  - Multi-model support: **Auto**, **Google Gemini 2.5 Flash**, and **Free Cloud AI (Puter.js)**.
- **⭐ Envelope Budgeting & 5-Month Visual Infographics:**
  - 5-Month historical dataset (April, May, June, July, August 2026).
  - Multi-layer Area chart tracking Income vs Expenses vs Net Savings over 5 months.
  - Stacked Category Trajectory charts.
  - 50/30/20 Needs vs Wants split analyzer.
  - Interactive Pacing & Burn Simulator.
- **⭐ Power of Compounding Visualizer:**
  - Interactive SIP compounding calculator comparing Fixed Deposits (6.5%), Nifty 50 Index Funds (12%), and Diversified Equity (15%).
- **⭐ Review Inbox (Trust Guard):**
  - Flags duplicate transaction pairs: exact fingerprint matches, rapid double-tap swipes (<120 seconds), and probable duplicates within 2 days.
  - Flags statistical spending anomalies (>3x category median).
- **⭐ Multi-Language & Theme System:**
  - Full localization for **English**, **తెలుగు (Telugu)**, and **हिन्दी (Hindi)**.
  - 1-Click Sun ☀️ / Moon 🌙 theme toggle in the header.
- **⭐ Self-Learning Category Rules:**
  - Correcting an AI category automatically creates regex memory for future and past transactions.
- **⭐ Data Management & Portability:**
  - Full CSV export for all transactions.
  - Instant One-Click Demo Mode with 100+ seeded multi-month realistic transactions.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons, Recharts, Canvas Confetti.
- **AI Engine:**
  - Multi-Tiered LLM Orchestrator supporting Google Gemini 2.5 Flash and Free Browser Cloud AI.
  - Supabase Edge Functions: `parse-transaction`, `detect-duplicates`, `generate-insights`.
  - Offline-first deterministic math kernel ensuring 100% functionality with zero config.
- **Database & Auth:** Supabase Postgres with Row Level Security (RLS) and email authentication.

---

## 📁 Database Schema

```sql
profiles          id (=auth.uid), email, display_name, base_currency, onboarded_at, created_at
wallets           id, user_id, name, type[cash|bank|card|wallet], currency, opening_balance, is_archived, created_at
categories        id, user_id, name, icon, color, kind[expense|income], is_default, created_at
transactions      id, user_id, wallet_id, category_id, amount(numeric > 0), kind[expense|income],
                  txn_date(date), merchant, note, source[manual|nl|csv],
                  ai_confidence(0-1), ai_suggested_category_id, was_corrected(bool),
                  fingerprint(text), duplicate_of_id, status[active|merged|dismissed],
                  created_at, updated_at
budgets           id, user_id, category_id, period[monthly], amount, start_month(date), alert_threshold(int), created_at
category_rules    id, user_id, match_text(lower), category_id, hit_count, created_at, updated_at
insights          id, user_id, type[forecast|top_mover|subscription|streak|anomaly], title, body, payload, period_start, period_end, is_dismissed, created_at
```

---

## 💻 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/sreetejlakkam/ClearSpend-AI-Expense-Tracker.git
cd ClearSpend-AI-Expense-Tracker
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(If left blank, ClearSpend automatically runs with its built-in offline local storage & AI rule engine).*

### 3. Run Locally
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🛡️ License
MIT License. Built with ❤️ for personal financial empowerment.
