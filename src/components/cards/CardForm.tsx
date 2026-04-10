import { type FormEvent, useState } from 'react';
import Modal from '../ui/Modal';
import Textarea from '../ui/Textarea';
import ImageUpload from '../ui/ImageUpload';
import Button from '../ui/Button';
import type { Card } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (question: string, answer: string, questionImage?: string, answerImage?: string) => void;
  initialCard?: Card;
  mode: 'create' | 'edit';
}

export default function CardForm({ open, onClose, onSubmit, initialCard, mode }: Props) {
  const [question, setQuestion] = useState(initialCard?.question ?? '');
  const [answer, setAnswer] = useState(initialCard?.answer ?? '');
  const [questionImage, setQuestionImage] = useState<string | undefined>(initialCard?.questionImage);
  const [answerImage, setAnswerImage] = useState<string | undefined>(initialCard?.answerImage);
  const [errors, setErrors] = useState({ question: '', answer: '' });

  // Sync values when editing a different card
  if (mode === 'edit' && open && initialCard) {
    const inSync =
      question === initialCard.question &&
      answer === initialCard.answer &&
      questionImage === initialCard.questionImage &&
      answerImage === initialCard.answerImage;
    if (!inSync) {
      setQuestion(initialCard.question);
      setAnswer(initialCard.answer);
      setQuestionImage(initialCard.questionImage);
      setAnswerImage(initialCard.answerImage);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = { question: '', answer: '' };
    if (!question.trim() && !questionImage) errs.question = 'Add a question text or image.';
    if (!answer.trim() && !answerImage) errs.answer = 'Add an answer text or image.';
    if (errs.question || errs.answer) { setErrors(errs); return; }
    onSubmit(question.trim(), answer.trim(), questionImage, answerImage);
    resetForm();
    onClose();
  }

  function resetForm() {
    setQuestion('');
    setAnswer('');
    setQuestionImage(undefined);
    setAnswerImage(undefined);
    setErrors({ question: '', answer: '' });
  }

  function handleClose() {
    setQuestion(initialCard?.question ?? '');
    setAnswer(initialCard?.answer ?? '');
    setQuestionImage(initialCard?.questionImage);
    setAnswerImage(initialCard?.answerImage);
    setErrors({ question: '', answer: '' });
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={mode === 'create' ? 'New Card' : 'Edit Card'} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Question side */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Front · Question</p>
          <Textarea
            placeholder="What is the capital of France?"
            value={question}
            onChange={e => { setQuestion(e.target.value); setErrors(p => ({ ...p, question: '' })); }}
            error={errors.question}
            rows={2}
            autoFocus
          />
          <ImageUpload
            label="Image (optional)"
            value={questionImage}
            onChange={v => setQuestionImage(v)}
          />
        </div>

        {/* Answer side */}
        <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Back · Answer</p>
          <Textarea
            placeholder="Paris"
            value={answer}
            onChange={e => { setAnswer(e.target.value); setErrors(p => ({ ...p, answer: '' })); }}
            error={errors.answer}
            rows={2}
          />
          <ImageUpload
            label="Image (optional)"
            value={answerImage}
            onChange={v => setAnswerImage(v)}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={handleClose}>Cancel</Button>
          <Button type="submit">{mode === 'create' ? 'Add Card' : 'Save Changes'}</Button>
        </div>
      </form>
    </Modal>
  );
}
