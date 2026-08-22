# ClearSpend — Complete Product Architecture & User Guide

> **An AI-First, Privacy-Conscious Personal Finance Copilot & Envelope Budgeting System**  
> *Built with React 18, TypeScript, Tailwind CSS, Recharts, Free Cloud AI & Google Gemini 2.5 Flash.*

---

## 🌟 1. Executive Summary & Vision

### The Problem
Most personal expense trackers fail within 30 days because of five core pain points:
1. **Manual Entry Friction:** Filling out 6 form fields (Date, Amount, Category, Wallet, Merchant, Notes) for every ₹20 chai or ₹380 lunch quickly leads to user abandonment.
2. **Untrusted Data & Duplicates:** Bank SMS feeds and manual entries frequently double-count transactions or mislabel credit card bill payments as new expenses or income.
3. **Passive Rearview Insights:** Standard trackers show static rearview charts after the month has already been blown.
4. **Uncertain Commitments:** Users lack visibility into how much of their paycheck is already locked in fixed subscriptions, rent, and EMIs.
5. **Discretionary Spending Blindness:** Users underestimate how small avoidable daily spends accumulate into massive lost wealth.

### The ClearSpend Solution
**ClearSpend** transforms expense tracking into a friction-free, intelligent, and rewarding daily habit:
- **Zero-Typing Multi-Modal Capture:** Instant one-line natural language, Indian Bank SMS parser for 20+ banks, microphone voice input, receipt camera OCR, and statement CSV import.
- **Review Inbox Defense:** Automatically flags duplicate swipes within 120-second windows and highlights statistical spending anomalies (>3x category median).
- **Safe-to-Spend Daily Pacing Engine:** Dynamically calculates your daily allowance:
  $$\text{Safe to Spend Today} = \frac{\text{Monthly Flexible Budget} - \text{Spent So Far} - \text{Savings Goals Reserved}}{\text{Days Remaining in Month}}$$
- **50/30/20 Committed vs Free Money:** Centralized register of fixed commitments (rent, subscriptions, EMIs) with proactive T-3 day auto-debit alerts.
- **100% Data-Grounded FinAI Copilot:** A multi-tiered AI assistant powered by Google Gemini 2.5 Flash and Free Browser Cloud AI answering exact queries using your live ledger numbers.
- **Power of Compounding Visualizer:** Shows how redirecting ₹2,000/month into index funds compounds into ₹20+ Lakhs over 10-20 years.

---

## 🏛️ 2. System Architecture & Tech Stack

```mermaid
graph TD
    UI[React 18 + Vite Mobile-First PWA] --> Store[React Context State Engine]
    Store --> Parser[NLP & Bank SMS Regex Parser]
    Store --> Pacing[Safe-to-Spend Daily Pacing Engine]
    Store --> Review[Review Inbox: Duplicates & Anomalies]
    Store --> Subscriptions[Recurring Subscriptions & T-3 Alerts]
    Store --> Goals[Savings Goals with Auto-Reservation]
    Store --> FinAI[Multi-Tiered FinAI Intelligence Orchestrator]
    
    Parser --> SMS[Indian Bank SMS Engine: 20+ Banks]
    Parser --> Voice[Web Speech API Microphone]
    Parser --> OCR[Gemini Vision Receipt OCR]
    Parser --> CSV[Bank Statement CSV Importer]
    
    FinAI --> Gemini[Google Gemini 2.5 Flash API]
    FinAI --> Puter[Free Browser Cloud AI]
    FinAI --> OfflineKernel[Deterministic Offline Mathematical Engine]
    
    Store --> SyncOutbox[(Offline Outbox Queue)]
    SyncOutbox --> Supabase[(Supabase Postgres & Realtime)]
```

### Core Technologies
- **Frontend Framework:** React 18 with TypeScript and Vite.
- **Styling & Design System:** Tailwind CSS with custom dark mode, glassmorphism backdrops, and micro-animations.
- **Data Visualizations:** Recharts (Area charts, Stacked Bar charts, Pacing meters, Compounding trajectories).
- **Data Layer:** Offline-first architecture with Outbox synchronization and Supabase Postgres Realtime subscriptions.
- **Testing:** Vitest unit test suite with 100% pass rate.

---

## 🚀 3. Comprehensive Feature Walkthrough

### 3.1 Zero-Typing Multi-Modal Capture
1. **One-Line Natural Language Bar:**
   - Type *"380 zomato lunch"* or *"2.2k shell petrol"*.
   - Understands Indian shorthand (`2k`, `1.5k`, `1.2l`, `₹`, `rs`).
   - Resolves relative dates (`yesterday`, `last friday`, `day before yesterday`).
