'use client';

/**
 * components/flashcard/study/StudySession.tsx  (TASK-006 rewrite)
 *
 * Fetches due cards from GET /api/study/session, grades each card via
 * POST /api/study/grade, shows Smart Catch-Up modal when isCatchup=true,
 * and labels every grade button with the SM-2 interval preview.
 *
 * CSS 3D flip is driven by the existing .flashcard / .flipped classes in
 * globals.css (500 ms cubic-bezier). prefers-reduced-motion is respected —
 * the flip is skipped and the back face is shown instantly.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';
import { ArrowLeft, Trophy, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import type {
  Deck,
  StudyCard,
  Grade,
  StudySessionResponse,
  GradeResponse,
  IntervalPreview,
} from '@/types/api';
import Button from '@/components/ui/Button';

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  deck: Deck;
  onBack: () => void;
}

// ── Session stats ─────────────────────────────────────────────────────────────

interface SessionStats {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

// ── Grade button config ───────────────────────────────────────────────────────

const GRADE_CONFIG: Array<{
  grade: Grade;
  label: string;
  bg: string;
  border: string;
  text: string;
  sub: string;
}> = [
  {
    grade: 'again',
    label: 'Again',
    bg: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-200 hover:border-red-400',
    text: 'text-red-700',
    sub: 'text-red-500',
  },
  {
    grade: 'hard',
    label: 'Hard',
    bg: 'bg-orange-50 hover:bg-orange-100',
    border: 'border-orange-200 hover:border-orange-400',
    text: 'text-orange-700',
    sub: 'text-orange-500',
  },
  {
    grade: 'good',
    label: 'Good',
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    border: 'border-emerald-200 hover:border-emerald-400',
    text: 'text-emerald-700',
    sub: 'text-emerald-500',
  },
  {
    grade: 'easy',
    label: 'Easy',
    bg: 'bg-indigo-50 hover:bg-indigo-100',
    border: 'border-indigo-200 hover:border-indigo-400',
    text: 'text-indigo-700',
    sub: 'text-indigo-500',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Formats a day count to a short human-readable string. */
