'use client';

import { useState, useMemo, useCallback } from 'react';
import { CheckCircle, XCircle, HelpCircle, RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import type { Box, Card, StudyMode, StudyStats } from '@/types/flashcard';
import { buildTurboDeck, buildScoreDeck } from '@/lib/flashcard/study';
import Button from '@/components/ui/Button';

interface Props {
  box: Box;
  cards: Card[];
  mode: StudyMode;
  onScoreUpdate: (cardId: string, delta: number) => void;
  onBack: () => void;
}

export default function StudySession({ box, cards, mode, onScoreUpdate, onBack }: Props) {
  const buildDeck = useCallback(() =>
    mode === 'turbo' ? buildTurboDeck(cards) : buildScoreDeck(cards),
  [cards, mode]);

  const [deck, setDeck] = useState<Card[]>(() => buildDeck());
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState<StudyStats>({ correct: 0, wrong: 0, notSure: 0 });
  const [done, setDone] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const current = deck[index];
  const total = deck.length;
  const progress = total > 0 ? (index / total) * 100 : 0;

  function reveal() {
    setFlipped(true);
    setTimeout(() => setRevealed(true), 280);
  }

  function grade(result: 'correct' | 'wrong' | 'notSure') {
    const delta = result === 'correct' ? 1 : result === 'wrong' ? -1 : 0;
    if (delta !== 0) onScoreUpdate(current.id, delta);
    setStats(prev => ({ ...prev, [result]: prev[result] + 1 }));
    if (index + 1 >= total) {
      setDone(true);
    } else {
      setFlipped(false);
      setRevealed(false);
      setTimeout(() => { setIndex(i => i + 1); setAnimKey(k => k + 1); }, 300);
    }
  }

  function restart() {
    setDeck(buildDeck());
    setIndex(0);
    setRevealed(false);
    setFlipped(false);
    setStats({ correct: 0, wrong: 0, notSure: 0 });
    setDone(false);
    setAnimKey(k => k + 1);
  }

  const accuracy = useMemo(() => {
    const t = stats.correct + stats.wrong + stats.notSure;
    return t === 0 ? 0 : Math.round((stats.correct / t) * 100);
  }, [stats]);

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-12 fade-in">
        <div className="p-5 rounded-full bg-indigo-50 text-indigo-600 w-fit mx-auto mb-6">
          <Trophy size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Session Complete!</h2>
        <p className="text-slate-500 mb-8">{box.name} · {total} cards reviewed</p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-600">{stats.correct}</p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Correct</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-red-600">{stats.wrong}</p>
            <p className="text-xs text-red-600 font-medium mt-0.5">Wrong</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-amber-600">{stats.notSure}</p>
            <p className="text-xs text-amber-600 font-medium mt-0.5">Not Sure</p>
          </div>
        </div>
        <p className="text-lg font-semibold text-slate-700 mb-8">
          Accuracy:{' '}
          <span className={accuracy >= 70 ? 'text-emerald-600' : accuracy >= 40 ? 'text-amber-600' : 'text-red-600'}>
            {accuracy}%
          </span>
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={restart} fullWidth><RotateCcw size={15} /> Study Again</Button>
          <Button variant="secondary" onClick={onBack} fullWidth><ArrowLeft size={15} /> Back to Box</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600">{box.name}</p>
          <p className="text-xs text-slate-400">{mode === 'turbo' ? 'Turbo' : 'Score-Based'} · Card {index + 1} of {total}</p>
        </div>
        <div className="flex gap-3 text-xs font-medium">
          <span className="text-emerald-600">✓ {stats.correct}</span>
          <span className="text-red-500">✗ {stats.wrong}</span>
          <span className="text-amber-500">~ {stats.notSure}</span>
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-200 rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flashcard-container mb-8" key={animKey}>
        <div
          className={`flashcard ${flipped ? 'flipped' : ''}`}
          style={{ minHeight: current.questionImage || current.answerImage ? '320px' : '240px' }}
        >
          <div className="flashcard-face bg-white border-2 border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <span className="absolute top-4 left-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Question</span>
            <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 w-full">
              {current.questionImage && (
                <img src={current.questionImage} alt="Question" className="max-h-40 object-contain rounded-xl border border-slate-200" />
              )}
              {current.question && (
                <p className="text-lg font-medium text-slate-800 text-center leading-relaxed">{current.question}</p>
              )}
            </div>
          </div>

          <div className="flashcard-face flashcard-back bg-indigo-50 border-2 border-indigo-200 shadow-sm rounded-2xl overflow-hidden">
            <span className="absolute top-4 left-4 text-xs font-semibold uppercase tracking-widest text-indigo-400">Answer</span>
            <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 w-full">
              {current.answerImage && (
                <img src={current.answerImage} alt="Answer" className="max-h-40 object-contain rounded-xl border border-indigo-200" />
              )}
              {current.answer && (
                <p className="text-lg font-medium text-indigo-900 text-center leading-relaxed">{current.answer}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {!revealed ? (
        <Button onClick={reveal} fullWidth size="lg">Reveal Answer</Button>
      ) : (
        <div className="fade-in">
          <p className="text-center text-sm text-slate-500 mb-4 font-medium">How did you do?</p>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => grade('correct')}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 transition-all cursor-pointer group">
              <CheckCircle size={28} className="text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-emerald-700">Correct</span>
              <span className="text-xs text-emerald-500">+1 point</span>
            </button>
            <button onClick={() => grade('notSure')}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 hover:border-amber-400 transition-all cursor-pointer group">
              <HelpCircle size={28} className="text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-amber-700">Not Sure</span>
              <span className="text-xs text-amber-500">0 points</span>
            </button>
            <button onClick={() => grade('wrong')}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl bg-red-50 border-2 border-red-200 hover:bg-red-100 hover:border-red-400 transition-all cursor-pointer group">
              <XCircle size={28} className="text-red-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-red-700">Wrong</span>
              <span className="text-xs text-red-500">-1 point</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
