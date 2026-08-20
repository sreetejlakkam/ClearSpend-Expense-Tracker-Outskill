-- ClearSpend Database Schema Migration
-- Enables Row Level Security (RLS) on all tables with user_id = auth.uid()

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  base_currency TEXT DEFAULT 'INR',
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'card', 'wallet')),
  currency TEXT NOT NULL DEFAULT 'INR',
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wallets"
  ON public.wallets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
  txn_date DATE NOT NULL,
  merchant TEXT,
  note TEXT,
  source TEXT NOT NULL CHECK (source IN ('manual', 'nl', 'csv')) DEFAULT 'manual',
  ai_confidence NUMERIC(3,2),
  ai_suggested_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  was_corrected BOOLEAN DEFAULT false,
  fingerprint TEXT,
  duplicate_of_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'merged', 'dismissed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  period TEXT NOT NULL DEFAULT 'monthly',
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  start_month DATE NOT NULL,
  alert_threshold INT NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budgets"
  ON public.budgets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Category Rules Table (for self-learning rules from user corrections)
CREATE TABLE IF NOT EXISTS public.category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_text TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  hit_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_text)
);

ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own category rules"
  ON public.category_rules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Insights Table
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'forecast', 'top_mover', 'subscription', 'streak', 'anomaly'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  period_start DATE,
  period_end DATE,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own insights"
  ON public.insights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: Automatically seed default data on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_seed()
RETURNS TRIGGER AS $$
DECLARE
  v_cash_wallet_id UUID;
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (id, email, display_name, base_currency)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'INR'
  );

  -- 2. Seed Default Cash Wallet
  INSERT INTO public.wallets (user_id, name, type, currency, opening_balance)
  VALUES (NEW.id, 'Cash', 'cash', 'INR', 0)
  RETURNING id INTO v_cash_wallet_id;

  -- 3. Seed 10 Default Expense Categories
  INSERT INTO public.categories (user_id, name, icon, color, kind, is_default) VALUES
    (NEW.id, 'Food & Dining', 'Utensils', '#F97316', 'expense', true),
    (NEW.id, 'Groceries', 'ShoppingCart', '#10B981', 'expense', true),
    (NEW.id, 'Transport', 'Car', '#3B82F6', 'expense', true),
    (NEW.id, 'Shopping', 'ShoppingBag', '#EC4899', 'expense', true),
    (NEW.id, 'Bills & Utilities', 'Zap', '#EAB308', 'expense', true),
    (NEW.id, 'Rent', 'Home', '#6366F1', 'expense', true),
    (NEW.id, 'Health', 'HeartPulse', '#EF4444', 'expense', true),
    (NEW.id, 'Entertainment', 'Film', '#8B5CF6', 'expense', true),
    (NEW.id, 'Education', 'GraduationCap', '#14B8A6', 'expense', true),
    (NEW.id, 'Other', 'MoreHorizontal', '#64748B', 'expense', true);

  -- 4. Seed 2 Default Income Categories
  INSERT INTO public.categories (user_id, name, icon, color, kind, is_default) VALUES
    (NEW.id, 'Salary', 'Briefcase', '#059669', 'income', true),
    (NEW.id, 'Other Income', 'ArrowDownToLine', '#0D9488', 'income', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_seed();
