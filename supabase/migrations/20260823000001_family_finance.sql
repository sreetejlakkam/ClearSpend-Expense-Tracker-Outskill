-- ClearSpend Schema Migration: Family Finance AI & Shared Household Planning
-- Migration: 20260823000001_family_finance.sql

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE household_role AS ENUM ('owner', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE member_status AS ENUM ('invited', 'active', 'left', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE txn_visibility AS ENUM ('private', 'amount_only', 'shared');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Core Household Tables
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_currency TEXT NOT NULL DEFAULT 'INR',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'family_premium')),
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role household_role NOT NULL DEFAULT 'member',
  status member_status NOT NULL DEFAULT 'active',
  display_name TEXT NOT NULL,
  share_summary BOOLEAN NOT NULL DEFAULT true,   -- Layer A (Total income, expense, savings)
  share_categories BOOLEAN NOT NULL DEFAULT false,  -- Layer A extended (Category totals without merchants)
  contribution_share NUMERIC(5,2),                    -- null = auto (income-proportional)
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE (household_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.household_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status invite_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Joint Envelopes: rent, groceries, utilities, kids
CREATE TABLE IF NOT EXISTS public.household_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  period TEXT NOT NULL DEFAULT 'monthly',
  start_month DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Joint Goals: vacation, down payment, emergency fund
CREATE TABLE IF NOT EXISTS public.household_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  saved_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  target_date DATE,
  expected_return_pct NUMERIC(5,2) NOT NULL DEFAULT 12.0,
  icon TEXT DEFAULT 'Target',
  color TEXT DEFAULT '#0F766E',
  is_achieved BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-member monthly contribution to each goal
CREATE TABLE IF NOT EXISTS public.household_goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.household_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE (goal_id, user_id)
);

-- Append-only audit of every privacy-relevant action
CREATE TABLE IF NOT EXISTS public.household_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,  -- 'member_joined','member_left','visibility_changed','summary_sharing_off','goal_created','plan_upgraded'
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entitlements Table for Premium Plan Gating
CREATE TABLE IF NOT EXISTS public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  source TEXT NOT NULL CHECK (source IN ('trial', 'purchase', 'promo', 'demo')),
  CHECK (household_id IS NOT NULL OR user_id IS NOT NULL)
);

-- 3. Alter Existing Tables
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility txn_visibility NOT NULL DEFAULT 'private';

ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS default_visibility txn_visibility NOT NULL DEFAULT 'private';

CREATE INDEX IF NOT EXISTS idx_transactions_household ON public.transactions(household_id, txn_date DESC) WHERE household_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_household_members_user ON public.household_members(user_id) WHERE status = 'active';

-- 4. Non-Recursive Security Definer Helper Functions
CREATE OR REPLACE FUNCTION public.is_household_member(h_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = h_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.my_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT household_id FROM public.household_members
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

-- 5. Row Level Security Policies

-- Households
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hh_select ON public.households;
CREATE POLICY hh_select ON public.households FOR SELECT
  USING (public.is_household_member(id));

DROP POLICY IF EXISTS hh_insert ON public.households;
CREATE POLICY hh_insert ON public.households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS hh_update ON public.households;
CREATE POLICY hh_update ON public.households FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.household_members m
    WHERE m.household_id = public.households.id
      AND m.user_id = auth.uid()
      AND m.role = 'owner'
      AND m.status = 'active'
  ));

-- Household Members
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hm_select ON public.household_members;
CREATE POLICY hm_select ON public.household_members FOR SELECT
  USING (public.is_household_member(household_id));

DROP POLICY IF EXISTS hm_update_self ON public.household_members;
CREATE POLICY hm_update_self ON public.household_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Household Invites
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hi_select ON public.household_invites;
CREATE POLICY hi_select ON public.household_invites FOR SELECT
  USING (public.is_household_member(household_id) OR invited_email = auth.email());

DROP POLICY IF EXISTS hi_insert ON public.household_invites;
CREATE POLICY hi_insert ON public.household_invites FOR INSERT
  WITH CHECK (public.is_household_member(household_id));

