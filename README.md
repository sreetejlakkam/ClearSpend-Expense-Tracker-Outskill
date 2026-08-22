# ClearSpend — Zero-Friction Daily Expense Tracker & AI Money Coach

> **"Log spending in one line, trust the numbers, get warned before your month goes wrong, and compound your wealth."**

ClearSpend is a modern, privacy-first personal expense tracker and AI financial coach designed for salaried professionals and students. It combines zero-typing capture modalities (Bank SMS parsing, Web Speech voice input, camera receipt scanning, CSV import) with real-time "Safe to Spend Today" pacing, multi-month envelope analytics, and proactive duplicate/anomaly guards.

---

## 🌐 Live Production Links
- **🚀 Live Web Application:** [https://clearspend-ai-expense-tracker.vercel.app](https://clearspend-ai-expense-tracker.vercel.app)
- **📖 Comprehensive Product & Architecture Guide:** [APP_GUIDE.md](APP_GUIDE.md)
- **🛡️ Security & Privacy Model:** [SECURITY.md](SECURITY.md)
- **🗺️ Product Roadmap:** [ROADMAP.md](ROADMAP.md)
- **📂 GitHub Repository:** [https://github.com/sreetejlakkam/ClearSpend-AI-Expense-Tracker](https://github.com/sreetejlakkam/ClearSpend-AI-Expense-Tracker)

---

## 🌟 The 5 Core Problems ClearSpend Solves

1. **Logging Friction:** Traditional trackers require 5+ manual fields per expense, leading to abandonment within two weeks.  
   👉 **Solution:** **Multi-modal Zero-Typing Capture** (One-line natural language, Indian Bank SMS parser for 20+ banks, microphone voice input, and receipt camera scanner).
2. **Untrustworthy Data:** Automatic bank imports produce duplicates, wrong categories, and credit-card payments booked as income.  
   👉 **Solution:** **Self-healing ledger guard** with rapid-tap (<120s) duplicate detection, >3x median anomaly detection, and a dedicated **Review Inbox**.
3. **Passive Rearview Insights:** Standard apps show a rearview pie chart of a month that is already blown.  
   👉 **Solution:** **Safe to Spend Today Daily Pacing Engine** and proactive envelope budget velocity warnings (*"At this pace you'll spend ₹X on Food — cap it at ₹Z/day to stay on track"*).
4. **Uncertain Commitments:** Users don't know how much of their paycheck is already committed to rent, EMIs, and subscriptions.  
   👉 **Solution:** **50/30/20 Committed vs Free Money Breakdown** and Recurring Subscriptions Register with T-3 day auto-debit alerts.
5. **Discretionary Spending Blindness:** People underestimate the compounding potential of small avoidable daily spends.  
   👉 **Solution:** **Power of Compounding Visualizer** showing how redirecting ₹2,000/month can grow to ₹20+ Lakhs in long-term index funds.

---

## 🚀 Key Features & Architectural Modules

### 1. ⚡ Multi-Modal Zero-Typing Capture
- **One-Line Natural Language Quick Add:** Understands Indian shorthand (`2k` = 2000, `1.5k` = 1500, `₹`, `rs`) and relative dates (`yesterday`, `last friday`).
- **Indian Bank SMS Regex Engine:** Deterministic regex support for 20+ major financial institutions (HDFC, SBI, ICICI, Axis, Kotak, PhonePe, Paytm, CRED).
- **Web Speech Voice Capture:** Hands-free microphone logging with live floating transcript pill and auto-silence finalization.
- **Gemini Vision Receipt OCR:** Camera receipt scanner extracting merchant, amount, date, and line items.
- **Bank Statement CSV Importer:** Auto-detects delimiters (comma, semicolon, tab), maps debit/credit columns, and scans for existing duplicate transactions before importing.

### 2. 📅 Daily Return Loop & Pacing Engine
- **Safe-to-Spend Daily Allowance:**
  $$\text{Safe to Spend Today} = \frac{\text{Monthly Flexible Budget} - \text{Spent So Far} - \text{Savings Goals Reserved}}{\text{Days Remaining in Month}}$$
- **Daily Logging Streaks:** Streak tracker with "No spend today 🎉" zero-friction button and milestone celebration confetti (7, 14, 30, 60, 100 days).
- **Web Push Notifications:** Customizable daily logging reminders (e.g. 9:00 PM) powered by service worker push alerts.

### 3. 🎯 Forward-Looking Money & Wealth
- **Recurring Subscriptions Register:** Centralized tracking for rent, Netflix, Spotify, gym, and EMIs with proactive T-3 day debit warning banners.
- **Committed vs Free Money Card:** Visual 50/30/20 rule breakdown of Fixed Needs, Monthly Savings, and True Discretionary Free Pool.
- **Savings Goals with Auto-Reservation:** Sets financial milestones (Emergency Fund, Japan Trip) and automatically reserves monthly contributions from the daily spend pool.
- **Power of Compounding Visualizer:** Interactive SIP compounding calculator comparing Fixed Deposits (6.5%), Nifty 50 Index Funds (12%), and Diversified Equity (15%).

### 4. 🛡️ Trust Guard & Review Inbox
- **Multi-Tier Duplicate Scanner:** Detects exact fingerprint collisions, rapid double-tap swipes (<120s), and cross-day probable matches.
- **Statistical Anomaly Detector:** Flags transactions exceeding 3x the category median spend.
- **Review Inbox:** One-click merge, keep, or dismiss actions directly from the Overview and Ledger notification banners.

### 5. 🌐 Offline-First Supabase Data Layer
- **Outbox Queue (`clearspend_sync_outbox_v1`):** Works 100% offline with zero latency; automatically flushes pending mutations when network reconnects.
- **Realtime Postgres Subscriptions:** Live multi-device sync across laptops, tablets, and phones.
- **Supabase Auth:** Email/Password + Magic Link OTP passwordless authentication.

### 6. 📱 Progressive Web App (PWA)
- **Standalone PWA:** Installed directly to home screen via `manifest.json`.
- **Web Share Target:** Forward bank SMS directly from native messaging apps into ClearSpend with automatic parsing!

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React Icons, Recharts, Canvas Confetti.
- **Data & Sync:** Supabase Postgres, Realtime WebSockets, IndexedDB / LocalStorage Outbox Queue.
- **AI & NLP:** Multi-tiered LLM Orchestrator (Google Gemini 2.5 Flash, Browser Puter.js, Deterministic Offline Regex Kernel).
- **Testing:** Vitest test suite covering Bank SMS parsing, Safe-to-Spend pacing math, CSV statements, and zero-fabrication input parser.

---

## 💻 Local Development Setup

```bash
# 1. Clone & Install
git clone https://github.com/sreetejlakkam/ClearSpend-AI-Expense-Tracker.git
cd ClearSpend-AI-Expense-Tracker
npm install

# 2. Run Tests
npx vitest run

# 3. Start Development Server
npm run dev

# 4. Production Build
npm run build
```

---

## 🛡️ License
MIT License. Built with ❤️ for personal financial empowerment.
