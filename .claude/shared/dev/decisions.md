# Dev Decisions Log
# Development Team | .claude/shared/dev/decisions.md

---

## [BACKEND] TASK-002 — PostgreSQL Schema Design
**Date:** 2026-04-12
**Status:** Approved — TASK-003 may proceed

### Decision: PostgreSQL via pg (node-postgres), raw SQL migrations, custom JWT auth

Supabase Auth evaluated and rejected for Phase 1 to avoid vendor lock-in. Custom JWT
(HTTP-only cookie, jose library) used. Supabase can be layered as a pooler later.

---

### TABLE: users
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid()
  name           TEXT         NOT NULL
  email          TEXT         UNIQUE NOT NULL
  password_hash  TEXT         NOT NULL
  is_pro         BOOLEAN      NOT NULL DEFAULT false
  subject        TEXT         CHECK IN (medicine, pharmacy, chemistry, other)
  coppa_verified BOOLEAN      NOT NULL DEFAULT false
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()

  Index: idx_users_email (email)

### TABLE: decks  (client legacy name: "boxes")
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid()
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE
  title       TEXT         NOT NULL
  description TEXT         NOT NULL DEFAULT ''
  is_public   BOOLEAN      NOT NULL DEFAULT false
  slug        TEXT         UNIQUE nullable  -- set when made public
  subject     TEXT         CHECK IN (medicine, pharmacy, chemistry, other)
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()

  Indexes: idx_decks_user_id, idx_decks_slug (WHERE NOT NULL),
           idx_decks_is_public (WHERE true), idx_decks_subject

### TABLE: cards
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid()
  deck_id         UUID         NOT NULL REFERENCES decks(id) ON DELETE CASCADE
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE
  front           TEXT         NOT NULL
  back            TEXT         NOT NULL
  front_image_url TEXT         nullable
  back_image_url  TEXT         nullable
  ai_generated    BOOLEAN      NOT NULL DEFAULT false
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()

  Indexes: idx_cards_deck_id, idx_cards_user_id

### TABLE: srs_state  (lazy-populated, one row per card*user)
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid()
  card_id          UUID         NOT NULL REFERENCES cards(id) ON DELETE CASCADE
  user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE
  interval         INTEGER      NOT NULL DEFAULT 1  -- days
  ease_factor      FLOAT        NOT NULL DEFAULT 2.5
  due_date         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  review_count     INTEGER      NOT NULL DEFAULT 0
  last_grade       TEXT         CHECK IN (again, hard, good, easy)
  last_reviewed_at TIMESTAMPTZ  nullable
  UNIQUE(card_id, user_id)

  Indexes: idx_srs_user_due (user_id, due_date), idx_srs_card_id

### TABLE: ai_usage  (monthly AI quota tracking)
  id              UUID     PRIMARY KEY DEFAULT gen_random_uuid()
  user_id         UUID     NOT NULL REFERENCES users(id) ON DELETE CASCADE
  month           TEXT     NOT NULL  -- YYYY-MM
  cards_generated INTEGER  NOT NULL DEFAULT 0
  UNIQUE(user_id, month)

  Index: idx_ai_usage_user_month (user_id, month)

### GDPR Cascade on account delete:
  users -> decks -> cards -> srs_state  (all CASCADE)
  users -> srs_state, ai_usage          (direct CASCADE)

### Migration file: migrations/001_initial_schema.sql
### New packages: pg, @types/pg, bcryptjs, @types/bcryptjs

---

## [BACKEND] TASK-003 — Express to Next.js API Routes Migration
**Date:** 2026-04-12
**Status:** Complete

### Decision: Replace server/ Express app with Next.js 14 Route Handlers

Routes run in Node.js runtime. jose (installed) for JWT, bcryptjs for hashing, pg for DB.

### New route map
  POST /api/auth/register          app/api/auth/register/route.ts
  POST /api/auth/login             app/api/auth/login/route.ts
  POST /api/auth/logout            app/api/auth/logout/route.ts
  GET  /api/auth/me                app/api/auth/me/route.ts
  GET  POST /api/decks             app/api/decks/route.ts
  GET  PATCH DELETE /api/decks/[id]            app/api/decks/[id]/route.ts
  GET /api/decks/[id]/cards        app/api/decks/[id]/cards/route.ts
  POST /api/cards                  app/api/cards/route.ts
  GET  PATCH DELETE /api/cards/[id]            app/api/cards/[id]/route.ts

### Shared utilities
  lib/db.ts    — pg Pool singleton + typed query() helper
  lib/auth.ts  — signToken, verifyToken, getAuthUser, COOKIE_OPTIONS

### localStorage removed from
  hooks/useBoxes.ts  — now calls /api/decks (async, optimistic UI)
  hooks/useCards.ts  — now calls /api/decks/[id]/cards and /api/cards

### Pending (TASK-006 Frontend)
  components/flashcard/* still use synchronous callback signatures.
  Frontend must update BoxList, CardList, StudySession for async hooks.

### Files queued for deletion after TASK-010 QA sign-off
  server/                  (entire Express app)
  server/data/users.json   (flat-file DB)
  lib/flashcard/storage.ts (localStorage layer)

---
