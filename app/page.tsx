import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import CTABanner from '@/components/CTABanner';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
