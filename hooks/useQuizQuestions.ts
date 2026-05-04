'use client';

import { useState, useCallback } from 'react';
import type { QuizQuestion } from '@/types/api';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

export type QuizQuestionUpdate = Partial<Pick<
  QuizQuestion, 'questionText' | 'correctAnswer' | 'optionA' | 'optionB' | 'explanation'
>>;

export function useQuizQuestions() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = useCallback(async (deckId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRefresh(`/api/quiz/decks/${deckId}/questions`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      const { questions: fetched } = (await res.json()) as { questions: QuizQuestion[] };
      setQuestions(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createQuestion = useCallback(async (
    deckId: string,
    data: { questionText: string; correctAnswer: string; optionA: string; optionB: string; explanation?: string },
  ): Promise<QuizQuestion | null> => {
    try {
      const res = await fetchWithRefresh(`/api/quiz/decks/${deckId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: data.questionText.trim(),
          correct_answer: data.correctAnswer.trim(),
          option_a: data.optionA.trim(),
          option_b: data.optionB.trim(),
          explanation: data.explanation?.trim() ?? null,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to create question.');
      }
      const { question } = (await res.json()) as { question: QuizQuestion };
      setQuestions((prev) => [...prev, question]);
      return question;
    } catch (err) {
      console.error('[useQuizQuestions] createQuestion:', err);
      return null;
    }
  }, []);

  const updateQuestion = useCallback(async (id: string, updates: QuizQuestionUpdate): Promise<void> => {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, ...updates } : q));
    try {
      const body: Record<string, unknown> = {};
      if ('questionText' in updates) body.question_text = updates.questionText;
      if ('correctAnswer' in updates) body.correct_answer = updates.correctAnswer;
      if ('optionA' in updates) body.option_a = updates.optionA;
      if ('optionB' in updates) body.option_b = updates.optionB;
      if ('explanation' in updates) body.explanation = updates.explanation;
      const res = await fetchWithRefresh(`/api/quiz/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to update question.');
    } catch (err) {
      console.error('[useQuizQuestions] updateQuestion:', err);
    }
  }, []);

  const deleteQuestion = useCallback(async (id: string): Promise<void> => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    try {
      const res = await fetchWithRefresh(`/api/quiz/questions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete question.');
    } catch (err) {
      console.error('[useQuizQuestions] deleteQuestion:', err);
    }
  }, []);

  const appendQuestions = useCallback((newQuestions: QuizQuestion[]) => {
    setQuestions((prev) => [...prev, ...newQuestions]);
  }, []);

  return { questions, loading, error, loadQuestions, createQuestion, updateQuestion, deleteQuestion, appendQuestions };
}
