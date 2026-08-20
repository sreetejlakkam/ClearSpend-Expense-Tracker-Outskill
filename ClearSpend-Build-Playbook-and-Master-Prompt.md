# ClearSpend — Hackathon Build Playbook & Master Starting Prompt

**Working product name:** ClearSpend
**Category:** Personal expense tracker + AI money coach
**Stack:** Bolt.new (frontend) → Supabase (auth, Postgres, Edge Functions) → LLM API (Gemini or OpenAI) → GitHub (backup) → Vercel (public link)
**Build window:** 3 days

---

## 0. Read this before you paste anything

**One important correction on tooling.** Google **Antigravity** is an *agentic coding IDE* (a workspace where an agent plans, writes, and tests code across an editor/terminal/browser) — it is not a hosted "AI features" API you call from your app. So use it one of two ways:

| If you meant… | Do this |
|---|---|
| "Build the app inside Antigravity instead of Bolt" | Use the same master prompt below in Antigravity as your agent task brief. Everything else (Supabase schema, Edge Functions, Vercel) stays identical. |
| "Power the app's AI features with Google's models" | Use the **Gemini API** (`gemini-2.5-flash` is the cheap/fast choice for categorization and parsing) called from a Supabase Edge Function. Swap in OpenAI with a one-line change. |

The master prompt below is written **model-agnostic** — there is a single `LLM_API_KEY` + `LLM_PROVIDER` env var, so you can flip between Gemini and OpenAI without touching app code. That's deliberate: judges like seeing that you didn't hard-couple to one vendor.

**Non-negotiable security rule:** the LLM key never touches the frontend. All AI calls go through Supabase Edge Functions. Bolt will happily put the key in the browser if you don't tell it not to — the prompt below tells it not to.

---

# PHASE 1 — IDEATION (filled)

## 1.1 Product one-liner

For **salaried professionals and students in India who manage money across cash, UPI and cards**, I am building **ClearSpend**, an AI expense tracker, so they can **log spending in one line, trust the numbers, and get warned before a month goes wrong — not after**.

## 1.2 Who is this for

- **Primary user role:** 22–40 year old working professional / student, tracks personal spending, uses UPI heavily, occasionally splits with family or flatmates.
- **Context of use:** 10–20 second bursts on mobile, right after paying for something. Plus one weekly 3-minute review session.
- **Top 3 pains today:**
  1. **Logging is friction.** Existing apps make you fill 5 fields per expense, so people quit within two weeks.
  2. **The data can't be trusted.** Auto-imported feeds produce duplicates, wrong categories, and payments counted as income — so users stop believing the totals.
  3. **Insights are passive.** You get a pie chart of a month that's already over. Nothing intervenes *before* you overspend.

## 1.3 MVP success for this hackathon

- **A user should be able to:** sign up, add an expense by typing one natural sentence ("380 zomato lunch"), have it auto-parsed and auto-categorized, see it land in a live dashboard with a category breakdown and a budget bar, and get at least one AI insight generated from their own data.
- **Demo success metric:** a first-time user logs 5 transactions in under 60 seconds total, and every one is correctly categorized without manual editing.

---

## 2. Problem sharpening — 5 Whys

**Problem v0:** People start expense trackers and abandon them within a month.

| # | Question | Answer |
|---|---|---|
| 1 | Why is this a problem for the user? | They lose visibility on where money goes, and only discover overspend when the month is already blown. |
| 2 | Why does that happen right now? | Manual logging is too slow to sustain, and automatic bank feeds are unreliable, so the ledger becomes incomplete or wrong. |
| 3 | Why haven't existing tools solved this well? | Apps like Spendee bet everything on bank aggregation. When the aggregator breaks — broken links, duplicates, credit-card payments booked as income — the whole product breaks, and the app has no self-healing layer. |
| 4 | Why is the user still stuck? | Fixing bad data by hand is more work than not tracking at all, so they abandon rather than clean up. |
| 5 | Why does solving this now matter? | LLMs make one-line entry and self-correcting categorization cheap enough that "trustworthy ledger with near-zero input effort" is finally buildable by a small team. |

