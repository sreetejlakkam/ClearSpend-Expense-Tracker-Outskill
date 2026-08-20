# ClearSpend — AI-Powered Expense Tracker & Money Coach

> **"Log spending in one line, trust the numbers, and get warned before your month goes wrong — not after."**

ClearSpend is a personal expense tracker and AI financial coach designed for salaried professionals and students managing spending across cash, UPI, and cards.

---

## 🌟 The 3 Core Problems ClearSpend Solves

1. **Logging Friction:** Traditional trackers require 5+ fields per expense, leading to abandonment within two weeks.  
   👉 **Solution:** **One-line natural language quick-add** (e.g. *"380 zomato lunch"*, *"2k rent yesterday"*, *"got 50000 salary"*).
2. **Untrustworthy Data:** Automatic bank imports produce duplicates, wrong categories, and credit-card payments booked as income.  
   👉 **Solution:** **Self-healing ledger guard** with duplicate detection, >3x median anomaly detection, and a dedicated **Review Inbox**.
3. **Passive Insights:** Standard apps show a rearview pie chart of a month that is already blown.  
   👉 **Solution:** **Proactive AI budget warnings** and end-of-month spending pace forecasts (*"At this pace you'll spend ₹X on Food — cap it at ₹Z/day to stay on track"*).

---

## 🚀 Key Features

- **⭐ One-Line Natural Language Quick Add:**
  - Understands Indian shorthand (`2k` = 2000, `1.5k` = 1500, `₹`, `rs`).
  - Resolves relative dates (`yesterday`, `last friday`, `day before yesterday`).
  - Surfaces AI Confidence badges: **High** (>0.8), **Check this** (0.5–0.8), **Guess** (<0.5).
- **⭐ Self-Learning Category Rules:**
  - Whenever you correct an AI-suggested category, ClearSpend learns the rule into `category_rules`.
  - Offers a one-click retroactive update: *"Learned — Also apply to past transactions from this merchant?"*.
- **⭐ Review Inbox (Trust Guard):**
  - Flags duplicate transaction pairs (matching fingerprints or same amount/date with high merchant similarity).
  - Actions: **Merge** (keeps older, marks newer merged), **Keep Both**, or **Delete**.
  - Flags unusual spending spikes (>3x category median).
- **⭐ Interactive Donut & Category Breakdown:**
  - Visual Recharts expense donut with interactive legend.
  - Tap any category slice to instantly filter ledger history.
- **⭐ Proactive Budget Pacing:**
  - Real-time pace calculations vs. days elapsed.
  - Daily spend target: `₹X/day left to stay on track`.
  - Turns amber at 80% threshold and red past 100%.
  - Suggested budget limits based on 3-month past spending averages.
- **⭐ AI Coach Insight Cards:**
  - Monthly forecast & pace digest.
  - Top spending movers (largest Month-over-Month increases).
  - Subscription creep detector (recurring charges across consecutive months).
- **⭐ Data Management & Portability:**
  - CSV export for all transactions.
  - Multi-select mode for bulk recategorization and bulk deletion.
  - Wallets CRUD (Cash, Bank, UPI Wallet, Credit Card).
  - Instant One-Click Demo Mode with 40+ seeded realistic transactions.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons, Recharts, date-fns, Canvas Confetti.
- **Backend & Database:** Supabase Postgres with Row Level Security (RLS) on all tables (`user_id = auth.uid()`), Supabase Auth, and Supabase Edge Functions.
- **AI Engine:**
  - Edge Functions: `parse-transaction`, `detect-duplicates`, `generate-insights`
  - Model-agnostic LLM interface (`callLLM`) supporting Gemini (`gemini-2.5-flash`) and OpenAI (`gpt-4o-mini`).
  - High-fidelity offline client fallback engine ensuring the app is 100% functional out of the box anywhere.

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

> **Critical Rule:** Amounts are ALWAYS stored as positive numbers. Direction is strictly carried by `kind` (`expense` or `income`). Credit card bill repayments are expenses, never income.

---

## 💻 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/<your-username>/ClearSpend-AI-Expense-Tracker.git
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

## 🚀 Supabase & Vercel Deployment

### Supabase Edge Functions Deployment
```bash
# Set your LLM secret in Supabase
supabase secrets set LLM_API_KEY=your_gemini_api_key LLM_PROVIDER=gemini

# Deploy functions
supabase functions deploy parse-transaction
supabase functions deploy detect-duplicates
supabase functions deploy generate-insights
```

### Vercel Deployment
1. Import repository on [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Set environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` if using remote Supabase.
4. Deploy!

---

## 🎬 3-Minute Demo Script

1. **Problem (20s):** "Most people abandon expense trackers within a month because manual logging has too much friction, and bank feeds create duplicate charges and categorize card payments as income. Once you stop trusting the number, you stop opening the app."
2. **Solution (15s):** "ClearSpend: One-line natural logging, a self-healing ledger that catches duplicates, and proactive warnings before you overspend."
3. **Live Demo (90s):**
   - Type `380 zomato lunch` into the sticky bar → instantly parsed and categorized.
   - Type `2k rent yesterday` → demonstrates Indian shorthand (`2k` -> ₹2,000) and relative date resolution.
   - Correct one category → see the *"Learned — filed under Category. Also apply to past transactions?"* toast.
   - Open the **Review Inbox** → review and merge the planted duplicate pair.
   - Check the **Dashboard** → highlight the proactive amber forecast warning banner: *"At this pace you'll spend ₹X on Food — cap it at ₹Z/day to stay on track"*.
4. **Conclusion (15s):** "By combining instant one-line capture with a self-repairing ledger and proactive AI coaching, ClearSpend turns personal budgeting from a tedious chore into effortless financial peace of mind."

---

## 🛡️ License
MIT License. Built with ❤️ for financial wellness.