2. **Indian Bank SMS Parser:**
   - Paste or share SMS from HDFC, SBI, ICICI, Axis, Kotak, PhonePe, Paytm, CRED.
   - Automatically extracts amount, debit/credit kind, merchant name, account suffix, and timestamp.
3. **Voice Input (Web Speech API):**
   - Tap the microphone button in the Quick-Add bar.
   - Speak naturally (*"Paid five hundred rupees for groceries at DMart"*).
   - Live floating transcript pill finalizes automatically on silence.
4. **Receipt Scanner (Gemini Vision OCR):**
   - Snap or upload a receipt photo.
   - Serverless Gemini Vision edge function extracts line items, total amount, merchant, and tax.
5. **CSV Bank Statement Importer:**
   - Upload bank statement CSVs from any bank.
   - Auto-detects delimiters (comma, semicolon, tab) and column mappings.
   - Pre-scans and flags duplicate entries before importing.

### 3.2 Safe-to-Spend Pacing & Streaks
- **Hero Daily Allowance Card:** Prominently displays how much you can safely spend today without exceeding monthly limits.
- **Calculation Explainer Modal:** Step-by-step interactive breakdown of total budget, money spent, committed subscriptions, reserved savings goals, and days remaining.
- **Streak Tracker:** Tracks consecutive days logged.
- **"No spend today 🎉" Button:** Zero-friction one-tap button logging a clean ₹0 day with milestone confetti.
- **Push Notification Reminders:** Customizable daily notifications via Service Worker.

### 3.3 Budgets & Committed Money
- **Category Envelopes:** Set monthly limits with alert thresholds (e.g. 80% caution zone).
- **Committed vs Free Money Card:** 50/30/20 rule breakdown:
  - Fixed Needs (Rent, Utilities, Subscriptions)
  - Savings Goals (Monthly auto-reserved allocations)
  - True Discretionary Free Pool
- **5-Month Velocity Trends:** Multi-month Area and Stacked Bar charts tracking financial progression across April, May, June, July, and August 2026.
- **Interactive Pacing Simulator:** Test spending adjustments (-30% to +30%) to simulate impact on month-end savings.

### 3.4 Recurring Subscriptions Register
- Centralized register for Netflix, Spotify, gym, rent, and EMIs.
- **T-3 Day Debit Alerts:** Proactively warns when auto-debits are due in the next 3 days.

### 3.5 Savings Goals with Auto-Reservation
- Create milestones (e.g. "Emergency Fund", "Japan Trip", "MacBook Pro").
- Monthly contributions are automatically reserved from the flexible budget pool, guaranteeing progress.
- Quick "Deposit / Contribute Funds" action with celebratory confetti.

### 3.6 Power of Compounding Visualizer
- Interactive SIP calculator illustrating the long-term potential of small daily spending decisions.
- Compares Fixed Deposits (6.5%), Nifty 50 Index Funds (12%), and Diversified Equity (15%) across 5, 10, 15, and 20 years.

### 3.7 FinAI Financial Copilot
- Conversational financial assistant grounded in your actual ledger data.
- Multi-model switcher: Google Gemini 2.5 Flash, Free Browser Cloud AI (Puter.js), and Offline Kernel.
- Gated behind an explicit user privacy consent banner.

### 3.8 Review Inbox (Trust Guard)
- Scans for exact duplicate fingerprints, rapid double-tap swipes (<120 seconds), and statistical spending anomalies (>3x median).
- Reactive alert banners across Overview and Ledger.
- One-click actions: "Merge Duplicate", "Keep Both", or "Dismiss".

---

## 🔒 4. Privacy, Security & Data Ownership

- **100% Local-First:** ClearSpend operates entirely client-side when offline. No credentials required to run locally.
- **Row Level Security (RLS):** Supabase Postgres policies isolate data so users can only ever access their own financial records.
- **Zero Fabrication Guarantee:** Discriminated union parsing ensures missing data prompts the user rather than inventing numbers.
- **One-Click Data Purge:** "Delete all my data and start fresh" feature allows instant permanent removal of all local and cloud records.
- **Complete Portability:** Export your entire ledger to CSV at any time.

---

## 📱 5. PWA Installation & Web Share Target

1. Open ClearSpend in Chrome, Safari, or Brave on mobile.
2. Tap **"Add to Home Screen"** to install as a standalone PWA.
3. Use Android's native **"Share"** button on any bank SMS to forward it directly into ClearSpend for instant zero-typing logging!
