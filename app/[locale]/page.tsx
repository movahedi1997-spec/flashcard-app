import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import SubjectHubs from '@/components/SubjectHubs';
import BlogPreview from '@/components/BlogPreview';
import CTABanner from '@/components/CTABanner';
import Footer from '@/components/Footer';

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
        <SubjectHubs />
        <BlogPreview />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
