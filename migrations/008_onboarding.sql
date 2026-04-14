-- Migration 008: Onboarding subject preference + copy tracking on decks

-- User subject preference (set during onboarding)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subject_preference TEXT
    CHECK (subject_preference IN ('medicine', 'pharmacy', 'chemistry', 'other'));

-- Track which deck a copy originated from
ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS copied_from UUID REFERENCES decks(id) ON DELETE SET NULL;

-- Copy count on source decks (for explore ordering)
-- Note: copy_count may already exist from migration 006; guard with IF NOT EXISTS
ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS copy_count INTEGER DEFAULT 0 NOT NULL;

-- Onboarding completion flag (optional analytics)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
