-- Migration: Add address and billing fields to users table
-- Date: 2025-12-28

-- Add address and billing fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Italia';

-- Update existing users to have default country if needed
UPDATE users SET country = 'Italia' WHERE country IS NULL;
