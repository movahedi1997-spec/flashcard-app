# API Reference

All endpoints are under `/api/`. Unless noted, requests and responses use `application/json`.

Authentication uses HTTP-only cookies set by the login/register endpoints. Authenticated endpoints return `401` when no valid session cookie is present.

---

## Auth

### `POST /api/auth/register`

Register a new user account. Sends a 6-digit OTP to the provided email for verification.

**Body**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Display name (2–60 chars) |
| `email` | string | Yes | Email address |
| `password` | string | Yes | Min 8 chars, at least one uppercase, digit, and special char |
| `coppa_verified` | boolean | Yes | Must be `true` — user confirms they are 13+ |

**Responses**

| Status | Body | Description |
|---|---|---|
| 201 | `{ ok: true }` | Account created; OTP email sent; `otp_session` cookie set |
| 400 | `{ error: string }` | Validation failure |
| 409 | `{ error: "Email already registered." }` | Duplicate email |
| 429 | `{ error: string }` | Rate limited (5 registrations / min per IP) |

---

### `POST /api/auth/verify-otp`

Verify the 6-digit OTP received by email.

Requires the `otp_session` cookie set by `/register` or `/resend-otp`.

**Body**

| Field | Type | Description |
|---|---|---|
| `code` | string | 6-digit code from email |

**Responses**

| Status | Body | Description |
|---|---|---|
| 200 | `{ ok: true }` + `token` cookie | Email verified; full session issued |
| 400 | `{ error: string }` | Invalid or expired code |
| 401 | `{ error: string }` | Missing or expired OTP session cookie |
| 429 | `{ error: string }` | 5 attempts / min per user exceeded |

---

### `POST /api/auth/resend-otp`

Resend the OTP email. Requires the `otp_session` cookie.

**Body** — none

**Responses**

| Status | Body |
|---|---|
| 200 | `{ ok: true }` |
| 401 | `{ error: string }` |
| 429 | `{ error: string }` |

---

### `POST /api/auth/login`

Log in with email and password.

**Body**

| Field | Type |
|---|---|
| `email` | string |
| `password` | string |

**Responses**

| Status | Body | Description |
|---|---|---|
| 200 | `{ ok: true, user: { id, name, email } }` + `token` cookie | Logged in |
| 400 | `{ error: string }` | Missing fields |
| 401 | `{ error: string }` | Wrong credentials or unverified email |
| 429 | `{ error: string }` | 5 login attempts / min per IP |

---

### `POST /api/auth/logout`

Clear session cookies.

**Responses** — `200 { ok: true }` always.

---

### `GET /api/auth/me`

Return the authenticated user's profile.

**Responses**

| Status | Body |
|---|---|
| 200 | `{ id, name, email, username, avatarUrl, subjectPreference, isPro, isVerifiedCreator }` |
| 401 | `{ error: "Unauthorized" }` |

---

### `POST /api/auth/refresh`

Exchange a valid refresh token cookie for a new access token.

Called automatically by `fetchWithRefresh` on 401 responses — not typically called directly.

**Responses**

| Status | Body |
|---|---|
| 200 | `{ ok: true }` + new `token` cookie |
| 401 | `{ error: string }` |

---

### `GET /api/auth/silent-refresh`

Non-interactive token refresh used by the client on app load to restore session state without a redirect.

**Responses** — same as `/refresh`.

---

## Account

### `PATCH /api/account/profile`

Update display name, username, or date of birth.

**Body** (all fields optional)

| Field | Type |
|---|---|
| `name` | string (2–60 chars) |
| `username` | string (3–30 chars, alphanumeric + underscores) |
| `dob` | string (ISO date, e.g. `"2000-01-01"`) |

**Responses** — `200 { ok: true, user: {...} }` or `400`/`409` on validation errors.

---

### `POST /api/account/avatar`

Upload a profile avatar. Accepts `multipart/form-data`.

**Form field** — `avatar` — image file (JPEG, PNG, WebP; max 2 MB)

**Responses** — `200 { ok: true, avatarUrl: string }` or `400`.

---

### `DELETE /api/account/delete`

Permanently delete the authenticated user's account and all associated data.

**Body**

| Field | Type | Description |
|---|---|---|
| `password` | string | Current password — required for confirmation |
| `confirmPassword` | string | Must match `password` |

**Responses**

| Status | Body |
|---|---|
| 200 | `{ ok: true }` — all cookies cleared |
| 400 | `{ error: string }` |
| 401 | `{ error: string }` |

---

### `POST /api/account/2fa`

Enable or disable two-factor authentication (OTP on login).

**Body**

| Field | Type | Description |
|---|---|---|
| `enable` | boolean | `true` to enable, `false` to disable |

**Responses** — `200 { ok: true }` or `400`/`401`.

---

