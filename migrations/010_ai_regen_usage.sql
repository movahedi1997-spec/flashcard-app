-- Migration 010: AI card improvement usage tracking
CREATE TABLE IF NOT EXISTS ai_regen_usage (
  user_id UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month   TEXT    NOT NULL, -- YYYY-MM
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);
