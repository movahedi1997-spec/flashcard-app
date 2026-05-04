-- Migration 016 — Bonus AI credits
-- One-time purchasable credits that top up a user's AI generation allowance.
-- Credits are consumed after the monthly quota is exhausted.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ai_credits INT NOT NULL DEFAULT 0;
