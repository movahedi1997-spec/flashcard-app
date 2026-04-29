import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/hreflang';
import PricingClient from './PricingClient';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: 'Pricing — FlashcardAI',
    description:
      'Simple, honest pricing. Start free — 189 AI cards per month at no cost. Upgrade to Pro for 499 AI cards, advanced SRS analytics, and more.',
    alternates: hreflangAlternates(params.locale, '/pricing'),
  };
}

export default function PricingPage() {
  return <PricingClient />;
}