-- Household Budgets & Goals
ALTER TABLE public.household_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hb_all ON public.household_budgets;
CREATE POLICY hb_all ON public.household_budgets FOR ALL
  USING (public.is_household_member(household_id))
  WITH CHECK (public.is_household_member(household_id));

ALTER TABLE public.household_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hg_all ON public.household_goals;
CREATE POLICY hg_all ON public.household_goals FOR ALL
  USING (public.is_household_member(household_id))
  WITH CHECK (public.is_household_member(household_id));

ALTER TABLE public.household_goal_contributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hgc_all ON public.household_goal_contributions;
CREATE POLICY hgc_all ON public.household_goal_contributions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.household_goals g
    WHERE g.id = goal_id AND public.is_household_member(g.household_id)
  ))
  WITH CHECK (user_id = auth.uid());

-- Audit Log
ALTER TABLE public.household_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS hal_select ON public.household_audit_log;
CREATE POLICY hal_select ON public.household_audit_log FOR SELECT
  USING (public.is_household_member(household_id));

DROP POLICY IF EXISTS hal_insert ON public.household_audit_log;
CREATE POLICY hal_insert ON public.household_audit_log FOR INSERT
  WITH CHECK (public.is_household_member(household_id));

-- Entitlements
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ent_select ON public.entitlements;
CREATE POLICY ent_select ON public.entitlements FOR SELECT
  USING (user_id = auth.uid() OR (household_id IS NOT NULL AND public.is_household_member(household_id)));

-- Transactions Multi-Tenant RLS Policy
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions or shared household" ON public.transactions;
DROP POLICY IF EXISTS txn_select ON public.transactions;
CREATE POLICY txn_select ON public.transactions FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      household_id IS NOT NULL
      AND visibility IN ('amount_only', 'shared')
      AND public.is_household_member(household_id)
    )
  );

-- 6. Column-Masked View: household_ledger
CREATE OR REPLACE VIEW public.household_ledger
WITH (security_invoker = on) AS
SELECT
  t.id,
  t.household_id,
  t.user_id,
  t.amount,
  t.kind,
  t.txn_date,
  t.category_id,
  t.wallet_id,
  t.visibility,
  CASE
    WHEN t.user_id = auth.uid() OR t.visibility = 'shared' THEN t.merchant
    ELSE 'Shared Expense'
  END AS merchant,
  CASE
    WHEN t.user_id = auth.uid() OR t.visibility = 'shared' THEN t.note
    ELSE NULL
  END AS note
FROM public.transactions t
WHERE t.household_id IS NOT NULL;

-- 7. Privacy-Preserving Aggregate Function (Layer A)
CREATE OR REPLACE FUNCTION public.household_monthly_summary(
  h_id UUID,
  month_start DATE
) RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  total_income NUMERIC,
  total_expense NUMERIC,
  net_savings NUMERIC,
  is_estimated BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_household_member(h_id) THEN
    RAISE EXCEPTION 'not a member of this household';
  END IF;

  RETURN QUERY
  SELECT
    m.user_id,
    m.display_name,
    CASE WHEN m.share_summary THEN COALESCE(SUM(t.amount) FILTER (WHERE t.kind = 'income'), 0) ELSE NULL END,
    CASE WHEN m.share_summary THEN COALESCE(SUM(t.amount) FILTER (WHERE t.kind = 'expense'), 0) ELSE NULL END,
    CASE WHEN m.share_summary THEN
      COALESCE(SUM(t.amount) FILTER (WHERE t.kind = 'income'), 0)
      - COALESCE(SUM(t.amount) FILTER (WHERE t.kind = 'expense'), 0)
    ELSE NULL END,
    NOT m.share_summary AS is_estimated
  FROM public.household_members m
  LEFT JOIN public.transactions t
    ON t.user_id = m.user_id
   AND t.status = 'active'
   AND t.txn_date >= month_start
   AND t.txn_date < (month_start + INTERVAL '1 month')
  WHERE m.household_id = h_id AND m.status = 'active'
  GROUP BY m.user_id, m.display_name, m.share_summary;
END; $$;