### Final problem statement (reuse this verbatim in prompts, PRD, and demo)

> Working professionals abandon expense trackers because logging every transaction is too much effort and automatic imports produce untrustworthy data — duplicates, wrong categories, payments counted as income — leaving them with a ledger they neither maintain nor believe, and no warning before they overspend.

---

## 3. Competitor scan (Spendee + adjacent)

| Product | What they do well | What frustrates users |
|---|---|---|
| **Spendee** | Award-winning visual design; shared wallets for couples/families; multi-currency; 2,500+ bank connections | Bank sync breaks for weeks at a time; duplicate transactions; credit-card balances booked as income with no way to fix; cannot edit category/label on pending transactions; feels feature-stagnant while pushing subscriptions |
| **YNAB** | Rigorous zero-based budgeting method; strong behaviour change | Steep learning curve; heavy manual discipline; expensive |
| **Walnut / Money Manager (India)** | SMS-based auto-capture suits Indian UPI/bank alerts | Noisy parsing, category chaos, dated UI, weak insight layer |

**Pattern:** every tool has *tracking + categories + charts*. Nobody owns **"the ledger repairs itself and warns you early."** That is the wedge.

---

## 4. MoSCoW scope (⭐ = differentiator)

| Feature | M | S | C | W | ⭐ | Why here |
|---|:-:|:-:|:-:|:-:|:-:|---|
| Email auth + user profile | ☑ | | | | – | Nothing is personal without it |
| Wallets (cash / bank / card) | ☑ | | | | – | Users think in accounts |
| Add / edit / delete transaction (full form) | ☑ | | | | – | Core CRUD; skipping edit is what makes trackers infuriating |
| Default + custom categories | ☑ | | | | – | Backbone of every view |
| **⭐ One-line natural-language quick add** | ☑ | | | | ⭐ | Directly kills Pain #1 (friction). This is the demo moment. |
| **⭐ AI auto-categorization with confidence + learning from corrections** | ☑ | | | | ⭐ | Kills Pain #2. Corrections create rules that apply retroactively. |
| Dashboard: month totals, category donut, recent txns | ☑ | | | | – | The "summary view" ask |
| Monthly category budgets + progress bars | ☑ | | | | – | Needed for the alert to mean anything |
| **⭐ Duplicate & anomaly guard (review inbox)** | | ☑ | | | ⭐ | Kills Pain #2 hard. Cheap to build, huge trust signal. |
| **⭐ AI Insights digest + end-of-month forecast** | | ☑ | | | ⭐ | Kills Pain #3. Proactive, not a rearview pie chart. |
| Ask-your-money natural language Q&A | | | ☑ | | ⭐ | Great if time remains; needs guardrails |
| Receipt photo → transaction (vision) | | | ☑ | | ⭐ | Impressive but slow to make reliable |
| CSV import / export | | | ☑ | | – | Judges rarely test it; users eventually need it |
| Shared wallets / split expenses | | | | ☑ | – | Multiplies auth + permission complexity |
| **Live bank aggregation** | | | | ☑ | – | **Deliberately excluded.** It is the single biggest source of Spendee's failures and is not buildable or reliable in 3 days. CSV import is the honest substitute. |
| Investment / net-worth tracking | | | | ☑ | – | Different product surface |

### Final committed scope

- **Must-have flow:** Sign up → onboarding (currency + first wallet + one budget) → quick-add an expense in natural language → AI parses & categorizes it → transaction appears in dashboard with updated donut + budget bar → user corrects one category and the app learns the rule.
- **Two Should-haves:** (1) Duplicate & anomaly review inbox, (2) AI Insights cards with end-of-month forecast.
- **Deliberately parked:** bank aggregation, shared wallets, receipt vision, investments.

---

# PHASE 2 — ARCHITECTURE

## 5.1 Big picture

