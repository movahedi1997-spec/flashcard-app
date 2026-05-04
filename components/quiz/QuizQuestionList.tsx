'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Sparkles, Loader2, AlertCircle, Share2, Check } from 'lucide-react';
import type { QuizDeck, QuizQuestion } from '@/types/api';
import type { QuizQuestionUpdate } from '@/hooks/useQuizQuestions';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import QuizQuestionForm, { type QuizQuestionFormValues } from './QuizQuestionForm';
import QuizAIGenerateModal from './QuizAIGenerateModal';

interface Props {
  deck: QuizDeck;
  deckId: string;
  questions: QuizQuestion[];
  loading: boolean;
  error: string | null;
  isPro?: boolean;
  onCreateQuestion: (deckId: string, data: { questionText: string; correctAnswer: string; optionA: string; optionB: string; explanation?: string }) => Promise<QuizQuestion | null>;
  onUpdateQuestion: (id: string, updates: QuizQuestionUpdate) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onAppendQuestions: (questions: QuizQuestion[]) => void;
  onStudy: () => void;
  onBack: () => void;
}

export default function QuizQuestionList({
  deck, deckId, questions, loading, error, isPro = false,
  onCreateQuestion, onUpdateQuestion, onDeleteQuestion, onAppendQuestions, onStudy,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editQ, setEditQ] = useState<QuizQuestion | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  void isPro;

  async function handleShare() {
    if (!deck.isPublic || !deck.slug) return;
    const url = `${window.location.origin}/explore/${deck.slug}`;
    if (navigator.share) {
      await navigator.share({ title: deck.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleCreate(values: QuizQuestionFormValues) {
    await onCreateQuestion(deckId, values);
  }

  async function handleUpdate(values: QuizQuestionFormValues) {
    if (!editQ) return;
    await onUpdateQuestion(editQ.id, values);
  }

  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm">Loading questions…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Questions ({questions.length})</h2>
        <div className="flex gap-2">
          {deck.isPublic && deck.slug && (
            <Button variant="secondary" size="sm" onClick={() => void handleShare()}>
              {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setAiOpen(true)}>
            <Sparkles size={14} /> <span className="hidden sm:inline">AI Generate</span>
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty state */}
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-3">🧠</div>
          <p className="text-slate-600 font-semibold mb-1">No questions yet</p>
          <p className="text-sm text-slate-400 mb-6">Add questions manually or generate them with AI.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setAiOpen(true)}>
              <Sparkles size={14} /> AI Generate
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={14} /> Add Question
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-6">
            {questions.map((q, i) => {
              const expanded = expandedId === q.id;
              return (
                <div key={q.id} className={`border-b border-slate-100 last:border-b-0 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <div className="flex items-start gap-3 px-4 py-3.5">
                    <span className="text-xs text-slate-400 font-mono mt-1 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 leading-snug">{q.questionText}</p>
                      {q.aiGenerated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full mt-1">
                          <Sparkles size={9} /> AI
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedId(expanded ? null : q.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        aria-label={expanded ? 'Collapse' : 'Expand'}
                      >
                        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      <button
                        onClick={() => setEditQ(q)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        aria-label="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmId(q.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="px-4 pb-3 ms-8">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {[q.correctAnswer, q.optionA, q.optionB].map((opt, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-2 rounded-xl border text-xs font-medium ${
                              idx === 0
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-white text-slate-600'
                            }`}
                          >
                            {idx === 0 && <span className="block text-[10px] text-emerald-500 mb-0.5">Correct</span>}
                            {opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                          <span className="font-semibold text-slate-600">Explanation: </span>
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button onClick={onStudy} disabled={questions.length === 0}>
              Study this Deck
            </Button>
          </div>
        </>
      )}

      {/* Modals */}
      <QuizQuestionForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(values) => { void handleCreate(values); }}
        mode="create"
      />
      <QuizQuestionForm
        open={!!editQ}
        onClose={() => setEditQ(null)}
        onSubmit={(values) => { void handleUpdate(values); }}
        initial={editQ ?? undefined}
        mode="edit"
      />
      <QuizAIGenerateModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        quizDeckId={deckId}
        onGenerated={onAppendQuestions}
      />
      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId) void onDeleteQuestion(confirmId); setConfirmId(null); }}
        title="Delete Question"
        message="Delete this question? This cannot be undone."
      />
    </div>
  );
}
