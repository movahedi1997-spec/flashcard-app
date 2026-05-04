import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── Idempotency: skip events we have already processed ───────────────────
  const dedupe = await query(
    `INSERT INTO stripe_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [event.id],
  );
  if ((dedupe.rowCount ?? 0) === 0) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await activateSubscription(sub);
        } else if (session.mode === 'payment') {
          const creditsToAdd = parseInt(session.metadata?.creditsToAdd ?? '0', 10);
          const userId = session.metadata?.userId;
          if (userId && creditsToAdd > 0) {
            await query(
              'UPDATE users SET ai_credits = ai_credits + $1 WHERE id = $2',
              [creditsToAdd, userId],
            );
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await activateSubscription(sub);
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const sub = event.data.object as Stripe.Subscription;
        await deactivateSubscription(sub.customer as string, sub.status);
        break;
      }

      case 'customer.subscription.resumed': {
        const sub = event.data.object as Stripe.Subscription;
        await activateSubscription(sub);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          if (sub.status === 'past_due' || sub.status === 'unpaid') {
            await deactivateSubscription(sub.customer as string);
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error(`[Stripe webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function activateSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : null;
  if (!customerId) {
    console.error('[Stripe webhook] activateSubscription: missing customer ID', sub.id);
    return;
  }
  const isActive = sub.status === 'active' || sub.status === 'trialing';
  await query(
    `UPDATE users
     SET is_pro = $1,
         stripe_subscription_id = $2,
         subscription_status = $3
     WHERE stripe_customer_id = $4`,
    [isActive, sub.id, sub.status, customerId],
  );
}

async function deactivateSubscription(customerId: string, status = 'canceled') {
  if (!customerId || typeof customerId !== 'string') {
    console.error('[Stripe webhook] deactivateSubscription: missing customer ID');
    return;
  }
  await query(
    `UPDATE users
     SET is_pro = false,
         subscription_status = $1
     WHERE stripe_customer_id = $2`,
    [status, customerId],
  );
}
