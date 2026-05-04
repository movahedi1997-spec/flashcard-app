/**
 * POST /api/revenuecat/webhook
 *
 * Receives RevenueCat billing events for the Flutter mobile app and mirrors
 * the subscription state into the `users` table — the same `is_pro` flag that
 * Stripe webhooks maintain for web subscribers.
 *
 * Authentication: shared secret in the `Authorization` header, set in the
 * RevenueCat dashboard → Project → Webhooks → Authorization header.
 * Set REVENUECAT_WEBHOOK_SECRET in your .env.
 *
 * Events handled:
 *   INITIAL_PURCHASE / RENEWAL / UNCANCELLATION → is_pro = true
 *   CANCELLATION / EXPIRATION / BILLING_ISSUE    → is_pro = false
 *
 * The `app_user_id` in the RevenueCat payload must equal the user's UUID
 * (set via `Purchases.logIn(userId)` in the Flutter app).
 *
 * Idempotency: RevenueCat retries on non-2xx. UPDATE statements are
 * naturally idempotent (setting the same value is a no-op).
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRO_EVENTS   = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE']);
const LAPSE_EVENTS = new Set(['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE', 'SUBSCRIBER_ALIAS']);

export async function POST(req: NextRequest) {
  // ── Verify shared secret ──────────────────────────────────────────────────
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = req.headers.get('authorization') ?? '';
    if (authHeader !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body.event as Record<string, unknown> | undefined;
  if (!event) return NextResponse.json({ received: true });

  const eventType  = event.type as string | undefined;
  const appUserId  = event.app_user_id as string | undefined;

  if (!eventType || !appUserId) return NextResponse.json({ received: true });

  try {
    if (PRO_EVENTS.has(eventType)) {
      await query(
        `UPDATE users SET is_pro = true, subscription_status = 'active' WHERE id = $1`,
        [appUserId],
      );
    } else if (LAPSE_EVENTS.has(eventType)) {
      await query(
        `UPDATE users SET is_pro = false, subscription_status = $1 WHERE id = $2`,
        [eventType.toLowerCase(), appUserId],
      );
    }
  } catch (err) {
    console.error('[RevenueCat webhook]', eventType, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
