// POST /api/stripe/credits
// Body: { packageId: '39' | '89' | '189' | '1000' }
// Creates a one-time Stripe Checkout session for AI credit top-ups.
// On success Stripe redirects to /settings/billing?credits_purchased=true
// and the webhook adds the purchased credits to users.ai_credits.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import Stripe from 'stripe';
import { query } from '@/lib/db';
import { CREDIT_PACKAGES } from '@/lib/creditPackages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });

const secret = new TextEncoder().encode(
  process.env.ACCESS_JWT_SECRET ?? 'dev-access-secret-change-in-production-32x',
);

export async function POST(req: NextRequest) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  let userEmail: string;
  try {
    const { payload } = await jwtVerify(token, secret);
    userId    = payload.userId as string;
    userEmail = payload.email  as string;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { packageId } = await req.json() as { packageId?: string };
  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return NextResponse.json({ error: 'Invalid package.' }, { status: 400 });

  // Get or create Stripe customer
  const userRow = await query<{ stripe_customer_id: string | null }>(
    'SELECT stripe_customer_id FROM users WHERE id = $1', [userId],
  );
  let customerId = userRow.rows[0]?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({ email: userEmail, metadata: { userId } });
    customerId = customer.id;
    await query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, userId]);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://flashcardai.app';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${pkg.label} — AI Generation Credits`,
          description: `${pkg.credits} AI credits for generating flashcards and quiz questions`,
        },
        unit_amount: pkg.amountCents,
      },
      quantity: 1,
    }],
    metadata: { userId, creditsToAdd: String(pkg.credits) },
    success_url: `${siteUrl}/settings/billing?credits_purchased=true`,
    cancel_url:  `${siteUrl}/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
}