- **Frontend (Bolt):** React + TypeScript + Vite + Tailwind + shadcn/ui, mobile-first.
- **Backend:** Supabase — Auth (email/password), Postgres with Row Level Security, Edge Functions (Deno) for all AI calls.
- **Data store:** Supabase Postgres. 7 tables (below).
- **External services:** Gemini API (or OpenAI) called *only* from Edge Functions.
- **Ship:** GitHub repo (backup + collab) → Vercel (public URL).

## 5.2 Screens & actions

| Screen | Who | Key actions | Data shown |
|---|---|---|---|
| Auth | Visitor | Sign up, log in | – |
| Onboarding (3 steps) | New user | Pick currency, name first wallet + opening balance, set one monthly budget | Defaults seeded |
| Dashboard (home) | User | Switch month, open quick-add, tap category, dismiss insight | Spent / earned / net, donut by category, budget bars, 5 recent txns, insight cards, duplicate-review banner |
| Quick Add (sticky bar + modal) | User | Type one line → AI parse → confirm/edit → save | Parsed amount, category, date, wallet, confidence chip |
| Transactions | User | Filter by month/category/wallet, search, edit, delete, bulk recategorize | Grouped-by-day list with running daily totals |
| Review Inbox | User | Merge duplicate, keep both, fix flagged anomaly | Side-by-side pairs + reason for the flag |
| Budgets | User | Create/edit/delete budget, see pace vs. days elapsed | Per-category spent/limit, projected end-of-month |
| Insights | User | Generate digest, read cards, dismiss | Top movers, subscription-creep, forecast |
| Settings | User | CRUD categories & wallets, change currency, export CSV, sign out | Profile |

## 5.3 Data model

```
profiles          id (=auth.uid), email, display_name, base_currency, onboarded_at, created_at
wallets           id, user_id, name, type[cash|bank|card|wallet], currency, opening_balance, is_archived, created_at
categories        id, user_id, name, icon, color, kind[expense|income], is_default, created_at
transactions      id, user_id, wallet_id, category_id, amount(numeric 12,2 > 0), kind[expense|income],
                  txn_date(date), merchant, note, source[manual|nl|csv],
                  ai_confidence(numeric 0-1), ai_suggested_category_id, was_corrected(bool),
                  fingerprint(text), duplicate_of_id, status[active|merged|dismissed],
                  created_at, updated_at
budgets           id, user_id, category_id (nullable = overall), period[monthly], amount,
                  start_month(date), alert_threshold(int, default 80), created_at
category_rules    id, user_id, match_text(lower), category_id, hit_count, created_at, updated_at
insights          id, user_id, type[forecast|top_mover|subscription|streak|anomaly], title, body,
                  payload(jsonb), period_start, period_end, is_dismissed, created_at
```

**Rules that matter:**
- RLS on every table: `user_id = auth.uid()`. No exceptions.
- `fingerprint = md5(lower(coalesce(merchant,note,'')) || amount || txn_date || wallet_id)` — used for duplicate detection.
- Amounts always stored positive; direction lives in `kind`. **This is precisely the bug that made Spendee book credit-card payments as income — do not repeat it with signed amounts.**

## 5.4 Edge Functions (all AI lives here)

| Function | Input | Output | Notes |
|---|---|---|---|
| `parse-transaction` | `{ text, today, currency, categories[], wallets[] }` | `{ amount, kind, merchant, category_id, category_confidence, txn_date, note }` | Strict JSON only. Falls back to a regex amount-extractor if the LLM fails. |
| `categorize-batch` | `{ items[] }` | `[{ id, category_id, confidence }]` | Checks `category_rules` first (free + instant), only calls LLM on misses. |
| `detect-duplicates` | `{ user_id, window_days }` | `[{ a_id, b_id, reason, score }]` | Pure SQL/JS — same fingerprint, or same amount ±2 days with similar merchant. No LLM needed. |
| `generate-insights` | `{ user_id, month }` | `insights[]` | Server computes aggregates first, sends **only the summary numbers** to the LLM, never raw rows. |

---

# 🚀 THE MASTER STARTING PROMPT

> Copy everything inside the block below into Bolt.new (or as the task brief in Antigravity) as your **first message**. Connect Supabase in Bolt *before* you send it.

