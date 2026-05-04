'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { QuizQuestion } from '@/types/api';

export interface QuizQuestionFormValues {
  questionText: string;
  correctAnswer: string;
  optionA: string;
  optionB: string;
  explanation: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: QuizQuestionFormValues) => void;
  initial?: Partial<QuizQuestion>;
  mode: 'create' | 'edit';
}

const EMPTY: QuizQuestionFormValues = {
  questionText: '',
  correctAnswer: '',
  optionA: '',
  optionB: '',
  explanation: '',
};

export default function QuizQuestionForm({ open, onClose, onSubmit, initial, mode }: Props) {
  const [form, setForm] = useState<QuizQuestionFormValues>(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        questionText: initial?.questionText ?? '',
        correctAnswer: initial?.correctAnswer ?? '',
        optionA: initial?.optionA ?? '',
        optionB: initial?.optionB ?? '',
        explanation: initial?.explanation ?? '',
      });
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set(field: keyof QuizQuestionFormValues, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.questionText.trim()) { setError('Question text is required.'); return; }
    if (!form.correctAnswer.trim()) { setError('Correct answer is required.'); return; }
    if (!form.optionA.trim()) { setError('Option A is required.'); return; }
    if (!form.optionB.trim()) { setError('Option B is required.'); return; }
    onSubmit({
      questionText: form.questionText.trim(),
      correctAnswer: form.correctAnswer.trim(),
      optionA: form.optionA.trim(),
      optionB: form.optionB.trim(),
      explanation: form.explanation.trim(),
    });
    onClose();
  }

  const fieldCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400';
  const labelCls = 'text-sm font-medium text-slate-700';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Add Question' : 'Edit Question'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Question</label>
          <textarea
            value={form.questionText}
            onChange={(e) => set('questionText', e.target.value)}
            placeholder="Enter the question…"
            rows={3}
            maxLength={1000}
            autoFocus
            className={`${fieldCls} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>
            Correct Answer{' '}
            <span className="text-emerald-600 font-normal text-xs">(Option displayed as correct)</span>
          </label>
          <input
            type="text"
            value={form.correctAnswer}
            onChange={(e) => set('correctAnswer', e.target.value)}
            placeholder="Enter the correct answer…"
            maxLength={500}
            className={fieldCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Option A <span className="text-slate-400 font-normal text-xs">(wrong)</span></label>
            <input
              type="text"
              value={form.optionA}
              onChange={(e) => set('optionA', e.target.value)}
              placeholder="Wrong option A…"
              maxLength={500}
              className={fieldCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Option B <span className="text-slate-400 font-normal text-xs">(wrong)</span></label>
            <input
              type="text"
              value={form.optionB}
              onChange={(e) => set('optionB', e.target.value)}
              placeholder="Wrong option B…"
              maxLength={500}
              className={fieldCls}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>
            Explanation{' '}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={form.explanation}
            onChange={(e) => set('explanation', e.target.value)}
            placeholder="Shown after answering…"
            rows={2}
            maxLength={1000}
            className={`${fieldCls} resize-none`}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">{mode === 'create' ? 'Add Question' : 'Save Changes'}</Button>
        </div>
      </form>
    </Modal>
  );
}
