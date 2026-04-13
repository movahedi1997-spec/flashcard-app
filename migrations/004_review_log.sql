-- Migration 004: review_log table
-- Stores one row per card review event so the dashboard chart can
-- show per-day/week/month breakdowns by grade.
--
-- srs_state only keeps the LATEST state per card; this table is
-- append-only and powers all historical analytics queries.

CREATE TABLE IF NOT EXISTS review_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id     UUID        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  grade       TEXT        NOT NULL CHECK (grade IN ('again', 'hard', 'good', 'easy')),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast per-user time-range scans (used by /api/stats/reviews)
CREATE INDEX IF NOT EXISTS idx_review_log_user_date
  ON review_log (user_id, reviewed_at DESC);

-- Fast per-card history lookups
CREATE INDEX IF NOT EXISTS idx_review_log_card_id
  ON review_log (card_id);
