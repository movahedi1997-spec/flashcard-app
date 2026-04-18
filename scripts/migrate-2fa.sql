-- Migration: Add 2FA / email verification support
-- Run once on the production DB:
--   psql $DATABASE_URL -f scripts/migrate-2fa.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_fa_enabled  BOOLEAN NOT NULL DEFAULT true;

-- All existing users are treated as already-verified (they proved email ownership by logging in)
UPDATE users SET email_verified = true WHERE email_verified = false;

CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code       VARCHAR(6)  NOT NULL,
  purpose    VARCHAR(32) NOT NULL,   -- 'email_verification' | 'login_2fa' | 'disable_2fa'
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS otp_codes_lookup
  ON otp_codes (user_id, purpose, used_at, expires_at);
