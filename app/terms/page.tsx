import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using FlashcardAI.',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-gray-700">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">← Back to FlashcardAI</Link>

      <h1 className="mt-6 text-3xl font-bold text-gray-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-gray-400">Last updated: April 2026</p>

      <p className="mt-6 text-sm leading-relaxed">
        These Terms of Service ("Terms") govern your use of FlashcardAI ("Service"), operated by Mohammad M. Movahedi Najafabadi ("we", "us", or "our"). By creating an account or using the Service, you agree to these Terms.
      </p>

      <Section title="1. Eligibility">
        <p>You must be at least 16 years old to use FlashcardAI. By using the Service, you confirm that you meet this requirement.</p>
      </Section>

      <Section title="2. Your Account">
        <ul className="list-disc pl-5 space-y-2">
          <li>You are responsible for maintaining the security of your account credentials.</li>
          <li>You must provide accurate information during registration.</li>
          <li>You must notify us immediately at <a href="mailto:contact@movahedi.net" className="text-indigo-600 hover:underline">contact@movahedi.net</a> if you suspect unauthorized access to your account.</li>
          <li>You may not create multiple accounts to circumvent usage limits.</li>
        </ul>
      </Section>

      <Section title="3. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="mt-2 list-disc pl-5 space-y-2">
          <li>Use the Service for any unlawful purpose.</li>
          <li>Upload content that infringes third-party intellectual property rights.</li>
          <li>Attempt to reverse-engineer, scrape, or abuse the AI generation features.</li>
          <li>Distribute, resell, or commercially exploit the Service without written permission.</li>
          <li>Upload malicious files or content designed to harm other users.</li>
          <li>Attempt to bypass subscription limits or access controls.</li>
        </ul>
      </Section>

      <Section title="4. User Content">
        <p>You retain ownership of all flashcard content you create. By using the Service, you grant us a limited, non-exclusive licence to store and process your content solely to operate and improve the Service.</p>
        <p className="mt-2">You are solely responsible for the accuracy of AI-generated flashcards. FlashcardAI does not guarantee the factual correctness of AI-generated content. Always verify medical, pharmaceutical, or scientific content with authoritative sources before relying on it.</p>
      </Section>

      <Section title="5. Free and Pro Plans">
        <p>The free plan includes 189 AI-generated cards per month. Pro plans (Monthly and Annual) offer unlimited AI generation and additional features. Plan details and pricing are described on the <Link href="/pricing" className="text-indigo-600 hover:underline">Pricing page</Link>.</p>
        <p className="mt-2">We reserve the right to adjust plan features and limits with 30 days' notice to existing subscribers.</p>
      </Section>

      <Section title="6. Payments and Refunds">
        <p>Paid subscriptions are processed via Stripe. By subscribing, you authorise recurring charges to your payment method. Subscriptions auto-renew unless cancelled before the renewal date.</p>
        <p className="mt-2">EU and UK users have a statutory 14-day right of withdrawal for digital services, except where the service has already been accessed or used. To request a refund, contact <a href="mailto:contact@movahedi.net" className="text-indigo-600 hover:underline">contact@movahedi.net</a>.</p>
      </Section>

      <Section title="7. Intellectual Property">
        <p>All software, design, branding, and non-user-generated content on FlashcardAI is owned by Mohammad M. Movahedi Najafabadi or its licensors and is protected by applicable intellectual property laws.</p>
      </Section>

      <Section title="8. Disclaimer of Warranties">
        <p>The Service is provided "as is" and "as available" without warranties of any kind. We do not warrant that the Service will be uninterrupted, error-free, or that AI-generated content will be accurate or complete.</p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>To the maximum extent permitted by applicable law, we shall not be liable for indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
        <p className="mt-2">Nothing in these Terms limits liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded by law.</p>
      </Section>

      <Section title="10. Termination">
        <p>You may delete your account at any time from Settings. We may suspend or terminate your account if you violate these Terms. Upon termination, your data will be deleted in accordance with our <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>.</p>
      </Section>

      <Section title="11. Governing Law">
        <p>These Terms are governed by the laws of Germany. Disputes shall be subject to the exclusive jurisdiction of the courts of Germany, except where mandatory local consumer protection laws apply in your country of residence.</p>
      </Section>

      <Section title="12. Changes to These Terms">
        <p>We may update these Terms. We will notify registered users of material changes by email at least 30 days before they take effect. Continued use of the Service after that date constitutes acceptance of the updated Terms.</p>
      </Section>

      <Section title="13. Contact">
        <p>
          For questions about these Terms:<br />
          <a href="mailto:contact@movahedi.net" className="text-indigo-600 hover:underline">contact@movahedi.net</a>
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
