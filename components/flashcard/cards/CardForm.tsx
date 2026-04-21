'use client';

/**
 * components/flashcard/cards/CardForm.tsx  (TASK-006 update)
 *
 * Updated from legacy Card type (question/answer/questionImage/answerImage)
 * to ApiCard type (front/back/frontImageUrl/backImageUrl).
 * onSubmit signature updated to match useCards.createCard / updateCard.
 */

import { type FormEvent, useState } from 'react';
import { Sparkles } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import ImageUpload from '@/components/ui/ImageUpload';
import Button from '@/components/ui/Button';
import AIImproveModal from './AIImproveModal';
import type { ApiCard } from '@/types/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    front: string,
    back: string,
    frontImageUrl?: string,
    backImageUrl?: string,
  ) => void;
  initialCard?: ApiCard;
  mode: 'create' | 'edit';
}

export default function CardForm({ open, onClose, onSubmit, initialCard, mode }: Props) {
  const [front, setFront] = useState(initialCard?.front ?? '');
  const [back, setBack] = useState(initialCard?.back ?? '');
  const [frontImageUrl, setFrontImageUrl] = useState<string | undefined>(
    initialCard?.frontImageUrl ?? undefined,
  );
  const [backImageUrl, setBackImageUrl] = useState<string | undefined>(
    initialCard?.backImageUrl ?? undefined,
  );
  const [errors, setErrors] = useState({ front: '', back: '' });
  const [improveOpen, setImproveOpen] = useState(false);

  // Sync state when switching to a different card in edit mode
  if (mode === 'edit' && open && initialCard) {
    const inSync =
      front === initialCard.front &&
      back === initialCard.back &&
      frontImageUrl === (initialCard.frontImageUrl ?? undefined) &&
      backImageUrl === (initialCard.backImageUrl ?? undefined);
    if (!inSync) {
      setFront(initialCard.front);
      setBack(initialCard.back);
      setFrontImageUrl(initialCard.frontImageUrl ?? undefined);
      setBackImageUrl(initialCard.backImageUrl ?? undefined);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = { front: '', back: '' };
    if (!front.trim() && !frontImageUrl) errs.front = 'Add a question text or image.';
    if (!back.trim() && !backImageUrl) errs.back = 'Add an answer text or image.';
    if (errs.front || errs.back) { setErrors(errs); return; }
    onSubmit(front.trim(), back.trim(), frontImageUrl, backImageUrl);
    resetForm();
    onClose();
  }

  function resetForm() {
    setFront('');
    setBack('');
    setFrontImageUrl(undefined);
    setBackImageUrl(undefined);
    setErrors({ front: '', back: '' });
  }

  function handleClose() {
    setFront(initialCard?.front ?? '');
    setBack(initialCard?.back ?? '');
    setFrontImageUrl(initialCard?.frontImageUrl ?? undefined);
    setBackImageUrl(initialCard?.backImageUrl ?? undefined);
    setErrors({ front: '', back: '' });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={mode === 'create' ? 'New Card' : 'Edit Card'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Front · Question
          </p>
          <Textarea
            placeholder="What is the capital of France?"
            value={front}
            onChange={(e) => { setFront(e.target.value); setErrors((p) => ({ ...p, front: '' })); }}
            error={errors.front}
            rows={2}
            autoFocus
          />
          <ImageUpload
            label="Image (optional)"
            value={frontImageUrl}
            onChange={(v) => setFrontImageUrl(v)}
          />
        </div>

        <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Back · Answer
          </p>
          <Textarea
            placeholder="Paris"
            value={back}
            onChange={(e) => { setBack(e.target.value); setErrors((p) => ({ ...p, back: '' })); }}
            error={errors.back}
            rows={2}
          />
          <ImageUpload
            label="Image (optional)"
            value={backImageUrl}
            onChange={(v) => setBackImageUrl(v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setImproveOpen(true)}
            disabled={!front.trim() && !back.trim()}
            className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles size={13} /> Improve with AI
          </button>
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={handleClose}>Cancel</Button>
            <Button type="submit">{mode === 'create' ? 'Add Card' : 'Save Changes'}</Button>
          </div>
        </div>
      </form>

      <AIImproveModal
        open={improveOpen}
        onClose={() => setImproveOpen(false)}
        currentFront={front}
        currentBack={back}
        onApply={(f, b) => { setFront(f); setBack(b); }}
      />
    </Modal>
  );
}
