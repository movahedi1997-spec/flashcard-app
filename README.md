# FlashcardAI

AI-powered spaced repetition flashcard app built with Next.js 14, PostgreSQL, and the SM-2 algorithm.

## Features

- **Spaced repetition (SRS)** — SM-2 scheduling with Again / Hard / Good / Easy grading
- **AI card generation** — upload a PDF or paste notes; Claude/Gemini generates flashcards instantly
- **AI card improvement** — one-click rewrite of individual cards for clarity
- **Explore & copy** — public deck library with subject filtering; copy any deck in one click
- **Turbo mode** — review all cards regardless of due date (no SRS dependency)
- **Progressive Web App** — installable on iOS and Android; works offline after install
- **Pro subscription** — higher AI quotas via Stripe; Free tier always available
- **OTP email verification** — 6-digit code on registration and optional 2FA login
- **Admin dashboard** — user management, reports queue, and usage stats

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, server + client components) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (raw SQL via `pg`) |
| Auth | HTTP-only JWT cookies (access + refresh tokens) |
| AI | Anthropic Claude via OpenRouter, Google Gemini (fallback) |
| Payments | Stripe Checkout + Customer Portal |
| Email | Nodemailer (SMTP) |
| Testing | Playwright (E2E, 5 browsers) |
| Deployment | Vercel + Supabase / any managed Postgres |

## Local development

### Prerequisites

- Node.js ≥ 18
- PostgreSQL 14+
- An SMTP relay (Mailpit or Mailtrap work fine locally)

### 1. Clone and install

```bash
git clone https://github.com/your-org/flashcard-app.git
cd flashcard-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` — see [Environment variables](#environment-variables) below.

### 3. Create the database

```bash
createdb flashcard_dev
```

### 4. Run migrations

Migrations are plain SQL files. Apply them in order:

```bash
for f in migrations/*.sql; do
  echo "Applying $f…"
  psql "$DATABASE_URL" -f "$f"
done
```

Or individually:

```bash
psql "$DATABASE_URL" -f migrations/001_initial_schema.sql
# … repeat for 002 through 012
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Run E2E tests

Requires the dev server to be running (or Playwright starts it automatically):

```bash
npm run test:e2e            # all browsers
npm run test:e2e:ui         # interactive UI mode
npm run test:e2e:headed     # visible browser windows
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string — `postgresql://user:pass@host:5432/db` |
| `DATABASE_SSL_CA` | No | CA certificate for TLS connections (managed Postgres providers) |
| `ACCESS_JWT_SECRET` | Yes | HS256 secret for access tokens — min 32 chars (`openssl rand -hex 32`) |
| `REFRESH_JWT_SECRET` | Yes | HS256 secret for refresh tokens — must differ from access secret |
| `NEXT_PUBLIC_APP_NAME` | No | Display name shown in the UI (default: `FlashCard`) |
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Canonical base URL — `https://flashcardai.app` — used in OG tags and share URLs |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP port (typically `587` for STARTTLS, `465` for SSL) |
| `SMTP_SECURE` | No | `true` for port 465 SSL; omit or `false` for STARTTLS |
| `SMTP_USER` | Yes | SMTP username / login |
| `SMTP_PASS` | Yes | SMTP password |
| `SMTP_FROM` | Yes | From address — e.g. `"FlashcardAI" <noreply@flashcardai.app>` |
| `OPENAI_API_KEY` | AI features | OpenAI key — used directly for vision (PDF image extraction) |
| `OPENROUTER_API_KEY` | AI features | OpenRouter key — routes to Claude / Gemini for card generation |
| `GROQ_API_KEY` | AI features | Groq key — fast text-to-cards fallback |
| `STRIPE_SECRET_KEY` | Payments | Stripe secret key (`sk_live_…` or `sk_test_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payments | Stripe publishable key (`pk_live_…` or `pk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Payments | Webhook signing secret (`whsec_…`) — from Stripe dashboard |
| `ADMIN_USERNAME` | Admin | Username for the `/admin` dashboard (password set separately in DB) |
| `DAILY_REVIEW_LIMIT` | No | Max due cards shown per session per user (default: `50`, set to `0` to disable) |
| `SENTRY_DSN` | No | Sentry error tracking DSN |

> Variables prefixed `NEXT_PUBLIC_` are embedded in the client bundle. Never put secrets in them.

## Project structure

```
app/                    Next.js App Router pages and API routes
  api/                  REST API handlers (see docs/api.md)
  (auth)/               Auth pages: login, register, verify-email
  flashcards/           Main flashcard dashboard (SPA-style client page)
  explore/              Public deck library
  settings/             Account settings
  pricing/              Pricing page
  admin/                Admin dashboard
components/             Shared React components
  flashcard/            Deck, card, study, share components
  ui/                   Primitive UI components (Button, Dialog, etc.)
lib/                    Server-side utilities
  auth.ts               JWT issuance, verification, cookie helpers
  db.ts                 PostgreSQL client wrapper
  srs.ts                SM-2 spaced repetition algorithm (pure, no I/O)
  otp.ts                OTP generation and verification
  email.ts              Transactional email sending (SMTP)
  rateLimit.ts          In-memory sliding-window rate limiter
migrations/             Numbered SQL migration files (applied in order)
tests/e2e/              Playwright end-to-end tests
docs/                   Extended documentation
  api.md                Full API reference
  srs-algorithm.md      SRS algorithm explanation and references
  seed-deck-guide.md    How to create and import seed decks
```

## Migrations

| File | Description |
|---|---|
| `001_initial_schema.sql` | Users, decks, cards, SRS state tables |
| `002_refresh_tokens.sql` | Refresh token store |
| `003_audit_log.sql` | Auth event audit log |
| `004_review_log.sql` | Per-card review history |
| `005_deck_appearance.sql` | Deck emoji and color columns |
| `006_explore_phase2.sql` | Public decks: slug, copy_count, is_public |
| `007_creator_profiles.sql` | Verified creator flag, username, subject_preference |
| `008_onboarding.sql` | Onboarding flow tables |
| `009_stripe.sql` | Stripe customer + subscription columns |
| `010_ai_regen_usage.sql` | AI generation quota tracking |
| `011_reporting_moderation.sql` | Content reports, moderation log, IP logging |
| `012_otp_email_verification.sql` | OTP codes table, email_verified flag, 2FA columns |

## Deployment

The app is deployed to Vercel. Set all environment variables under **Settings → Environment Variables** in the Vercel dashboard.

Stripe webhooks must point to `https://your-domain.com/api/stripe/webhook`. Forward locally with:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Contributing

1. Fork and create a feature branch
2. Run `npm run lint` before pushing
3. Add or update E2E tests for any new user-facing flow
4. Open a pull request against `main`
