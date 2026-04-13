-- ============================================================
-- Migration: 006_explore_phase2.sql
-- Phase 2 — Explore page supporting columns
-- Date: 2026-04-13
-- ============================================================

-- Track which public deck a user's copy was made from.
-- Enables: "already copied" check, analytics on popular decks,
-- and future "this deck was updated" notifications.
ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS copied_from_id UUID REFERENCES decks(id) ON DELETE SET NULL;

-- Index for "find all copies of a public deck" (explore page stats)
CREATE INDEX IF NOT EXISTS idx_decks_copied_from
  ON decks (copied_from_id)
  WHERE copied_from_id IS NOT NULL;

-- Verified creator badge — set manually by admins for high-quality deck authors
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_verified_creator BOOLEAN NOT NULL DEFAULT false;

-- Copy count cache on decks (denormalised for fast explore feed sorting).
-- Updated by the copy endpoint. Not authoritative — used for display only.
ALTER TABLE decks
  ADD COLUMN IF NOT EXISTS copy_count INTEGER NOT NULL DEFAULT 0;

-- Index to sort explore feed by popularity (copy_count DESC)
CREATE INDEX IF NOT EXISTS idx_decks_copy_count
  ON decks (copy_count DESC)
  WHERE is_public = true;
