-- Migration 005: deck appearance fields
-- Allows users to personalise each deck with a colour palette and emoji icon.

ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'indigo',
  ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '📚';
