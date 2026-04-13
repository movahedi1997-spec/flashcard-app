-- Migration 003: audit_log table
-- GDPR Article 17 requires demonstrable proof of erasure.
-- This table stores durable, pre-deletion audit records for account deletions
-- and other compliance events that must survive process restarts.

CREATE TABLE IF NOT EXISTS audit_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event      TEXT        NOT NULL,          -- e.g. 'gdpr.account_deletion'
  user_id    UUID,                          -- nullable: user is deleted after this write
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query by user for compliance lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id
  ON audit_log (user_id)
  WHERE user_id IS NOT NULL;

-- Query by event type for ops dashboards
CREATE INDEX IF NOT EXISTS idx_audit_log_event ON audit_log (event);

-- Time-range queries for retention / export
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at);
