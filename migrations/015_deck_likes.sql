-- Migration 015: Explore deck likes

CREATE TABLE IF NOT EXISTS explore_deck_likes (
  user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deck_id   UUID        NOT NULL,
  liked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, deck_id)
);

CREATE INDEX IF NOT EXISTS idx_explore_likes_user ON explore_deck_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_explore_likes_deck ON explore_deck_likes(deck_id);
