import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function SubjectHubs() {
  const t = useTranslations('home.subjects');

  const SUBJECTS = [
    {
      emoji: '🩺',
      nameKey: 'medicineName' as const,
      color: 'from-indigo-600 to-violet-600',
      border: 'border-indigo-100',
      badge: 'bg-indigo-100 text-indigo-700',
      glow: 'shadow-indigo-200/60',
      tag: 'USMLE Step 1 · Step 2 CK · Step 3',
      topics: ['Pharmacology', 'Cardiovascular', 'Neurology', 'Microbiology', 'Biochemistry'],
      sampleQ: 'A patient presents with crushing chest pain radiating to the left arm. What is the first-line treatment?',
      sampleA: 'Aspirin + Nitrates + O₂ + Morphine (MONA). Call cath lab for STEMI.',
    },
    {
      emoji: '💊',
      nameKey: 'pharmacyName' as const,
      color: 'from-emerald-600 to-teal-600',
      border: 'border-emerald-100',
      badge: 'bg-emerald-100 text-emerald-700',
      glow: 'shadow-emerald-200/60',
      tag: 'NAPLEX · MPJE',
      topics: ['Drug Mechanisms', 'Pharmacokinetics', 'Calculations', 'Therapeutics', 'Drug Interactions'],
      sampleQ: 'What is the renal dose adjustment threshold for Metformin?',
      sampleA: 'Contraindicated if eGFR < 30 mL/min. Use with caution at eGFR 30–45.',
    },
    {
      emoji: '⚗️',
      nameKey: 'chemistryName' as const,
      color: 'from-amber-500 to-orange-500',
      border: 'border-amber-100',
      badge: 'bg-amber-100 text-amber-700',
      glow: 'shadow-amber-200/60',
      tag: 'Organic Chem · AP Chemistry',
      topics: ['Reaction Mechanisms', 'Stereochemistry', 'Nomenclature', 'Acid-Base', 'Lab Techniques'],
      sampleQ: 'What is the product of an E2 elimination reaction on a secondary alkyl halide?',
      sampleA: "An alkene. Follows Zaitsev's rule — most substituted alkene is the major product.",
    },
  ];

  return (
    <section id="subjects" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Heading */}
        <div className="mb-16 text-center">
          <span className="mb-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {t('badge')}
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">
            {t('heading')}{' '}
            <span className="gradient-text">{t('headingAccent')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            {t('subtext')}
          </p>
        </div>

        {/* Subject cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {SUBJECTS.map(({ emoji, nameKey, color, border, badge, glow, tag, topics, sampleQ, sampleA }) => {
            const name = t(nameKey);
            return (
              <div
                key={nameKey}
                className={`group relative flex flex-col rounded-3xl border ${border} bg-white shadow-xl ${glow} overflow-hidden transition duration-300 hover:-translate-y-2`}
              >
                {/* Header gradient */}
                <div className={`bg-gradient-to-br ${color} px-6 pt-7 pb-20`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{emoji}</span>
                    <span className={`rounded-full ${badge} px-2.5 py-0.5 text-xs font-semibold`}>
                      {tag}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">{name}</h3>
                </div>

                {/* 3D sample card — overlapping the header */}
                <div className="-mt-14 mx-5 z-10">
                  <div
                    className="rounded-2xl border border-gray-100 bg-white shadow-xl p-4"
                    style={{ transform: 'perspective(600px) rotateX(2deg)' }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1.5">{t('sampleCardLabel')}</p>
                    <p className="text-xs font-semibold text-gray-800 mb-2 leading-snug">{sampleQ}</p>
                    <div className="rounded-xl bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-600 leading-relaxed">{sampleA}</p>
                    </div>
                  </div>
                </div>

                {/* Topics */}
                <div className="px-5 pt-4 pb-2 flex flex-wrap gap-1.5">
                  {topics.map((topic) => (
                    <span key={topic} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {topic}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-auto px-5 pb-5 pt-3">
                  <Link
                    href="/signup"
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 group-hover:border-indigo-300"
                  >
                    {t('startStudying', { name })}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
