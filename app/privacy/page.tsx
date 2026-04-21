import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How FlashcardAI collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-gray-700">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">← Back to FlashcardAI</Link>

      <h1 className="mt-6 text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-400">Last updated: April 2026</p>

      <p className="mt-6 text-sm leading-relaxed">
        This Privacy Policy explains how FlashcardAI ("we", "us", or "our"), operated by Mohammad M. Movahedi Najafabadi, collects, uses, and protects your personal data when you use flashcardai.app. It applies to users in the European Union, Germany, the United Kingdom, Canada, and the United States.
      </p>

      <Section title="1. Data Controller">
        <p>The data controller responsible for your personal data is:</p>
        <address className="mt-3 not-italic rounded-xl bg-gray-50 px-5 py-4 text-sm leading-relaxed">
          Mohammad M. Movahedi Najafabadi<br />
          [ADDRESS PLACEHOLDER — to be updated]<br />
          Email: <a href="mailto:privacy@flashcardai.app" className="text-indigo-600 hover:underline">privacy@flashcardai.app</a>
        </address>
      </Section>

      <Section title="2. Data We Collect">
        <SubSection title="Account data">
          When you register, we collect your email address, username, and a hashed password. We also store your subject preference (e.g. Medicine, Pharmacy, Chemistry) chosen during onboarding.
        </SubSection>
        <SubSection title="User-generated content">
          Flashcard decks and individual cards you create, including any text content used to generate AI flashcards.
        </SubSection>
        <SubSection title="Study and usage data">
          Spaced repetition (SRS) progress, study session history, and daily/weekly/monthly activity statistics.
        </SubSection>
        <SubSection title="Technical data">
          IP addresses stored in server access logs (retained for 30 days), browser type, and device information sent as part of standard HTTP requests.
        </SubSection>
        <SubSection title="Communications">
          Email address used to send account verification codes and transactional notifications (e.g. password reset).
        </SubSection>
      </Section>

      <Section title="3. Legal Basis for Processing (GDPR / UK GDPR)">
        <ul className="mt-3 list-disc pl-5 space-y-2 text-sm">
          <li><strong>Contract performance (Art. 6(1)(b) GDPR):</strong> Account registration, authentication, flashcard storage, and study features are necessary to provide the service.</li>
          <li><strong>Legitimate interest (Art. 6(1)(f) GDPR):</strong> Server security logs, fraud prevention, and service analytics.</li>
          <li><strong>Legal obligation (Art. 6(1)(c) GDPR):</strong> Retaining certain records where required by applicable law.</li>
        </ul>
      </Section>

      <Section title="4. Third-Party Processors">
        <p className="text-sm mb-3">We share data with the following processors solely to operate the service:</p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="border border-gray-200 px-3 py-2">Processor</th>
              <th className="border border-gray-200 px-3 py-2">Purpose</th>
              <th className="border border-gray-200 px-3 py-2">Location</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 px-3 py-2">Groq Inc.</td>
              <td className="border border-gray-200 px-3 py-2">AI flashcard generation from text</td>
              <td className="border border-gray-200 px-3 py-2">USA</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-3 py-2">OpenRouter / Google</td>
              <td className="border border-gray-200 px-3 py-2">AI flashcard generation from PDF</td>
              <td className="border border-gray-200 px-3 py-2">USA</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-3 py-2">Resend Inc.</td>
              <td className="border border-gray-200 px-3 py-2">Transactional email delivery</td>
              <td className="border border-gray-200 px-3 py-2">USA</td>
            </tr>
            <tr>
              <td className="border border-gray-200 px-3 py-2">VPS Provider</td>
              <td className="border border-gray-200 px-3 py-2">Server hosting and database</td>
              <td className="border border-gray-200 px-3 py-2">EU</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-sm">Transfers to US-based processors are carried out under Standard Contractual Clauses (SCCs) or equivalent safeguards as required by GDPR Chapter V.</p>
      </Section>

      <Section title="5. Data Retention">
        <ul className="mt-3 list-disc pl-5 space-y-2 text-sm">
          <li>Account data: retained until you delete your account.</li>
          <li>Flashcard content and study data: retained until account deletion.</li>
          <li>Server access logs: automatically deleted after 30 days.</li>
          <li>Email verification codes: expire after 10 minutes and are deleted after use.</li>
        </ul>
      </Section>

      <Section title="6. Your Rights">
        <p className="text-sm mb-3">Depending on your location, you have the following rights regarding your personal data:</p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
          <li><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
          <li><strong>Erasure ("Right to be Forgotten"):</strong> Request deletion of your account and all associated data.</li>
          <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
          <li><strong>Restriction:</strong> Request that we limit processing of your data.</li>
          <li><strong>Objection:</strong> Object to processing based on legitimate interest.</li>
          <li><strong>Withdraw consent:</strong> Where processing is based on consent, withdraw it at any time.</li>
          <li><strong>California (CCPA):</strong> Right to know, delete, and opt out of sale of personal information. We do not sell personal data.</li>
          <li><strong>Canada (PIPEDA):</strong> Right to access and challenge accuracy of your personal information.</li>
        </ul>
        <p className="mt-3 text-sm">To exercise any right, email <a href="mailto:privacy@flashcardai.app" className="text-indigo-600 hover:underline">privacy@flashcardai.app</a>. We respond within 30 days.</p>
        <p className="mt-2 text-sm">You also have the right to lodge a complaint with your local data protection authority. In Germany: <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Bundesbeauftragte für den Datenschutz (BfDI)</a>.</p>
      </Section>

      <Section title="7. Cookies">
        <p className="text-sm">We use only essential cookies required to operate the service (authentication tokens). We do not use tracking, analytics, or advertising cookies. See our <Link href="/cookies" className="text-indigo-600 hover:underline">Cookie Policy</Link> for details.</p>
      </Section>

      <Section title="8. Children's Privacy">
        <p className="text-sm">FlashcardAI is not directed at children under 16. We do not knowingly collect personal data from children under 16. If you believe a child has provided us with personal data, please contact <a href="mailto:privacy@flashcardai.app" className="text-indigo-600 hover:underline">privacy@flashcardai.app</a>.</p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p className="text-sm">We may update this Privacy Policy from time to time. We will notify registered users of material changes by email. Continued use of the service after changes constitutes acceptance.</p>
      </Section>

      <Section title="10. Contact">
        <p className="text-sm">For any privacy-related questions or data requests:<br />
          <a href="mailto:privacy@flashcardai.app" className="text-indigo-600 hover:underline">privacy@flashcardai.app</a>
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="font-medium text-gray-800">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed">{children}</p>
    </div>
  );
}
