-- ============================================================
-- FIX: handle_new_user trigger — use UPSERT to prevent
-- "Database error saving new user" on re-registration.
--
-- Run this in Supabase SQL Editor if you see that error.
-- ============================================================

-- Step 1: Clean up any orphaned public.users records whose
--         corresponding auth.users row has already been deleted.
DELETE FROM public.users
WHERE id NOT IN (
  SELECT id FROM auth.users
);

-- Step 2: Recreate the trigger function using ON CONFLICT DO NOTHING
--         so it never fails even if a row already exists.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Step 3: Re-attach the trigger (no-op if it already exists with this name)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
