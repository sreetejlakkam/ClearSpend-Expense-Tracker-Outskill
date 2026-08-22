# ClearSpend Product Roadmap & Architecture Evolution

## 🗺️ Completed Milestones

### Phase 1: Critical Trust Fixes (P0) ✅
- [x] Neutral seed persona with real relative date calculations.
- [x] Demo session isolation (`isDemoSession`) preventing contamination of user production ledgers.
- [x] Discriminated union `ParseOutcome` with zero fabricated numbers.
- [x] Multi-tier duplicate scanner (`scanDuplicates`) with rapid-tap detection (<120s).
- [x] Explicit privacy consent gate for cloud AI processing.

### Phase 2: Real Supabase Backend & Offline Outbox ✅
- [x] Offline-first data layer (`src/lib/db.ts`) with outbox queue (`clearspend_sync_outbox_v1`).
- [x] Realtime Postgres change stream subscriptions.
- [x] Supabase Auth with Email/Password + Magic Link OTP passwordless authentication.
- [x] Serverless Gemini 2.5 Flash Edge Function relay with streaming response support.

### Phase 3: Zero-Typing Capture Modalities ✅
- [x] Indian Bank SMS Regex Parser supporting 20+ major institutions (HDFC, SBI, ICICI, Axis, Kotak, PhonePe, Paytm, CRED).
- [x] Web Speech API real-time microphone voice input with floating transcript pill.
- [x] Camera receipt scanner with Gemini Vision OCR Edge Function.
- [x] Bank statement CSV importer with auto-delimiter detection and pre-import duplicate scanning.

### Phase 4: Daily Return Loop ✅
- [x] "Safe to Spend Today" dynamic daily allowance pacing engine.
- [x] Daily logging streak tracker with milestone confetti (7, 14, 30, 60, 100 days).
- [x] Zero-friction "No spend today 🎉" button.
- [x] Service Worker Web Push notification manager with customizable daily reminder times.

### Phase 5: Forward-Looking Money & PWA ✅
- [x] Recurring subscriptions register with T-3 day auto-debit warnings.
- [x] 50/30/20 Committed vs Free Money breakdown card in Budgets view.
- [x] Savings goals with monthly auto-reservation reducing daily spend pool.
- [x] Progressive Web App (PWA) manifest with Web Share Target for SMS forwarding.

### Phase 6: Streamlined UX & Simplification ✅
- [x] 4-Tab bottom navigation (Overview, Ledger, Budgets, FinAI).
- [x] Review Inbox surfaced as a reactive banner/badge across Overview and Ledger.
- [x] Double-confirmation data purge ("Delete all my data and start fresh").

---

## 🔮 Future Architecture Horizons

- [ ] Account Aggregator (RBI-regulated AA network) integration for automated read-only bank feeds.
- [ ] Multi-currency real-time FX conversion for international transactions.
- [ ] Splitwise / Shared Household Group Expenses ledger sync.
- [ ] Native iOS and Android binaries via Capacitor.
