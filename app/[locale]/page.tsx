import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import AppDownload from '@/components/AppDownload';
import SubjectHubs from '@/components/SubjectHubs';
import BlogPreview from '@/components/BlogPreview';
import CTABanner from '@/components/CTABanner';
import Footer from '@/components/Footer';
import { hreflangAlternates } from '@/lib/hreflang';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    alternates: hreflangAlternates(params.locale, '/'),
  };
}

export default function HomePage() {
  if (process.env.NEXT_PUBLIC_LOCAL_MODE === 'true') {
    redirect('/login');
  }
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <AppDownload />
        <SubjectHubs />
        <BlogPreview />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
