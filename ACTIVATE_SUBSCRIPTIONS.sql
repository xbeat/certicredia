-- Activate subscriptions for all demo organizations
-- This fixes the 402 Payment Required error

UPDATE organizations
SET
  subscription_active = TRUE,
  subscription_type = 'lifetime',
  subscription_started_at = CURRENT_TIMESTAMP,
  subscription_expires_at = NULL
WHERE subscription_active = FALSE OR subscription_active IS NULL;

-- Verify the update
SELECT id, name, subscription_active, subscription_type, subscription_started_at
FROM organizations
ORDER BY id;
