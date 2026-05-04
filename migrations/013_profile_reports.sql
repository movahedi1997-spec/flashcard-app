-- Migration 013: Profile reports & account suspension

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS suspended_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspend_reason   TEXT;

CREATE TABLE IF NOT EXISTS profile_reports (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_id      UUID        REFERENCES users(id) ON DELETE SET NULL,
  reason           TEXT        NOT NULL CHECK (reason IN (
                     'spam', 'harassment', 'inappropriate', 'impersonation', 'other'
                   )),
  description      TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN (
                     'pending', 'dismissed', 'warned', 'suspended', 'banned'
                   )),
  reviewed_by      TEXT,
  reviewed_at      TIMESTAMPTZ,
  admin_note       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_reports_status   ON profile_reports(status);
CREATE INDEX IF NOT EXISTS idx_profile_reports_reported ON profile_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_reports_reporter ON profile_reports(reporter_id);
