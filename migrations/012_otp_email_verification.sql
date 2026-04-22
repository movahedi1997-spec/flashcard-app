-- ============================================================
-- FlashCard App — OTP Email Verification & 2FA
-- Migration: 012_otp_email_verification.sql
-- Date: 2026-04-22
-- Author: [BACKEND]
-- ============================================================

-- Add email verification and 2FA columns to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN NOT NULL DEFAULT false;

-- ── OTP codes ────────────────────────────────────────────────────────────────
-- Stores 6-digit codes for email verification and 2FA login.
-- Codes expire after 10 minutes; used_at is set on consumption.
CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code       TEXT        NOT NULL,
  purpose    TEXT        NOT NULL CHECK (purpose IN ('email_verification', 'login_2fa', 'disable_2fa')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_user_purpose ON otp_codes(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_codes_created      ON otp_codes(created_at);