```
Build a mobile-first web app called "ClearSpend" — an AI-powered personal expense
tracker for working professionals in India who manage cash, UPI and card spending.

PRODUCT PROBLEM I AM SOLVING
Working professionals abandon expense trackers because logging every transaction is
too much effort and automatic imports produce untrustworthy data — duplicates, wrong
categories, payments counted as income — leaving them with a ledger they neither
maintain nor believe, and no warning before they overspend.
ClearSpend fixes exactly three things: (1) logging takes one line of text, (2) the
ledger detects and repairs its own bad data, (3) it warns the user before the month
goes wrong, not after.

TECH STACK (use exactly this)
- React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui components + lucide-react icons
- Recharts for charts
- Supabase for auth (email/password), Postgres database, and Edge Functions
- All AI calls go through Supabase Edge Functions. NEVER call an LLM from the browser
  and NEVER expose an API key in frontend code or in VITE_ prefixed env vars.
  Edge Functions read secrets LLM_API_KEY and LLM_PROVIDER ("gemini" | "openai") from
  the Supabase environment. Write the LLM call behind a single helper module
  `callLLM(systemPrompt, userPrompt)` so the provider can be swapped in one place.
  Default provider: gemini, model gemini-2.5-flash, JSON response mode.
- date-fns for all date handling. Store dates as DATE, never as timestamps with tz.

DATABASE SCHEMA (create these tables with Row Level Security enabled on all of them;
every policy must be `user_id = auth.uid()`; generate SQL migrations)

profiles: id uuid PK references auth.users, email text, display_name text,
  base_currency text default 'INR', onboarded_at timestamptz, created_at timestamptz default now()

wallets: id uuid PK, user_id uuid, name text, type text check in
  ('cash','bank','card','wallet'), currency text, opening_balance numeric(12,2) default 0,
  is_archived boolean default false, created_at timestamptz default now()

categories: id uuid PK, user_id uuid, name text, icon text, color text,
  kind text check in ('expense','income'), is_default boolean default false,
  created_at timestamptz default now()

transactions: id uuid PK, user_id uuid, wallet_id uuid references wallets,
  category_id uuid references categories, amount numeric(12,2) not null check (amount > 0),
  kind text check in ('expense','income'), txn_date date not null, merchant text, note text,
  source text check in ('manual','nl','csv') default 'manual',
  ai_confidence numeric, ai_suggested_category_id uuid, was_corrected boolean default false,
  fingerprint text, duplicate_of_id uuid, status text check in
  ('active','merged','dismissed') default 'active',
  created_at timestamptz default now(), updated_at timestamptz default now()

budgets: id uuid PK, user_id uuid, category_id uuid null, period text default 'monthly',
  amount numeric(12,2), start_month date, alert_threshold int default 80,
  created_at timestamptz default now()

category_rules: id uuid PK, user_id uuid, match_text text, category_id uuid,
  hit_count int default 1, created_at timestamptz default now(), updated_at timestamptz default now()

insights: id uuid PK, user_id uuid, type text, title text, body text, payload jsonb,
  period_start date, period_end date, is_dismissed boolean default false,
  created_at timestamptz default now()

CRITICAL DATA RULE: amount is ALWAYS stored as a positive number. Direction is carried
only by the `kind` column ('expense' or 'income'). Never store negative amounts and
never infer direction from sign. A card repayment must never be recorded as income.

On first sign-up, automatically seed for that user:
- one wallet: "Cash", type cash, opening_balance 0
- 10 expense categories: Food & Dining, Groceries, Transport, Shopping, Bills &
  Utilities, Rent, Health, Entertainment, Education, Other
- 2 income categories: Salary, Other Income
Each with a sensible lucide icon name and a distinct hex color.

SCREENS TO BUILD

1) AUTH — email/password sign up and sign in, single clean card, app name and one-line
   value prop. Redirect to onboarding if profiles.onboarded_at is null, else dashboard.

2) ONBOARDING (3 short steps, progress dots)
   Step 1: pick base currency (default INR, symbol ₹).
   Step 2: name your first wallet + opening balance.
   Step 3: set one monthly budget (pick a category + amount) — skippable.
   On finish set profiles.onboarded_at and go to dashboard.

3) DASHBOARD (home) — mobile-first single column
   - Month switcher at top (← October 2026 →), defaults to current month.
   - Three summary stats: Spent, Earned, Net (Net green if positive, red if negative).
   - Recharts donut of expenses by category for the selected month, with a legend
     showing category name, amount, and % — tapping a slice filters Transactions.
   - Budget progress bars: for each budget show spent / limit, % used, and a
     "₹X/day left to stay on track" line. Bar turns amber at the alert_threshold and
     red past 100%.
   - Insight cards carousel (from the insights table, non-dismissed) with a dismiss X.
   - A banner "N transactions need review" if any rows have duplicate_of_id set —
     tapping it opens the Review Inbox.
   - Last 5 transactions.
   - Sticky bottom quick-add bar (see below) that is visible on every screen.

4) QUICK ADD — the signature feature, must feel instant
   - A sticky input at the bottom: placeholder "380 zomato lunch" with a sparkle icon.
   - On submit, call the `parse-transaction` Edge Function with the raw text.
   - Show an optimistic "parsing…" skeleton card, then a confirmation card pre-filled
     with amount, category, wallet, date and merchant. Each field is editable inline.
   - Show a confidence chip next to the category: green "High" (>0.8), amber "Check
     this" (0.5–0.8), grey "Guess" (<0.5). Low-confidence categories are visually
     highlighted so the user knows what to verify.
   - Buttons: Save, or Add details (opens the full form).
   - If the user changes the category before saving, set was_corrected = true and
     upsert a row into category_rules with match_text = lowercased merchant (increment
     hit_count if it exists). Then offer a toast: "Also apply to 4 past transactions
     from zomato?" — tapping it bulk-updates those past transactions.
   - Full manual form (Add details) has: amount, expense/income toggle, category picker,
     wallet picker, date picker (defaults today), merchant, note.

5) TRANSACTIONS — list grouped by day with a day header showing the day's total.
   Filters: month, category, wallet, and a text search. Each row shows category icon,
   merchant/note, wallet chip, amount (expense in red with −, income in green with +).
   Tap a row to edit in a sheet; swipe or a menu to delete with a confirm dialog.
   Multi-select mode allows bulk recategorize. Full create/read/update/delete required.

6) REVIEW INBOX — the trust feature
   Lists pairs of suspected duplicate transactions side by side with the reason
   ("Same amount and merchant within 2 days"). For each pair the user can:
   Merge (keeps the older one, sets the newer to status='merged'), Keep both
   (sets status='active' and clears duplicate_of_id), or Delete one.
   Also lists anomalies: any transaction whose amount is more than 3x the user's
   median for that category, labelled "Unusually large — is this right?"
   Empty state: "Nothing to review. Your ledger is clean." with a check icon.

7) BUDGETS — list of budgets with progress, plus create/edit/delete. When creating,
   suggest an amount based on the user's average spend in that category over the last
   3 months, shown as a hint under the input.

8) INSIGHTS — a "Refresh insights" button calling the `generate-insights` Edge
   Function, and a list of insight cards. Each card has a title, one-sentence body,
   and a relevant icon.

9) SETTINGS — profile, base currency, categories CRUD (add/rename/recolor/delete with
   a reassign-transactions prompt on delete), wallets CRUD, "Export all transactions
   as CSV", and Sign out.

EDGE FUNCTIONS TO CREATE

A) parse-transaction
   Input: { text, today, currency, categories: [{id,name,kind}], wallets: [{id,name}] }
   Step 1: check category_rules for a match_text contained in the input text. If found,
   use that category and set confidence 0.95 WITHOUT calling the LLM.
   Step 2: otherwise call the LLM with this system prompt:
     "You convert one line of informal Indian expense text into structured JSON.
      Today is {today}. Currency is {currency}.
      Available categories: {categories}.
      Rules: amount is always positive. kind is 'expense' unless the text clearly
      indicates money received (salary, refund, credited, received). Interpret Indian
      shorthand: '2k' = 2000, '1.5k' = 1500, 'rs'/'₹'/'inr' are currency markers.
      Resolve relative dates ('yesterday', 'last friday') against today.
      A credit card bill payment or transfer between own accounts is an EXPENSE of
      kind 'expense' with category 'Other' — it is NEVER income.
      Return ONLY valid JSON, no markdown, no prose:
      {amount:number, kind:'expense'|'income', merchant:string, category_id:string,
       category_confidence:number 0-1, txn_date:'YYYY-MM-DD', note:string}"
   Step 3: validate the JSON. If parsing fails or amount is missing, fall back to a
   regex that extracts the first number as the amount, category = 'Other',
   confidence = 0.2. Never throw an unhandled error to the client — always return a
   usable object plus a `degraded: true` flag.

B) detect-duplicates (no LLM — pure logic)
   For the user's last 60 days: flag pair (A,B) if identical fingerprint, OR same
   amount AND txn_date within 2 days AND merchant similarity above 0.8 (use a simple
   normalized Levenshtein). Set the newer row's duplicate_of_id to the older row's id.
   Run this automatically after every transaction insert and after CSV import.

C) generate-insights
   Compute these aggregates in SQL FIRST, then send ONLY the numbers to the LLM —
   never send raw transaction rows:
   - total spend this month vs last month, per category
   - the 3 categories with the largest month-over-month increase
   - merchants charged a similar amount in 3+ consecutive months (subscription-like)
   - projected end-of-month spend = (spend so far / days elapsed) × days in month
   LLM system prompt: "You are a blunt, warm personal finance coach. Given these
   monthly figures, write 3 insight cards. Each: a title under 8 words and a body
   under 25 words. Be specific with numbers. One card MUST be the end-of-month
   forecast and whether they are on track. No generic advice, no moralising, no
   emoji. Return ONLY a JSON array: [{type,title,body}]."
   Insert results into the insights table.

DESIGN DIRECTION
Calm, confident, financial-app feel — not playful, not corporate. Off-white background
(#FAFAF8), near-black text (#18181B), a single deep teal accent (#0F766E), expenses in
#DC2626 and income in #059669. Generous whitespace, rounded-xl cards with a very soft
shadow, Inter font. Numbers are the loudest thing on screen — use tabular-nums and
make the primary figure large. Mobile-first (design at 390px width), but it must remain
usable up to desktop with a max-width container. Include skeleton loaders for all async
states and a friendly empty state for every list. Dark mode is not required.

BUILD ORDER — do this in order and confirm each step works before moving on:
1. Supabase schema + RLS policies + seed-on-signup trigger
2. Auth + onboarding
3. Transactions CRUD + Transactions screen (fully manual, no AI yet)
4. Dashboard with donut and budget bars
5. parse-transaction Edge Function + Quick Add flow + confidence chips
6. category_rules learning + retroactive apply toast
7. detect-duplicates + Review Inbox
8. generate-insights + Insights screen
9. Settings + CSV export

Do not scaffold all nine at once. Build step 1–4 first, make them actually work,
then continue. Handle every failure state gracefully — if an Edge Function fails,
the user must still be able to save the transaction manually.
```

