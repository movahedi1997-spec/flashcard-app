'use client';

/**
 * components/flashcard/study/CramSession.tsx
 *
 * Read-only cram / turbo session.
 * — Shows all cards in the deck in shuffled order.
 * — No grading: user just flips and taps Next.
 * — No SRS state is updated — nothing is recorded.
 * — Designed for pre-exam sweeps or first-pass deck exploration.
 */

import { useState, useRef, useMemo } from 'react';
import { ArrowLeft, Trophy, RotateCcw, Zap } from 'lucide-react';
import type { Deck, ApiCard } from '@/types/api';
import Button from '@/components/ui/Button';

interface Props {
  deck: Deck;
  cards: ApiCard[];
  onBack: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CramSession({ deck, cards, onBack }: Props) {
  // Shuffle once on mount; re-shuffle only when user restarts
  const [shuffledCards, setShuffledCards] = useState<ApiCard[]>(() => shuffle(cards));

  const [index, setIndex]       = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [flipped, setFlipped]   = useState(false);
  const [animKey, setAnimKey]   = useState(0);
  const [done, setDone]         = useState(false);

  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const total    = shuffledCards.length;
  const current  = shuffledCards[index];
  const progress = total > 0 ? ((index + (revealed ? 0.5 : 0)) / total) * 100 : 0;

  // ── Empty deck guard ──────────────────────────────────────────────────────────

  const isEmpty = useMemo(() => cards.length === 0, [cards.length]);

  if (isEmpty) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="p-4 rounded-full bg-amber-50 text-amber-500 w-fit mx-auto mb-4">
          <Zap size={32} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">No cards in this deck</h2>
        <p className="text-slate-500 text-sm mb-6">Add some cards before starting a cram session.</p>
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft size={15} /> Back to Deck
        </Button>
      </div>
    );
  }

  // ── Reveal (CSS 3D flip) ──────────────────────────────────────────────────────

  function reveal() {
    if (reducedMotion.current) {
      setRevealed(true);
    } else {
      setFlipped(true);
      setTimeout(() => setRevealed(true), 275);
    }
  }

  // ── Advance to next card ──────────────────────────────────────────────────────

  function next() {
    const isLast = index + 1 >= total;
    if (isLast) {
      setDone(true);
      return;
    }
    if (reducedMotion.current) {
      setFlipped(false);
      setRevealed(false);
      setIndex((i) => i + 1);
      setAnimKey((k) => k + 1);
    } else {
      setFlipped(false);
      setRevealed(false);
      setTimeout(() => {
        setIndex((i) => i + 1);
        setAnimKey((k) => k + 1);
      }, 300);
    }
  }

  // ── Restart ───────────────────────────────────────────────────────────────────

  function restart() {
    setShuffledCards(shuffle(cards));
    setIndex(0);
    setRevealed(false);
    setFlipped(false);
    setAnimKey((k) => k + 1);
    setDone(false);
  }

  // ── Session complete ──────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-12 fade-in">
        <div className="p-5 rounded-full bg-amber-50 text-amber-500 w-fit mx-auto mb-6">
          <Trophy size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Turbo Complete!</h2>
        <p className="text-slate-500 mb-2">
          {deck.title} · {total} cards reviewed
        </p>
        <p className="text-xs text-slate-400 mb-8">
          Nothing was recorded — your SRS schedule is unchanged.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={restart} fullWidth>
            <RotateCcw size={15} /> Turbo Again (reshuffled)
          </Button>
          <Button variant="secondary" onClick={onBack} fullWidth>
            <ArrowLeft size={15} /> Back to Deck
          </Button>
        </div>
      </div>
    );
  }

  // ── Study view ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Session info bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full">
          <Zap size={12} />
          Turbo · Read-only
        </div>
        <p className="text-xs text-slate-400">{index + 1} / {total}</p>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────────── */}
      <div
        className="w-full h-1.5 bg-slate-200 rounded-full mb-8 overflow-hidden"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemax={total}
        aria-label="Cram session progress"
      >
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Flashcard (same CSS 3D flip as SRS session) ──────────────────────── */}
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
          <div className="flashcard-face flashcard-back bg-amber-50 border-2 border-amber-200 shadow-sm rounded-2xl overflow-hidden">
            <span className="absolute top-4 left-4 text-xs font-semibold uppercase tracking-widest text-amber-400">
              Answer
            </span>
            <div className="flex flex-col items-center gap-3 px-6 pt-10 pb-6 w-full">
              {current?.backImageUrl && (
                <img
                  src={current.backImageUrl}
                  alt="Answer image"
                  className="max-h-40 object-contain rounded-xl border border-amber-200"
                />
              )}
              {current?.back && (
                <p className="text-lg font-medium text-amber-900 text-center leading-relaxed">
                  {current.back}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      {!revealed ? (
        <Button onClick={reveal} fullWidth size="lg">
          Flip Card
        </Button>
      ) : (
        <div className="fade-in">
          <Button onClick={next} fullWidth size="lg">
            {index + 1 >= total ? 'Finish' : 'Next Card →'}
          </Button>
        </div>
      )}
    </div>
  );
}
