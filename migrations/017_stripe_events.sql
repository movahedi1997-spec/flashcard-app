-- Migration 017 — Stripe event deduplication
-- Prevents duplicate processing when Stripe retries webhook delivery.
CREATE TABLE IF NOT EXISTS stripe_events (
  event_id     TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
