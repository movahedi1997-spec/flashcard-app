import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How FlashcardAI uses cookies.',
};

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-gray-700">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">← Back to FlashcardAI</Link>

      <h1 className="mt-6 text-3xl font-bold text-gray-900">Cookie Policy</h1>
      <p className="mt-2 text-sm text-gray-400">Last updated: April 2026</p>

      <p className="mt-6 text-sm leading-relaxed">
        This Cookie Policy explains what cookies FlashcardAI uses and why. It applies to users in the EU, Germany, the UK, Canada, and the United States.
      </p>

      <Section title="What are cookies?">
        <p>Cookies are small text files stored on your device by your browser. They allow websites to remember information about your visit.</p>
      </Section>

      <Section title="Cookies we use">
        <p className="mb-4">FlashcardAI uses <strong>only essential cookies</strong>. We do not use tracking, advertising, or analytics cookies.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="border border-gray-200 px-3 py-2">Cookie name</th>
                <th className="border border-gray-200 px-3 py-2">Purpose</th>
                <th className="border border-gray-200 px-3 py-2">Duration</th>
                <th className="border border-gray-200 px-3 py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono text-xs">token</td>
                <td className="border border-gray-200 px-3 py-2">Keeps you logged in (JWT access token)</td>
                <td className="border border-gray-200 px-3 py-2">15 minutes</td>
                <td className="border border-gray-200 px-3 py-2">Essential</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono text-xs">refresh_token</td>
                <td className="border border-gray-200 px-3 py-2">Renews your session automatically</td>
                <td className="border border-gray-200 px-3 py-2">7 days</td>
                <td className="border border-gray-200 px-3 py-2">Essential</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono text-xs">otp_session</td>
                <td className="border border-gray-200 px-3 py-2">Temporary session during email verification</td>
                <td className="border border-gray-200 px-3 py-2">10 minutes</td>
                <td className="border border-gray-200 px-3 py-2">Essential</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-3 py-2 font-mono text-xs">cc_cookie</td>
                <td className="border border-gray-200 px-3 py-2">Stores your cookie consent preferences</td>
                <td className="border border-gray-200 px-3 py-2">6 months</td>
                <td className="border border-gray-200 px-3 py-2">Essential</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Why no tracking cookies?">
        <p>We built FlashcardAI with privacy as a core principle. We do not use Google Analytics, Facebook Pixel, or any other third-party tracking service. Your study data and behaviour on the app is never sold or shared for advertising purposes.</p>
      </Section>

      <Section title="Legal basis (EU / UK / Germany)">
        <p>Essential cookies are used on the basis of <strong>legitimate interest</strong> (Art. 6(1)(f) GDPR) and are strictly necessary for the service to function. They do not require consent under the ePrivacy Directive (EU) or PECR (UK). Under Germany's TTDSG §25(2), technically necessary cookies are also exempt from consent requirements.</p>
      </Section>

      <Section title="Managing cookies">
        <p>Because we only use essential cookies, disabling them will prevent you from logging in. You can manage or delete cookies through your browser settings:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Apple Safari</a></li>
        </ul>
      </Section>

      <Section title="Changes to this policy">
        <p>We will update this Cookie Policy if we introduce new types of cookies (e.g. analytics). We will notify users via the cookie consent banner and by email for material changes.</p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about cookies or your privacy:<br />
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