---

## Follow-up prompts (use these one at a time after the first build)

**When the AI parse is flaky:**
```
The parse-transaction function returns unusable output for inputs like "2k rent"
and "paid 450 to uber yesterday". Add a validation layer inside the Edge Function:
after the LLM responds, verify amount is a positive number, kind is one of the two
allowed values, category_id exists in the user's categories, and txn_date is a valid
date not more than 1 year in the past or 1 day in the future. If any check fails,
repair that single field with a deterministic fallback rather than rejecting the whole
result, and return degraded: true so the UI can show "Please check this entry".
```

**When you need the "learning" moment to be visible for the demo:**
```
After a user corrects an AI-suggested category, show a toast: "Learned — I'll file
<merchant> under <category> from now on." If 2 or more past active transactions match
that merchant, add an "Apply to N past" action to the toast that bulk-updates them and
shows a confirmation count. This is the key demo moment, make it feel immediate.
```

**When budget alerts need to be proactive:**
```
On the dashboard, for every budget where projected end-of-month spend (spend so far /
days elapsed x days in month) exceeds the limit, show a prominent amber card above the
fold: "At this pace you'll spend ₹X on <category> — ₹Y over budget. Cap it at ₹Z/day
to stay on track." Compute this client-side from data already loaded, no extra API call.
```

