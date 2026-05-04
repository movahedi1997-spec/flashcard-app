'use client';

import { useState, useEffect, useCallback } from 'react';
import type { QuizDeck, Subject } from '@/types/api';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

export type QuizDeckUpdate = Partial<Pick<QuizDeck, 'title' | 'description' | 'subject' | 'isPublic' | 'color' | 'emoji'>>;

interface State {
  decks: QuizDeck[];
  loading: boolean;
  error: string | null;
}

export function useQuizDecks() {
  const [state, setState] = useState<State>({ decks: [], loading: true, error: null });

  const reload = useCallback(async () => {
    setState((p) => ({ ...p, loading: true, error: null }));
    try {
      const res = await fetchWithRefresh('/api/quiz/decks');
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      const { decks } = (await res.json()) as { decks: QuizDeck[] };
      setState({ decks, loading: false, error: null });
    } catch (err) {
      setState((p) => ({ ...p, loading: false, error: err instanceof Error ? err.message : 'Failed to load quiz decks.' }));
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const createDeck = useCallback(async (
    title: string,
    description = '',
    subject?: Subject | null,
    color = 'indigo',
    emoji = '🧠',
  ): Promise<QuizDeck | null> => {
    try {
      const res = await fetchWithRefresh('/api/quiz/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), subject: subject ?? null, color, emoji }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to create quiz deck.');
      }
      const { deck } = (await res.json()) as { deck: QuizDeck };
      setState((p) => ({ ...p, decks: [deck, ...p.decks] }));
      return deck;
    } catch (err) {
      console.error('[useQuizDecks] createDeck:', err);
      return null;
    }
  }, []);

  const updateDeck = useCallback(async (id: string, updates: QuizDeckUpdate): Promise<void> => {
    setState((p) => ({ ...p, decks: p.decks.map((d) => d.id === id ? { ...d, ...updates } : d) }));
    try {
      const body: Record<string, unknown> = {};
      if ('title' in updates) body.title = updates.title;
      if ('description' in updates) body.description = updates.description;
      if ('subject' in updates) body.subject = updates.subject;
      if ('isPublic' in updates) body.is_public = updates.isPublic;
      if ('color' in updates) body.color = updates.color;
      if ('emoji' in updates) body.emoji = updates.emoji;
      const res = await fetchWithRefresh(`/api/quiz/decks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { await reload(); throw new Error('Failed to update quiz deck.'); }
      const { deck } = (await res.json()) as { deck: QuizDeck };
      setState((p) => ({ ...p, decks: p.decks.map((d) => d.id === id ? { ...d, ...deck } : d) }));
    } catch (err) {
      console.error('[useQuizDecks] updateDeck:', err);
    }
  }, [reload]);

  const deleteDeck = useCallback(async (id: string): Promise<void> => {
    setState((p) => ({ ...p, decks: p.decks.filter((d) => d.id !== id) }));
    try {
      const res = await fetchWithRefresh(`/api/quiz/decks/${id}`, { method: 'DELETE' });
      if (!res.ok) { await reload(); throw new Error('Failed to delete quiz deck.'); }
    } catch (err) {
      console.error('[useQuizDecks] deleteDeck:', err);
    }
  }, [reload]);

  return {
    decks: state.decks,
    loading: state.loading,
    error: state.error,
    createDeck,
    updateDeck,
    deleteDeck,
    reload,
  };
}
