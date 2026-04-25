import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Pflichtangaben gemäß § 5 TMG — Legal Notice for FlashcardAI.',
};

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-gray-700">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">← Back to FlashcardAI</Link>

      <h1 className="mt-6 text-3xl font-bold text-gray-900">Impressum</h1>
      <p className="mt-1 text-sm text-gray-400">Legal Notice — Pflichtangaben gemäß § 5 TMG</p>

      <Section title="Angaben gemäß § 5 TMG / Information according to § 5 TMG">
        <address className="not-italic rounded-xl bg-gray-50 px-5 py-4 text-sm leading-relaxed">
          <strong>Mohammad M. Movahedi Najafabadi</strong><br />
          [ADDRESS PLACEHOLDER — will be updated with verified address]<br />
          <br />
          E-Mail: <a href="mailto:contact@movahedi.net" className="text-indigo-600 hover:underline">contact@movahedi.net</a>
        </address>
      </Section>

      <Section title="Verantwortlich für den Inhalt / Responsible for content">
        <p>Mohammad M. Movahedi Najafabadi (address as above)</p>
        <p className="mt-1 text-xs text-gray-400">Gemäß § 55 Abs. 2 RStV / According to § 55 para. 2 RStV</p>
      </Section>

      <Section title="Streitschlichtung / Dispute resolution">
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            https://ec.europa.eu/consumers/odr
          </a>
        </p>
        <p className="mt-2">
          The European Commission provides a platform for online dispute resolution (ODR):{' '}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            https://ec.europa.eu/consumers/odr
          </a>
        </p>
        <p className="mt-3 text-sm">
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.<br />
          We are not obligated to participate in dispute resolution proceedings before a consumer arbitration board.
        </p>
      </Section>

      <Section title="Haftungsausschluss / Disclaimer">
        <p className="font-medium text-gray-800">Haftung für Inhalte / Liability for content</p>
        <p className="mt-1">
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
        </p>
        <p className="mt-2">
          As a service provider, we are responsible for our own content on these pages in accordance with § 7 para. 1 TMG and general laws. However, we are not obligated to monitor transmitted or stored third-party information.
        </p>

        <p className="mt-4 font-medium text-gray-800">KI-generierte Inhalte / AI-generated content</p>
        <p className="mt-1">
          FlashcardAI nutzt KI zur Generierung von Lernkarten. KI-generierte Inhalte können Fehler enthalten und sollten vor der Nutzung in medizinischen, pharmazeutischen oder wissenschaftlichen Kontexten überprüft werden.<br />
          FlashcardAI uses AI to generate flashcards. AI-generated content may contain errors and should be verified before use in medical, pharmaceutical, or scientific contexts.
        </p>
      </Section>

      <Section title="Datenschutz / Data Protection">
        <p>
          Unsere Datenschutzerklärung finden Sie hier:{' '}
          <Link href="/privacy" className="text-indigo-600 hover:underline">Datenschutzerklärung / Privacy Policy</Link>
        </p>
      </Section>

      <div className="mt-12 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs text-amber-700">
        <strong>Note:</strong> The address on this Impressum will be updated before public launch with a verified business or virtual office address as required by § 5 TMG.
      </div>
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