**When mobile layout breaks:**
```
The app must be usable one-handed at 390px width. Move primary actions into thumb
reach, keep the quick-add bar fixed above the safe area inset, ensure no horizontal
scroll anywhere, and make all tap targets at least 44px.
```

---

## Ship it: GitHub → Vercel

**1. GitHub (backup + collab)**
```bash
# In Bolt: click "Export" → Download, or use Bolt's built-in GitHub push.
git init
git add .
git commit -m "ClearSpend MVP: auth, transactions, AI quick-add"
git branch -M main
git remote add origin https://github.com/<you>/clearspend.git
git push -u origin main
```
Team rule: one Code Owner, small commits, only working code on `main`.

**2. Vercel**
- vercel.com → Add New → Project → Import your GitHub repo
- Framework preset: **Vite**. Build command `npm run build`. Output dir `dist`.
- Environment variables (Vercel dashboard → Settings → Environment Variables):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - **Do not add the LLM key here.** It belongs in Supabase: `supabase secrets set LLM_API_KEY=... LLM_PROVIDER=gemini`
- Deploy. Copy the `*.vercel.app` URL.

**3. Supabase config after deploy**
- Auth → URL Configuration → add your Vercel URL to **Site URL** and **Redirect URLs**, or login will silently fail on the live link.
- Deploy Edge Functions: `supabase functions deploy parse-transaction detect-duplicates generate-insights`

