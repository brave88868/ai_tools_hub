-- fix-subscription-sync.sql
-- Run this in Supabase SQL Editor to repair plan/subscription data inconsistencies.
-- Safe to run multiple times (idempotent).

-- 1. Set plan='pro' for users who have at least one active subscription
UPDATE users
SET plan = 'pro'
WHERE id IN (
  SELECT DISTINCT user_id
  FROM subscriptions
  WHERE status IN ('active', 'canceling')
)
AND plan != 'pro';

-- 2. Set plan='free' for users with no active/canceling subscriptions
--    (skip users who have role='pro' or 'admin' — they may have been manually elevated)
UPDATE users
SET plan = 'free'
WHERE id NOT IN (
  SELECT DISTINCT user_id
  FROM subscriptions
  WHERE status IN ('active', 'canceling')
)
AND role NOT IN ('pro', 'admin')
AND plan != 'free';

-- 3. Verify: report counts after fix
SELECT 'active_subscriptions'          AS metric, COUNT(*)::TEXT AS value FROM subscriptions WHERE status = 'active'
UNION ALL
SELECT 'canceling_subscriptions',      COUNT(*)::TEXT FROM subscriptions WHERE status = 'canceling'
UNION ALL
SELECT 'users_plan_pro',               COUNT(*)::TEXT FROM users WHERE plan = 'pro'
UNION ALL
SELECT 'users_plan_free',              COUNT(*)::TEXT FROM users WHERE plan = 'free'
UNION ALL
SELECT 'pro_users_without_active_sub', COUNT(*)::TEXT
FROM users u
WHERE u.plan = 'pro'
  AND u.role NOT IN ('pro', 'admin')
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = u.id AND s.status IN ('active', 'canceling')
  );
