'use client';

/**
 * hooks/useCards.ts  (TASK-003 async rewrite)
 *
 * Replaces the old localStorage-backed useCards hook with async calls to
 * the /api/cards and /api/decks/[id]/cards REST endpoints.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTE FOR FRONTEND (TASK-006)
 * ─────────────────────────────────────────────────────────────────────────────
 * The legacy `Card` type (question/answer/score/boxId) has been replaced by
 * `ApiCard` (front/back/deckId/srs/aiGenerated/…).
 *
 *  Old hook signature        →  New hook signature
 *  ─────────────────────────────────────────────────────────────────────
 *  cards: Card[]             →  cards: ApiCard[]
 *  getBoxCards(boxId)        →  getBoxCards(deckId)   (client-side filter)
 *  createCard(boxId,q,a,…)   →  createCard(deckId,front,back,…) → Promise<ApiCard|null>
 *  updateCard(id,q,a,…)      →  updateCard(id, { front?, back?, … }) → Promise<void>
 *  deleteCard(id)            →  deleteCard(id)         (now async)
 *  deleteBoxCards(boxId)     →  deleteBoxCards(deckId) (local only — server cascades)
 *  updateCardScore(id,delta) →  REMOVED — scoring is now SRS-based (TASK-004)
 *  importCards(cards)        →  importCards(items)     (now async → Promise<ApiCard[]>)
 *
 *  New methods:
 *    loadCards(deckId)       → fetch all cards for a deck (populates `cards`)
 *
 * All mutations perform optimistic UI updates with server reconciliation.
 * Components should handle `loading` and `error` states.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react';
import type { ApiCard, SrsState } from '@/types/api';
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

// Re-export for consumers
export type { ApiCard };

// ── Default SRS state ─────────────────────────────────────────────────────────
// Used when the API returns a card without SRS data (e.g. POST /api/cards response).

const DEFAULT_SRS: SrsState = {
  interval: 1,
  easeFactor: 2.5,
  dueDate: new Date(0).toISOString(), // epoch = always due
  reviewCount: 0,
  lastGrade: null,
  lastReviewedAt: null,
};

// ── Partial update types ──────────────────────────────────────────────────────

export type CardUpdate = Partial<
  Pick<ApiCard, 'front' | 'back' | 'frontImageUrl' | 'backImageUrl'>
>;

type ImportItem = {
  deckId: string;
  front: string;
  back: string;
  frontImageUrl?: string;
  backImageUrl?: string;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCards() {
  const [cards, setCards] = useState<ApiCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load cards for a deck ───────────────────────────────────────────────────

  /**
   * loadCards — fetch all cards for a given deck from the server.
   * Replaces the card list in state (does not merge).
   * Each card includes its SRS state for the authenticated user.
   *
   * @param deckId  UUID of the deck whose cards to load.
   */
  const loadCards = useCallback(async (deckId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRefresh(`/api/decks/${deckId}/cards`);
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      const { cards: fetched } = (await res.json()) as { cards: ApiCard[] };
      setCards(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Client-side deck filter ─────────────────────────────────────────────────

  /**
   * getBoxCards — returns cards that belong to a given deck.
   * Filters the in-memory list; call loadCards(deckId) first to populate it.
   *
   * @param deckId  UUID of the deck (legacy name: boxId).
   */
  const getBoxCards = useCallback(
    (deckId: string): ApiCard[] => cards.filter((c) => c.deckId === deckId),
    [cards],
  );

  // ── Create ──────────────────────────────────────────────────────────────────

  /**
   * createCard — create a new card in a deck (server-side).
   * Appends the card to the in-memory list on success.
   *
   * @param deckId        UUID of the deck the card belongs to.
   * @param front         Question / front face text.
   * @param back          Answer / back face text.
   * @param frontImageUrl Optional image URL for the front face.
   * @param backImageUrl  Optional image URL for the back face.
   * @returns             The created ApiCard, or null on failure.
   */
  const createCard = useCallback(
    async (
      deckId: string,
      front: string,
      back: string,
      frontImageUrl?: string,
      backImageUrl?: string,
    ): Promise<ApiCard | null> => {
      try {
        const res = await fetchWithRefresh('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deckId,
            front: front.trim(),
            back: back.trim(),
            frontImageUrl: frontImageUrl ?? null,
            backImageUrl: backImageUrl ?? null,
          }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Failed to create card.');
        }

        const { card } = (await res.json()) as { card: ApiCard };

        // Attach default SRS state (POST /api/cards doesn't return SRS data)
        const withSrs: ApiCard = { ...card, srs: card.srs ?? DEFAULT_SRS };
        setCards((prev) => [...prev, withSrs]);
        return withSrs;
      } catch (err) {
        console.error('[useCards] createCard:', err);
        return null;
      }
    },
    [],
  );

  // ── Update ──────────────────────────────────────────────────────────────────

  /**
   * updateCard — update editable fields of an existing card.
   * Applies an optimistic UI update immediately; reconciles with server data.
   * Note: editing front or back automatically clears the `aiGenerated` flag
   *       on the server (editing = implicit human verification).
   *
   * @param id      UUID of the card to update.
   * @param updates Object with any subset of: front, back, frontImageUrl, backImageUrl.
   */
  const updateCard = useCallback(
    async (id: string, updates: CardUpdate): Promise<void> => {
      // Optimistic update
      setCards((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, ...updates, updatedAt: new Date().toISOString() }
            : c,
        ),
      );

      try {
        const res = await fetchWithRefresh(`/api/cards/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? 'Failed to update card.');
        }

        // Reconcile with authoritative server data (aiGenerated flag, updatedAt, etc.)
        const { card } = (await res.json()) as { card: ApiCard };
        setCards((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...card } : c)),
        );
      } catch (err) {
        console.error('[useCards] updateCard:', err);
      }
    },
    [],
  );

  // ── Delete ──────────────────────────────────────────────────────────────────

  /**
   * deleteCard — delete a single card (server-side).
   * Removes the card optimistically; does NOT roll back on failure
   * (cards can be reloaded via loadCards if needed).
   *
   * @param id  UUID of the card to delete.
   */
  const deleteCard = useCallback(async (id: string): Promise<void> => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetchWithRefresh(`/api/cards/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to delete card.');
      }
    } catch (err) {
      console.error('[useCards] deleteCard:', err);
    }
  }, []);

  // ── Delete by deck (local only) ─────────────────────────────────────────────

  /**
   * deleteBoxCards — remove all in-memory cards for a deck.
   * Does NOT call the server — deck deletion cascades server-side (FK ON DELETE CASCADE).
   * Call this after deleteBox() to keep client state clean.
   *
   * @param deckId  UUID of the deck (legacy name: boxId).
   */
  const deleteBoxCards = useCallback((deckId: string): void => {
    setCards((prev) => prev.filter((c) => c.deckId !== deckId));
  }, []);

  // ── Bulk import ─────────────────────────────────────────────────────────────

  /**
   * importCards — create multiple cards sequentially.
   * Each item is passed to createCard individually (no bulk endpoint yet).
   * Returns only the successfully created cards.
   *
   * @param items  Array of { deckId, front, back, frontImageUrl?, backImageUrl? }.
   */
  const importCards = useCallback(
    async (items: ImportItem[]): Promise<ApiCard[]> => {
      const created: ApiCard[] = [];
      for (const item of items) {
        const card = await createCard(
          item.deckId,
          item.front,
          item.back,
          item.frontImageUrl,
          item.backImageUrl,
        );
        if (card) created.push(card);
      }
      return created;
    },
    [createCard],
  );

  // ── Public API ──────────────────────────────────────────────────────────────

  return {
    cards,
    loading,
    error,
    loadCards,
    getBoxCards,
    createCard,
    updateCard,
    deleteCard,
    deleteBoxCards,
    importCards,
  };
}
