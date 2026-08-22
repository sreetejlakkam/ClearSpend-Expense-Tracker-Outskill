# ClearSpend Security & Privacy Model

## 🛡️ Core Philosophy: Privacy-First & Local-First

ClearSpend is built from the ground up to protect sensitive personal financial information. Financial data is strictly private and belongs only to the user.

---

## 1. Zero Silent Data Fabrication
- The natural language and SMS parsing engines use strict discriminated unions (`ParseOutcome`).
- Missing amounts or unclear details trigger interactive clarification requests (`needs_clarification`) rather than hallucinated or guessed amounts.

## 2. Explicit Cloud AI Consent Gate
- All external AI processing (Google Gemini / Serverless Edge functions) is gated behind an explicit **User Privacy Consent** check.
- When Cloud AI is disabled or declined, ClearSpend runs 100% locally via deterministic offline regex and rule matching engines.
- Sensitive identifiers like account numbers, credit card CVVs, and OTPs are stripped client-side prior to any parsing.

## 3. Database Security & Row Level Security (RLS)
- Postgres tables (`profiles`, `wallets`, `categories`, `transactions`, `budgets`, `category_rules`, `recurring_items`, `goals`, `insights`) are locked down with Postgres Row Level Security (RLS).
- Every query enforces `auth.uid() = user_id`, guaranteeing cross-tenant isolation where users can never read, modify, or delete another user's financial ledger.

## 4. Offline Outbox & Local Storage Encryption
- Offline transactions and changes are staged in an encrypted local outbox (`clearspend_sync_outbox_v1`).
- Sync occurs idempotently using unique UUID fingerprints, preventing replay attacks and duplicate entries during network reconnects.

## 5. Web Speech & Vision OCR Privacy
- Voice transcripts captured via the Web Speech API are processed locally in real-time within browser memory and immediately discarded after parsing.
- Receipt images processed via the OCR Edge Function are passed ephemerally to Google Gemini Vision without persisting raw images to disk or cloud storage.

## 6. Responsible Disclosure
If you discover a security vulnerability in ClearSpend, please report it privately via GitHub Issues or contact the maintainer directly.
