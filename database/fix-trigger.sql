-- ============================================================
-- AI Tools Hub — Auth trigger fixes
-- Run this once in Supabase SQL Editor.
-- ============================================================

-- ── Step 1: Clean up orphaned public.users rows ──────────────
DELETE FROM public.users
WHERE id NOT IN (SELECT id FROM auth.users);

-- ── Step 2: handle_new_user — UPSERT on registration ─────────
-- Uses ON CONFLICT DO UPDATE so re-registration after deletion works.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Step 3: handle_delete_user — cascade on auth.users DELETE ─
-- Fires BEFORE DELETE on auth.users (via Dashboard or admin API).
-- Clears all related data so no orphaned rows remain.
CREATE OR REPLACE FUNCTION public.handle_delete_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.subscriptions        WHERE user_id = OLD.id;
  DELETE FROM public.referrals            WHERE referrer_id = OLD.id
                                             OR referred_user_id = OLD.id;
  DELETE FROM public.referral_rewards     WHERE user_id = OLD.id;
  DELETE FROM public.usage_logs           WHERE user_id = OLD.id;
  DELETE FROM public.analytics_events     WHERE user_id = OLD.id;
  DELETE FROM public.leads                WHERE user_id = OLD.id;
  DELETE FROM public.affiliate_commissions WHERE user_id = OLD.id;
  DELETE FROM public.feature_votes        WHERE user_id = OLD.id;
  DELETE FROM public.usage_events         WHERE user_id = OLD.id;
  DELETE FROM public.generated_examples   WHERE user_id = OLD.id;
  DELETE FROM public.users                WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_delete_user();
