-- ClearSpend Schema Extensions & Automation
-- Migration: 20260822000001_mvp_extensions.sql

-- 1. Extend Profiles Table with AI Consent, Locale, and Theme Preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_consent TEXT DEFAULT 'none' CHECK (ai_consent IN ('none', 'cloud'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en' CHECK (locale IN ('en', 'te', 'hi'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system'));

-- 2. Create Recurring Subscriptions / Register Table
CREATE TABLE IF NOT EXISTS public.recurring_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'yearly', 'weekly')),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_charged_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recurring_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recurring items"
  ON public.recurring_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_user_active ON public.recurring_items(user_id, is_active);

-- 3. Create Goals Table (Wealth Reservation Engine)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE NOT NULL,
  category TEXT,
  icon TEXT,
  color TEXT,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  monthly_contribution NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);

-- 4. Automatic User Profile & Category Provisioning Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert base profile
  INSERT INTO public.profiles (id, email, display_name, base_currency, ai_consent, locale, theme, onboarded_at, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'INR',
    'none',
    'en',
    'dark',
    NULL,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Seed Default Expense Categories
  INSERT INTO public.categories (user_id, name, icon, color, kind, is_default, created_at)
  VALUES
    (NEW.id, 'Food & Dining', 'Utensils', '#F97316', 'expense', true, NOW()),
    (NEW.id, 'Groceries', 'ShoppingBag', '#10B981', 'expense', true, NOW()),
    (NEW.id, 'Transport', 'Car', '#3B82F6', 'expense', true, NOW()),
    (NEW.id, 'Bills & Utilities', 'Receipt', '#EF4444', 'expense', true, NOW()),
    (NEW.id, 'Entertainment', 'Tv', '#8B5CF6', 'expense', true, NOW()),
    (NEW.id, 'Shopping', 'Shirt', '#EC4899', 'expense', true, NOW()),
    (NEW.id, 'Healthcare', 'HeartPulse', '#14B8A6', 'expense', true, NOW()),
    (NEW.id, 'Housing & Rent', 'Home', '#6366F1', 'expense', true, NOW()),
    (NEW.id, 'Personal Care', 'Sparkles', '#F59E0B', 'expense', true, NOW()),
    (NEW.id, 'Travel', 'Plane', '#06B6D4', 'expense', true, NOW()),
    (NEW.id, 'Subscriptions', 'Repeat', '#A855F7', 'expense', true, NOW()),
    (NEW.id, 'Education', 'GraduationCap', '#84CC16', 'expense', true, NOW()),
    (NEW.id, 'Other Expense', 'MoreHorizontal', '#64748B', 'expense', true, NOW()),
    -- Income Categories
    (NEW.id, 'Salary', 'Briefcase', '#10B981', 'income', true, NOW()),
    (NEW.id, 'Freelance', 'Laptop', '#3B82F6', 'income', true, NOW()),
    (NEW.id, 'Investments & Dividends', 'TrendingUp', '#8B5CF6', 'income', true, NOW()),
    (NEW.id, 'Refunds & Cashback', 'RotateCcw', '#F59E0B', 'income', true, NOW()),
    (NEW.id, 'Other Income', 'PlusCircle', '#64748B', 'income', true, NOW())
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Realtime Publication Sync Enablement
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
