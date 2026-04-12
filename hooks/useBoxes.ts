'use client';

/**
 * hooks/useBoxes.ts  (TASK-003 async rewrite)
 *
 * Replaces the old localStorage-backed useBoxes hook with async calls to
 * the /api/decks REST endpoints.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTE FOR FRONTEND (TASK-006)
 * ─────────────────────────────────────────────────────────────────────────────
 * The legacy `Box` type (name, createdAt) has been replaced by `Deck`
 * (title, description, isPublic, subject, cardCount, …).
 *
 *  Old hook signature  →  New hook signature
 *  ─────────────────────────────────────────
 *  boxes: Box[]        →  boxes / decks: Deck[]   (same reference, two aliases)
 *  createBox(name)     →  createBox(name, description?, subject?) → Promise<Deck|null>
 *  updateBox(id, name) →  updateBox(id, { title?, description?, subject?, isPublic? })
 *  deleteBox(id)       →  deleteBox(id)  (now async, safe to fire-and-forget)
 *  importBoxes(boxes)  →  importBoxes(items)  (now async, returns Promise<Deck[]>)
 *
 * All mutations perform optimistic UI updates with server reconciliation.
 * Components should handle `loading` and `error` states.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import type { Deck, Subject } from '@/types/api';

// Re-export for consumers that still import Box from here
export type { Deck };
export type Box = Deck; // legacy alias — TASK-006 will remove this

// ── Update shape ──────────────────────────────────────────────────────────────

export type DeckUpdate = Partial<Pick<Deck, 'title' | 'description' | 'subject' | 'isPublic'>>;

// ── Hook state ────────────────────────────────────────────────────────────────

interface UseBoxesState {
  decks: Deck[];
  loading: boolean;
  error: string | null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBoxes() {
  const [state, setState] = useState<UseBoxesState>({
    decks: [],
    loading: true,
    error: null,
  });

  // ── Internal helpers ────────────────────────────────────────────────────────

  const setDecks = (decks: Deck[]) =>
    setState((prev) => ({ ...prev, decks, loading: false, error: null }));

  const setError = (error: string) =>
    setState((prev) => ({ ...prev, loading: false, error }));

  // ── Initial load ────────────────────────────────────────────────────────────

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/decks');
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      const { decks } = (await res.json()) as { decks: Deck[] };
      setDecks(decks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks.');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // ── Create ──────────────────────────────────────────────────────────────────

  /**
   * createBox — create a new deck (server-side).
   * Returns the created Deck on success, null on failure.
   *
   * @param name        Deck title (maps to the legacy "box name").
   * @param description Optional description (defaults to empty string).
   * @param subject     Optional subject tag (medicine/pharmacy/chemistry/other).
   */
  const createBox = useCallback(
    async (
      name: string,
      description = '',
      subject?: Subject,
    ): Promise<Deck | null> => {
      try {
        const res = await fetch('/api/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: name.trim(),
            description: description.trim(),
            subject: subject ?? null,
          }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Failed to create deck.');
        }

        const { deck } = (await res.json()) as { deck: Deck };

        // Prepend to list (most recent first, matching API sort order)
        setState((prev) => ({ ...prev, decks: [deck, ...prev.decks] }));
        return deck;
      } catch (err) {
        console.error('[useBoxes] createBox:', err);
        return null;
      }
    },
    [],
  );

  // ── Update ──────────────────────────────────────────────────────────────────

  /**
   * updateBox — partially update a deck's fields.
   * Applies an optimistic UI update immediately; rolls back on failure.
   *
   * @param id      UUID of the deck to update.
   * @param updates Object with any subset of: title, description, subject, isPublic.
   */
  const updateBox = useCallback(
    async (id: string, updates: DeckUpdate): Promise<void> => {
      // Optimistic update
      setState((prev) => ({
        ...prev,
        decks: prev.decks.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      }));

      try {
        // Map camelCase client fields → snake_case where the API expects it
        const body: Record<string, unknown> = {};
        if ('title' in updates) body.title = updates.title;
        if ('description' in updates) body.description = updates.description;
        if ('subject' in updates) body.subject = updates.subject;
        if ('isPublic' in updates) body.is_public = updates.isPublic;

        const res = await fetch(`/api/decks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          // Rollback by refetching the authoritative list from the server
          await reload();
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? 'Failed to update deck.');
        }

        // Reconcile with server-returned data (timestamps, etc.)
        const { deck } = (await res.json()) as { deck: Deck };
        setState((prev) => ({
          ...prev,
          decks: prev.decks.map((d) => (d.id === id ? { ...d, ...deck } : d)),
        }));
      } catch (err) {
        console.error('[useBoxes] updateBox:', err);
      }
    },
    [reload],
  );

  // ── Delete ──────────────────────────────────────────────────────────────────

  /**
   * deleteBox — delete a deck and all its cards (server-side cascade).
   * Applies an optimistic removal immediately; rolls back on failure.
   *
   * @param id  UUID of the deck to delete.
   */
  const deleteBox = useCallback(
    async (id: string): Promise<void> => {
      // Optimistic removal
      setState((prev) => ({
        ...prev,
        decks: prev.decks.filter((d) => d.id !== id),
      }));

      try {
        const res = await fetch(`/api/decks/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          // Rollback
          await reload();
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error ?? 'Failed to delete deck.');
        }
      } catch (err) {
        console.error('[useBoxes] deleteBox:', err);
      }
    },
    [reload],
  );

  // ── Bulk import ─────────────────────────────────────────────────────────────

  /**
   * importBoxes — create multiple decks sequentially.
   * Each item is passed to createBox individually (no bulk endpoint yet).
   * Returns the array of successfully created Deck objects.
   *
   * @param items  Array of { name, description? } objects.
   */
  const importBoxes = useCallback(
    async (
      items: Array<{ name: string; description?: string }>,
    ): Promise<Deck[]> => {
      const created: Deck[] = [];
      for (const item of items) {
        const deck = await createBox(item.name, item.description ?? '');
        if (deck) created.push(deck);
      }
      return created;
    },
    [createBox],
  );

  // ── Public API ──────────────────────────────────────────────────────────────

  return {
    /** Alias kept for legacy component compatibility — same reference as `decks`. */
    boxes: state.decks,
    decks: state.decks,
    loading: state.loading,
    error: state.error,
    createBox,
    updateBox,
    deleteBox,
    importBoxes,
    reload,
  };
}