## Decks

### `GET /api/decks`

List all decks belonging to the authenticated user.

**Responses** — `200 { decks: Deck[] }`

**Deck object**

```jsonc
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "emoji": "string | null",
  "color": "string | null",         // Tailwind gradient class
  "subject": "string | null",
  "isPublic": false,
  "slug": "string | null",
  "cardCount": 12,
  "copyCount": 3,
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

---

### `POST /api/decks`

Create a new deck.

**Body**

| Field | Type | Required |
|---|---|---|
| `title` | string (1–120 chars) | Yes |
| `description` | string (max 500 chars) | No |
| `emoji` | string | No |
| `color` | string | No |
| `subject` | `"medicine" \| "pharmacy" \| "chemistry" \| "other"` | No |

**Responses** — `201 { deck: Deck }` or `400`.

---

### `GET /api/decks/[id]`

Fetch a single deck. Returns the deck if it belongs to the user or is public.

**Responses** — `200 { deck: Deck }`, `403`, or `404`.

---

### `PATCH /api/decks/[id]`

Update deck fields. Auto-generates a URL slug when `is_public` is set to `true` for the first time.

**Body** — any subset of `title`, `description`, `emoji`, `color`, `subject`, `is_public`.

**Responses** — `200 { deck: Deck }` or `400`/`403`/`404`.

---

### `DELETE /api/decks/[id]`

Delete a deck and all its cards.

**Responses** — `200 { ok: true }` or `403`/`404`.

---

### `GET /api/decks/[id]/cards`

List all cards in a deck (owner only).

**Responses** — `200 { cards: Card[] }`

**Card object**

```jsonc
{
  "id": "uuid",
  "deckId": "uuid",
  "front": "string",
  "back": "string",
  "aiGenerated": false,
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "srs": {
    "interval": 1,
    "easeFactor": 2.5,
    "reviewCount": 0,
    "dueDate": "ISO timestamp"
  }
}
```

---

### `POST /api/decks/[id]/copy`

Copy a public deck into the authenticated user's library.

**Body** — none

**Responses** — `201 { deck: Deck }` or `403` (deck not public) / `404`.

---

### `POST /api/decks/report`

Report a public deck for policy violations.

**Body**

| Field | Type |
|---|---|
| `deckId` | string (UUID) |
| `reason` | `"spam" \| "inappropriate" \| "copyright" \| "misinformation" \| "other"` |
| `details` | string (optional, max 500 chars) |

**Responses** — `200 { ok: true }` or `400`.

---

## Cards

### `POST /api/cards`

Create a card in a deck.

**Body**

| Field | Type | Required |
|---|---|---|
| `deckId` | string (UUID) | Yes |
| `front` | string (1–1000 chars) | Yes |
| `back` | string (1–1000 chars) | Yes |

**Responses** — `201 { card: Card }` or `400`/`403`.

---

### `PATCH /api/cards/[id]`

Update a card's front or back text.

**Body** — `{ front?: string, back?: string }`

**Responses** — `200 { card: Card }` or `400`/`403`/`404`.

---

### `DELETE /api/cards/[id]`

Delete a card.

**Responses** — `200 { ok: true }` or `403`/`404`.

---

## Study

### `GET /api/study/session`

Return the set of cards due for review today.

**Query parameters**

| Param | Values | Default | Description |
|---|---|---|---|
| `deckId` | UUID | — | Limit session to one deck |
| `mode` | `"srs" \| "turbo"` | `"srs"` | `turbo` returns all cards ignoring due dates |

**Responses** — `200 { cards: Card[], total: number, catchUp: boolean }`

`catchUp: true` means Smart Catch-Up mode activated — more than 50 cards overdue; only the highest-priority 20 are returned.

---

### `POST /api/study/grade`

Grade a card and persist the updated SRS state.

**Body**

| Field | Type |
|---|---|
| `cardId` | string (UUID) |
| `grade` | `"again" \| "hard" \| "good" \| "easy"` |

**Responses**

```jsonc
// 200
{
  "cardId": "uuid",
  "grade": "good",
  "newInterval": 6,
  "newEaseFactor": 2.5,
  "newDueDate": "ISO timestamp",
  "newReviewCount": 2,
  "preview": {
    "again": 1,
    "hard": 2,
    "good": 6,
    "easy": 8
  }
}
```

---

## AI

### `POST /api/ai/generate`

Generate flashcards from a PDF upload or pasted text.

Accepts `multipart/form-data`.

**Form fields**

| Field | Type | Description |
|---|---|---|
| `deckId` | string | Target deck UUID |
| `file` | File | PDF (max 20 MB) — optional if `notes` provided |
| `notes` | string | Pasted text notes — optional if `file` provided |

**Responses**

```jsonc
// 200
{
  "added": 12,                          // cards inserted
  "cards": [{ "front": "…", "back": "…" }]
}
```

| Status | Meaning |
|---|---|
| 400 | Missing deck, both file and notes absent, or file too large |
| 402 | AI quota exhausted for this billing period |
| 403 | Deck not owned by user |

---

### `POST /api/ai/improve-card`

Rewrite a single card's front and/or back using AI.

**Body**

| Field | Type |
|---|---|
| `cardId` | string (UUID) |
| `instruction` | string (optional — e.g. "make it shorter") |

**Responses** — `200 { card: Card }` (card updated in DB) or `402`/`403`/`404`.

---

### `GET /api/ai/quota`

Return the user's current AI generation quota usage.

**Responses**

```jsonc
// 200
{
  "used": 8,
  "limit": 10,         // Free tier limit per billing period
  "isPro": false
}
```

---

## Explore

### `GET /api/explore`

List public decks with optional filtering and search.

**Query parameters**

| Param | Description |
|---|---|
| `q` | Full-text search query |
| `subject` | Filter by subject (`medicine`, `pharmacy`, `chemistry`, `other`) |
| `page` | Page number (default: 1) |
| `limit` | Results per page (default: 20, max: 50) |

**Responses** — `200 { decks: PublicDeck[], total: number, page: number }`

---

### `GET /api/explore/categories`

Return deck counts grouped by subject (used to populate subject hub tiles).

**Responses** — `200 { categories: [{ subject, count }] }`

---

### `GET /api/explore/[slug]`

Fetch a single public deck by URL slug (used for the share page).

**Responses** — `200 { deck: PublicDeck, cards: Card[] }` or `404`.

---

## Stats

### `GET /api/stats/reviews`

Return daily review counts for the past 30 days (used for the heatmap).

**Responses** — `200 { reviews: [{ date: string, count: number }] }`

---

### `GET /api/stats/srs`

Return aggregate SRS state: due today, due this week, overdue, mastered.

**Responses**

```jsonc
// 200
{
  "dueToday": 12,
  "dueThisWeek": 34,
  "overdue": 5,
  "mastered": 87       // cards with interval ≥ 21 days
}
```

---

## Onboarding

### `POST /api/onboarding/subject`

Save the user's subject preference and copy a subject-appropriate starter deck into their library.

**Body**

| Field | Type |
|---|---|
| `subject` | `"medicine" \| "pharmacy" \| "chemistry" \| "other"` |

**Responses** — `200 { ok: true, deckAdded: boolean, deckId?: string }`.

`deckAdded: false` is returned when no verified-creator seed deck exists for the subject yet (non-blocking).

---

## Stripe

### `POST /api/stripe/checkout`

Create a Stripe Checkout session for upgrading to Pro.

**Body**

| Field | Type |
|---|---|
| `priceId` | string — Stripe price ID from the dashboard |

**Responses** — `200 { url: string }` (redirect to Stripe Checkout) or `400`/`500`.

---

### `POST /api/stripe/portal`

Create a Stripe Customer Portal session for managing an existing subscription.

**Body** — none

**Responses** — `200 { url: string }` or `400` (no Stripe customer on file).

---

### `POST /api/stripe/webhook`

Stripe webhook endpoint. Handles `checkout.session.completed` and `customer.subscription.*` events.

Must be called by Stripe with the raw request body and `Stripe-Signature` header. Not called by application code.

---

## Creators

### `GET /api/creators/[username]`

Fetch a verified creator's public profile and their public decks.

**Responses** — `200 { creator: CreatorProfile, decks: PublicDeck[] }` or `404`.

---

## Admin

All admin endpoints require the `admin_token` HTTP-only cookie set by `/api/admin/login`.

### `POST /api/admin/login`

**Body** — `{ username: string, password: string }`

**Responses** — `200 { ok: true }` + `admin_token` cookie, or `401`.

---

### `POST /api/admin/logout`

Clear the admin session cookie.

---

### `GET /api/admin/stats`

Return platform-wide statistics: total users, decks, cards generated, active subscribers.

---

### `GET /api/admin/users`

List all users with pagination. Supports `?q=` search by name or email.

---

### `GET /api/admin/users/[id]`

Fetch a single user's profile and subscription state.

### `PATCH /api/admin/users/[id]`

Update user flags: `is_verified_creator`, `is_banned`, `is_pro`.

### `DELETE /api/admin/users/[id]`

Delete a user account.

---

### `GET /api/admin/reports`

List content reports submitted via `/api/decks/report`.

---

## OG Image

### `GET /api/og`

Generates an Open Graph image for social sharing.

**Query parameters**

| Param | Description |
|---|---|
| `deckId` | UUID of a public deck |

Returns a PNG image. Used automatically by Next.js metadata `openGraph.images`.
