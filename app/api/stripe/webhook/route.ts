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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await activateSubscription(sub);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await activateSubscription(sub);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await deactivateSubscription(sub.customer as string);
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
  const isActive = sub.status === 'active' || sub.status === 'trialing';
  await query(
    `UPDATE users
     SET is_pro = $1,
         stripe_subscription_id = $2,
         subscription_status = $3
     WHERE stripe_customer_id = $4`,
    [isActive, sub.id, sub.status, sub.customer as string],
  );
}

async function deactivateSubscription(customerId: string) {
  await query(
    `UPDATE users
     SET is_pro = false,
         stripe_subscription_id = NULL,
         subscription_status = 'canceled'
     WHERE stripe_customer_id = $1`,
    [customerId],
  );
}
