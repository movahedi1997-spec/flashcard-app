-- ============================================================
-- FlashCard App — Refresh Token Store
-- Migration: 002_refresh_tokens.sql
-- Date: 2026-04-12
-- Author: [BACKEND] TASK-005
--
-- Supports refresh token rotation:
--   • Each refresh token is stored as a JWT ID (jti) — never the raw token.
--   • On every /api/auth/refresh call the old jti is revoked and a new one inserted.
--   • Revoked tokens are kept for 30 days for audit logging, then prunable.
--   • Cascade on users(id) means account deletion auto-cleans all sessions.
-- ============================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- JWT ID claim — the only identifier stored; the actual token is never persisted.
  jti        TEXT         NOT NULL UNIQUE,

  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Mirrors the exp claim in the JWT; used for DB-side expiry queries.
  expires_at TIMESTAMPTZ  NOT NULL,

  -- Set to true immediately when the token is rotated or the user logs out.
  -- A revoked jti that is presented again indicates token theft → invalidate all sessions.
  revoked    BOOLEAN      NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Fast revocation check on every /api/auth/refresh request
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti
  ON refresh_tokens (jti);

-- Bulk revocation on logout-all-devices
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
  ON refresh_tokens (user_id);

-- Prune helper: find all expired or revoked tokens older than 30 days
-- (Run via a scheduled maintenance query — not automated in this migration)
-- DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '30 days';