function fmtDays(days: number): string {
  if (days < 1) return '<1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudySession({ deck, onBack }: Props) {
  // ── Session fetch state ─────────────────────────────────────────────────────
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [isCatchup, setIsCatchup] = useState(false);
  const [showCatchupModal, setShowCatchupModal] = useState(false);

  // ── Card progress state ─────────────────────────────────────────────────────
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [grading, setGrading] = useState(false);
  const [done, setDone] = useState(false);

  // Active preview — starts as the first card's preview, updated after each grade
  const [preview, setPreview] = useState<IntervalPreview | null>(null);

  // Stats for the complete screen
  const [stats, setStats] = useState<SessionStats>({ again: 0, hard: 0, good: 0, easy: 0 });

  // Reduced-motion detection (read once on mount — stable ref)
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  // ── Fetch / restart session ─────────────────────────────────────────────────

  const fetchSession = useCallback(async () => {
    setSessionLoading(true);
    setSessionError(null);
    setDone(false);
    setIndex(0);
    setRevealed(false);
    setFlipped(false);
    setStats({ again: 0, hard: 0, good: 0, easy: 0 });
    setAnimKey((k) => k + 1);

    try {
      const res = await fetchWithRefresh(`/api/study/session?deckId=${encodeURIComponent(deck.id)}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      const data = (await res.json()) as StudySessionResponse;

      if (data.cards.length === 0) {
        // No cards due — go straight to the complete screen
        setCards([]);
        setTotalDue(0);
        setIsCatchup(false);
        setDone(true);
      } else {
        setCards(data.cards);
        setTotalDue(data.totalDue);
        setIsCatchup(data.isCatchup);
        setPreview(data.cards[0].preview);
        if (data.isCatchup) setShowCatchupModal(true);
      }
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : 'Failed to load study session.');
    } finally {
      setSessionLoading(false);
    }
  }, [deck.id]);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  // ── Reveal answer (CSS 3D flip) ─────────────────────────────────────────────

  function reveal() {
    if (reducedMotion.current) {
      // Skip animation — show back instantly
      setRevealed(true);
    } else {
      setFlipped(true);
      // Wait for flip midpoint before showing back-face content
      setTimeout(() => setRevealed(true), 275);
    }
  }

  // ── Grade a card ─────────────────────────────────────────────────────────────

  const handleGrade = useCallback(
    async (g: Grade) => {
      if (grading || !cards[index]) return;
      setGrading(true);
      setStats((prev) => ({ ...prev, [g]: prev[g] + 1 }));

      try {
        const res = await fetchWithRefresh('/api/study/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: cards[index].id, grade: g }),
        });
        if (res.ok) {
          const data = (await res.json()) as GradeResponse;
          // Update preview with the grades that would apply to the next card
          const nextCard = cards[index + 1];
          setPreview(nextCard ? nextCard.preview : data.preview);
        }
      } catch {
        // Silent — grading is best-effort; the session still progresses
      }

      // Advance to next card or finish
      const isLast = index + 1 >= cards.length;
      if (isLast) {
        setDone(true);
      } else {
        const nextIndex = index + 1;
        if (reducedMotion.current) {
          setFlipped(false);
          setRevealed(false);
          setIndex(nextIndex);
          setAnimKey((k) => k + 1);
        } else {
          setFlipped(false);
          setRevealed(false);
          setTimeout(() => {
            setIndex(nextIndex);
            setAnimKey((k) => k + 1);
          }, 300);
        }
      }

      setGrading(false);
    },
    [grading, cards, index],
  );

  // ── Derived display values ────────────────────────────────────────────────────

  const current = cards[index];
  const total = cards.length;
  const progress = total > 0 ? (index / total) * 100 : 0;
  const totalGraded = stats.again + stats.hard + stats.good + stats.easy;
  const retentionCount = stats.good + stats.easy;
  const retention =
    totalGraded === 0 ? 0 : Math.round((retentionCount / totalGraded) * 100);

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (sessionLoading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="text-slate-500 text-sm">Loading your due cards…</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────

  if (sessionError) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="p-4 rounded-full bg-red-50 text-red-500 w-fit mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Failed to load session</h2>
        <p className="text-slate-500 text-sm mb-6">{sessionError}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft size={15} /> Back
          </Button>
          <Button onClick={() => void fetchSession()}>
            <RotateCcw size={15} /> Retry
          </Button>
        </div>
      </div>
    );
  }

  // ── Session complete ──────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-12 fade-in">
        <div className="p-5 rounded-full bg-indigo-50 text-indigo-600 w-fit mx-auto mb-6">
          <Trophy size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Session Complete!</h2>
        <p className="text-slate-500 mb-8">
          {deck.title} · {total > 0 ? `${total} cards reviewed` : 'No cards due'}
        </p>

        {total > 0 && (
          <>
            <div className="grid grid-cols-4 gap-2 mb-6">
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xl font-bold text-red-600">{stats.again}</p>
                <p className="text-xs text-red-500 font-medium mt-0.5">Again</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-xl font-bold text-orange-600">{stats.hard}</p>
                <p className="text-xs text-orange-500 font-medium mt-0.5">Hard</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xl font-bold text-emerald-600">{stats.good}</p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">Good</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3">
                <p className="text-xl font-bold text-indigo-600">{stats.easy}</p>
                <p className="text-xs text-indigo-500 font-medium mt-0.5">Easy</p>
              </div>
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-8">
              Retention:{' '}
              <span
                className={
                  retention >= 70
                    ? 'text-emerald-600'
                    : retention >= 40
                      ? 'text-amber-600'
                      : 'text-red-600'
                }
              >
                {retention}%
              </span>
            </p>
          </>
        )}

        {total === 0 && (
          <p className="text-slate-400 text-sm mb-8">
            All cards are up to date. Come back tomorrow!
          </p>
        )}

        <div className="flex flex-col gap-3">
          {total > 0 && (
            <Button onClick={() => void fetchSession()} fullWidth>
              <RotateCcw size={15} /> Study Again
            </Button>
          )}
          <Button variant="secondary" onClick={onBack} fullWidth>
            <ArrowLeft size={15} /> Back to Deck
          </Button>
        </div>
      </div>
    );
  }

  // ── Study view ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Smart Catch-Up Modal ─────────────────────────────────────────────── */}
      {showCatchupModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCatchupModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <h2 className="text-base font-bold text-slate-800">Smart Catch-Up Mode</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              You have{' '}
              <strong className="text-slate-800">{totalDue} overdue cards</strong>. To
              avoid overwhelm, we've selected the{' '}
              <strong className="text-slate-800">{total} highest-priority cards</strong>{' '}
              for this session.
            </p>
            <p className="text-xs text-slate-400 mb-5">
              Cards are ranked by how overdue they are. Study daily to clear the backlog.
            </p>
            <Button onClick={() => setShowCatchupModal(false)} fullWidth>
              Got it — Let&apos;s Study
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* ── Session info bar ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3 text-xs font-medium">
            <span className="text-red-500" aria-label={`${stats.again} again`}>↩ {stats.again}</span>
            <span className="text-emerald-600" aria-label={`${stats.good + stats.easy} retained`}>✓ {stats.good + stats.easy}</span>
          </div>
          <p className="text-xs text-slate-400">
            {isCatchup && <span className="text-amber-500 font-medium">Catch-Up · </span>}
            {index + 1} / {total}
          </p>
        </div>

        {/* ── Progress bar ───────────────────────────────────────────────────── */}
        <div
          className="w-full h-1.5 bg-slate-200 rounded-full mb-8 overflow-hidden"
          role="progressbar"
          aria-valuenow={index}
          aria-valuemax={total}
          aria-label="Session progress"
        >
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ── Flashcard (CSS 3D flip) ────────────────────────────────────────── */}
        <div
          className="flashcard-container mb-8"
          key={animKey}
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            className={`flashcard${flipped && !reducedMotion.current ? ' flipped' : ''}`}
            style={{
              minHeight:
                current?.frontImageUrl || current?.backImageUrl ? '320px' : '240px',
            }}
          >
            {/* Front face */}
            <div className="flashcard-face bg-white border-2 border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <span className="absolute top-4 left-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Question
              </span>
              {current?.aiGenerated && (
                <span className="absolute top-4 right-4 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-500 border border-purple-100">
                  AI-generated
                </span>
              )}
              <div className="flex flex-col items-center gap-3 px-6 pt-10 pb-6 w-full">
                {current?.frontImageUrl && (
                  <img
                    src={current.frontImageUrl}
                    alt="Question image"
                    className="max-h-40 object-contain rounded-xl border border-slate-200"
                  />
                )}
                {current?.front && (
                  <p className="text-lg font-medium text-slate-800 text-center leading-relaxed">
                    {current.front}
                  </p>
                )}
              </div>
            </div>

            {/* Back face */}
            <div className="flashcard-face flashcard-back bg-indigo-50 border-2 border-indigo-200 shadow-sm rounded-2xl overflow-hidden">
              <span className="absolute top-4 left-4 text-xs font-semibold uppercase tracking-widest text-indigo-400">
                Answer
              </span>
              <div className="flex flex-col items-center gap-3 px-6 pt-10 pb-6 w-full">
                {current?.backImageUrl && (
                  <img
                    src={current.backImageUrl}
                    alt="Answer image"
                    className="max-h-40 object-contain rounded-xl border border-indigo-200"
                  />
                )}
                {current?.back && (
                  <p className="text-lg font-medium text-indigo-900 text-center leading-relaxed">
                    {current.back}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        {!revealed ? (
          <Button onClick={reveal} fullWidth size="lg">
            Reveal Answer
          </Button>
        ) : (
          <div className="fade-in">
            <p className="text-center text-sm text-slate-500 mb-4 font-medium">
              How well did you know this?
            </p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {GRADE_CONFIG.map(({ grade, label, bg, border, text, sub }) => (
                <button
                  key={grade}
                  onClick={() => void handleGrade(grade)}
                  disabled={grading}
                  aria-label={`${label} — next review in ${preview ? fmtDays(preview[grade]) : '…'}`}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${bg} ${border}`}
                >
                  <span className={`text-sm font-semibold ${text}`}>{label}</span>
                  <span className={`text-xs tabular-nums ${sub}`}>
                    {preview ? fmtDays(preview[grade]) : '…'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
