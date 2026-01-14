-- ============================================================================
-- CHECK DATABASE STATUS
-- Run this to see what's in your database
-- ============================================================================

-- 1. Check if subscription columns exist
\echo '📋 Checking subscription columns...'
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
AND column_name LIKE 'subscription%'
ORDER BY column_name;

\echo ''
\echo '🏢 Organization 1 details:'

-- 2. Check organization 1
SELECT id, name, status, subscription_active, subscription_type, subscription_started_at
FROM organizations
WHERE id = 1;

\echo ''
\echo '📊 All organizations:'

-- 3. Check all organizations
SELECT id, name, subscription_active, subscription_type
FROM organizations
ORDER BY id;

\echo ''
\echo '📈 Summary stats:'

-- 4. Count by status
SELECT
  COUNT(*) as total_orgs,
  COUNT(*) FILTER (WHERE subscription_active = TRUE) as active_subscriptions,
  COUNT(*) FILTER (WHERE subscription_active = FALSE OR subscription_active IS NULL) as inactive_subscriptions
FROM organizations;
