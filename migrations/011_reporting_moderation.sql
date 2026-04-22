-- Migration 011: Reporting & Moderation System
-- Covers: EU DSA Art. 16/17, NetzDG (Germany), UK Online Safety Act, CASL

-- ── User identity & compliance data ──────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS registration_ip  TEXT,
  ADD COLUMN IF NOT EXISTS last_known_ip    TEXT,
  ADD COLUMN IF NOT EXISTS phone_number     TEXT,
  ADD COLUMN IF NOT EXISTS is_banned        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ban_reason       TEXT;

-- ── Deck reports (user-submitted) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deck_reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id     UUID        NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  reporter_id UUID        REFERENCES users(id) ON DELETE SET NULL,
  reason      TEXT        NOT NULL CHECK (reason IN (
                'illegal_content',
                'copyright',
                'hate_speech',
                'misinformation',
                'spam',
                'violence',
                'other'
              )),
  details     TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed','removed')),
  reviewed_by TEXT,        -- admin username
  reviewed_at TIMESTAMPTZ,
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deck_reports_status    ON deck_reports(status);
CREATE INDEX IF NOT EXISTS idx_deck_reports_deck_id   ON deck_reports(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_reports_reporter  ON deck_reports(reporter_id);

-- ── User warnings ─────────────────────────────────────────────────────────────
-- Based on EU DSA Art. 23: platforms must warn repeat offenders
CREATE TABLE IF NOT EXISTS user_warnings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_by   TEXT        NOT NULL,   -- admin username
  reason      TEXT        NOT NULL,
  severity    TEXT        NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high')),
  report_id   UUID        REFERENCES deck_reports(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_created ON user_warnings(created_at);

-- ── Ban log (audit trail) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_ban_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      TEXT        NOT NULL CHECK (action IN ('ban','unban')),
  issued_by   TEXT        NOT NULL,
  reason      TEXT,
  ip_at_time  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_ban_log_user_id ON user_ban_log(user_id);
