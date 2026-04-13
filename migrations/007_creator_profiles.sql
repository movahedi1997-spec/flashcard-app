-- ============================================================
-- Migration: 007_creator_profiles.sql
-- Creator profile columns on users table
-- Date: 2026-04-13
-- ============================================================

-- Username — unique slug for /creators/[username] URLs
-- Defaults to NULL (users who haven't set one yet)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username    TEXT UNIQUE;

-- Vanity bio shown on profile page
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio         TEXT;

-- Avatar URL (CDN/object storage URL; file upload handled client-side to R2/S3)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT;

-- Unique index for case-insensitive username lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
  ON users (LOWER(username))
  WHERE username IS NOT NULL;
