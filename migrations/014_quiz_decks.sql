-- Migration 014: Quiz Decks — fully separate from flashcard decks

CREATE TABLE IF NOT EXISTS quiz_decks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  color       TEXT        NOT NULL DEFAULT 'indigo',
  emoji       TEXT        NOT NULL DEFAULT '🧠',
  is_public   BOOLEAN     NOT NULL DEFAULT false,
  slug        TEXT        UNIQUE,
  subject     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_decks_user_id   ON quiz_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_decks_is_public ON quiz_decks(is_public);
CREATE INDEX IF NOT EXISTS idx_quiz_decks_subject   ON quiz_decks(subject);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_deck_id   UUID        NOT NULL REFERENCES quiz_decks(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_text  TEXT        NOT NULL,
  correct_answer TEXT        NOT NULL,
  option_a       TEXT        NOT NULL,
  option_b       TEXT        NOT NULL,
  explanation    TEXT,
  ai_generated   BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_deck   ON quiz_questions(quiz_deck_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_user   ON quiz_questions(user_id);

CREATE TABLE IF NOT EXISTS quiz_srs_state (
  question_id   UUID        NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interval      INTEGER     NOT NULL DEFAULT 0,
  ease_factor   NUMERIC     NOT NULL DEFAULT 2.5,
  due_date      TIMESTAMPTZ,
  review_count  INTEGER     NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  PRIMARY KEY (question_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_srs_user_due ON quiz_srs_state(user_id, due_date);

CREATE TABLE IF NOT EXISTS quiz_review_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID        NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  correct       BOOLEAN     NOT NULL,
  reviewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_review_log_user ON quiz_review_log(user_id, reviewed_at);
