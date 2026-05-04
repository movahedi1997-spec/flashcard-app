'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Trophy } from 'lucide-react';
import type { QuizQuestion } from '@/types/api';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

interface SessionQuestion extends QuizQuestion {
  shuffledOptions: string[];
}

function shuffle(q: QuizQuestion): string[] {
  const opts = [q.correctAnswer, q.optionA, q.optionB];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j]!, opts[i]!];
  }
  return opts;
}

interface Props {
  deckId: string;
  onBack: () => void;
}

export default function SRSQuizSession({ deckId, onBack }: Props) {
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchWithRefresh(`/api/quiz/decks/${deckId}/session`)
      .then((r) => r.json())
      .then((d: { questions: QuizQuestion[] }) => {
        setQuestions(d.questions.map((q) => ({ ...q, shuffledOptions: shuffle(q) })));
        setLoading(false);
      })
      .catch(() => { setError('Failed to load session.'); setLoading(false); });
  }, [deckId]);

  const current = questions[idx];

  function handleSelect(label: string) {
    if (submitted) return;
    setSelected(label);
  }

  async function handleSubmit() {
    if (!selected || !current) return;
    const isCorrect = selected === current.correctAnswer;
    if (isCorrect) setCorrect((c) => c + 1);
    setSubmitted(true);
    fetchWithRefresh('/api/quiz/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: current.id, correct: isCorrect }),
    }).catch(() => {});
  }

  function handleNext() {
    if (idx + 1 >= questions.length) { setDone(true); return; }
    setIdx((i) => i + 1);
    setSelected(null);
    setSubmitted(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">All caught up!</h2>
        <p className="text-slate-500 mb-6">No questions due today. Come back tomorrow.</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        >
          Back
        </button>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <Trophy className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Session Complete!</h2>
        <p className="text-slate-500 mb-2">
          <span className="font-bold text-indigo-600">{correct}</span> of{' '}
          <span className="font-bold">{questions.length}</span> correct
        </p>
        <div className="text-5xl font-bold text-indigo-600 mb-8">{pct}%</div>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        >
          Done
        </button>
      </div>
    );
  }

  const isCorrectAnswer = submitted && selected === current!.correctAnswer;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">{idx + 1} / {questions.length}</span>
        <div className="flex-1 mx-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-emerald-600">{correct} ✓</span>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4 shadow-sm">
        <p className="text-base font-semibold text-slate-800 leading-relaxed">{current!.questionText}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2 mb-4">
        {current!.shuffledOptions.map((opt) => {
          const isSelectedThis = selected === opt;
          const isCorrectOpt = opt === current!.correctAnswer;
          let cls = 'w-full text-start px-4 py-3 rounded-xl border-2 font-medium text-sm transition flex items-center gap-2 ';
          if (!submitted) {
            cls += isSelectedThis
              ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 cursor-pointer';
          } else {
            if (isCorrectOpt) cls += 'border-emerald-500 bg-emerald-50 text-emerald-800';
            else if (isSelectedThis) cls += 'border-red-400 bg-red-50 text-red-700';
            else cls += 'border-slate-200 bg-white text-slate-400';
          }
          return (
            <button key={opt} onClick={() => handleSelect(opt)} className={cls} disabled={submitted}>
              {submitted && isCorrectOpt && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
              {submitted && isSelectedThis && !isCorrectOpt && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {submitted && current!.explanation && (
        <div className={`rounded-xl px-4 py-3 mb-4 text-sm ${isCorrectAnswer ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          <span className="font-semibold">{isCorrectAnswer ? 'Correct! ' : 'Incorrect. '}</span>
          {current!.explanation}
        </div>
      )}

      {!submitted ? (
        <button
          onClick={() => void handleSubmit()}
          disabled={!selected}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
        >
          {idx + 1 >= questions.length ? 'Finish' : 'Next'}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
