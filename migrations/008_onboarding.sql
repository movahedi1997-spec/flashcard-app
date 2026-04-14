-- Migration 008: Onboarding subject preference + copy tracking on decks

-- User subject preference (set during onboarding)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subject_preference TEXT
    CHECK (subject_preference IN ('medicine', 'pharmacy', 'chemistry', 'other'));

-- Note: copied_from_id and copy_count were added in migration 006_explore_phase2.sql
-- No duplicate column additions needed here.

-- Onboarding completion flag (optional analytics)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