**4. Pre-demo checklist**
- [ ] Fresh incognito signup works end-to-end on the live Vercel URL
- [ ] Quick-add works for 5 different phrasings including "2k rent" and "got 50000 salary"
- [ ] A seeded demo account exists with ~40 transactions across 2 months (so the donut, budgets and insights aren't empty)
- [ ] One deliberate duplicate is planted so the Review Inbox has something to show
- [ ] Insights have been generated at least once (don't generate them live if the API is slow)

---

## 3-minute demo script

1. **Problem (20s):** "Everyone downloads an expense app. Almost everyone quits inside a month — because logging is tedious, and when apps auto-import, the data comes back wrong. Spendee users report duplicate transactions and credit card payments logged as income. Once you stop trusting the number, you stop opening the app."
2. **What we built (15s):** "ClearSpend. Three days. One-line logging, a ledger that repairs itself, and warnings before the month goes wrong."
3. **Live (90s):**
   - Type `380 zomato lunch` → parsed, categorized, saved. Then `2k rent yesterday` → note it resolved the date and the shorthand.
   - Correct one category → show the "Learned — applied to 4 past transactions" toast.
   - Open Review Inbox → merge the planted duplicate. *"This is the failure mode that kills competitor apps. We catch it instead of the user."*
   - Dashboard → point at the amber forecast card: *"At this pace you'll be ₹4,200 over on Food."*
4. **Close (15s):** "Next: UPI SMS auto-capture and shared wallets for families. We deliberately skipped bank aggregation — it's what breaks these apps, and we'd rather have a ledger you trust than a feed you don't."

---

## Judge-proofing: three questions you will be asked

| Question | Your answer |
|---|---|
| "Why no bank sync?" | It is the top cause of failure in the incumbents and can't be made reliable in 3 days. We chose a trustworthy ledger over an unreliable feed, and CSV import covers bulk entry. |
| "What stops the LLM getting categories wrong?" | Three layers: a deterministic rule cache checked before the LLM, a confidence score surfaced in the UI so users know what to verify, and every correction becoming a permanent rule. Cost drops and accuracy rises as usage grows. |
| "What's defensible here?" | The `category_rules` table. Every correction makes the model better for that user specifically. Switching cost compounds with use, which no pie-chart app has. |
