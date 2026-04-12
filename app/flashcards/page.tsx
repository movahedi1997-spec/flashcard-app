'use client';

/**
 * app/flashcards/page.tsx  (TASK-006 update)
 *
 * Orchestrates the flashcard app shell.
 *
 * Key changes from legacy version:
 *  - useBoxes / useCards now async (no localStorage)
 *  - updateCardScore removed — SRS grading is handled inside StudySession
 *  - ModeSelector bypassed — SRS algorithm determines session cards automatically
 *  - View state simplified: no 'study-select' step, no StudyMode param
 *  - loadCards(deckId) called whenever the user navigates into a box/study view
 *  - BoxList / CardList receive loading + error props from hooks
 *  - StudySession receives deck object + onBack only
 *  - Import flow: BoxList notifies via onImport(title, rawCards); parent creates
 *    deck, then bulk-imports cards with the new deckId
 */

import { useState, useCallback, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { useBoxes } from '@/hooks/useBoxes';
import { useCards } from '@/hooks/useCards';
import type { Deck } from '@/types/api';
import BoxList from '@/components/flashcard/boxes/BoxList';
import CardList from '@/components/flashcard/cards/CardList';
import StudySession from '@/components/flashcard/study/StudySession';
import SplashPage from '@/components/flashcard/SplashPage';
import Link from 'next/link';

// ── View state ────────────────────────────────────────────────────────────────

type View =
  | { type: 'home' }
  | { type: 'box'; deckId: string }
  | { type: 'study'; deckId: string };

// ── Raw card shape from BoxList JSON import ───────────────────────────────────

interface RawImportCard {
  front: string;
  back: string;
  frontImageUrl?: string;
  backImageUrl?: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<View>({ type: 'home' });

  // ── Hooks ─────────────────────────────────────────────────────────────────────
  const {
    decks,
    loading: decksLoading,
    error: decksError,
    createBox,
    updateBox,
    deleteBox,
    importBoxes,
  } = useBoxes();

  const {
    cards,
    loading: cardsLoading,
    error: cardsError,
    loadCards,
    getBoxCards,
    createCard,
    updateCard,
    deleteCard,
    deleteBoxCards,
    importCards,
  } = useCards();

  // ── Navigation helpers ────────────────────────────────────────────────────────

  const goHome = useCallback(() => setView({ type: 'home' }), []);

  const goToBox = useCallback(
    (deckId: string) => {
      setView({ type: 'box', deckId });
      void loadCards(deckId);
    },
    [loadCards],
  );

  const goToStudy = useCallback(
    (deckId: string) => {
      setView({ type: 'study', deckId });
    },
    [],
  );

  // Reload cards whenever the box view is re-entered (handles edits, deletes, etc.)
  useEffect(() => {
    if (view.type === 'box') {
      void loadCards(view.deckId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ── Deck CRUD ─────────────────────────────────────────────────────────────────

  const handleDeleteBox = useCallback(
    async (id: string) => {
      await deleteBox(id);
      deleteBoxCards(id);
      // Navigate home if we were inside the deleted deck
      if (view.type !== 'home' && 'deckId' in view && view.deckId === id) {
        goHome();
      }
    },
    [deleteBox, deleteBoxCards, view, goHome],
  );

  // ── JSON import ───────────────────────────────────────────────────────────────

  /**
   * Called by BoxList after parsing a JSON file.
   * Creates the deck, then imports each card under the new deckId.
   */
  const handleImport = useCallback(
    async (deckTitle: string, rawCards: RawImportCard[]) => {
      const deck = await createBox(deckTitle);
      if (!deck) return;

      if (rawCards.length > 0) {
        await importCards(
          rawCards.map((c) => ({
            deckId: deck.id,
            front: c.front,
            back: c.back,
            frontImageUrl: c.frontImageUrl,
            backImageUrl: c.backImageUrl,
          })),
        );
      }
    },
    [createBox, importCards],
  );

  // ── Unused importBoxes — satisfied for hook completeness ─────────────────────
  void importBoxes; // retained in hook but not needed in current UI flows

  // ── Resolve current deck ──────────────────────────────────────────────────────

  function getCurrentDeck(): Deck | undefined {
    if ('deckId' in view) return decks.find((d) => d.id === view.deckId);
    return undefined;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  function renderView() {
    // ── Home: deck list ──────────────────────────────────────────────────────
    if (view.type === 'home') {
      return (
        <BoxList
          decks={decks}
          loading={decksLoading}
          error={decksError}
          onCreateBox={createBox}
          onUpdateBox={updateBox}
          onDeleteBox={handleDeleteBox}
          onOpenBox={goToBox}
          onStudyBox={goToStudy}
          onImport={handleImport}
        />
      );
    }

    // ── Box: card list ───────────────────────────────────────────────────────
    if (view.type === 'box') {
      const deck = getCurrentDeck();
      if (!deck) { goHome(); return null; }
      const boxCards = getBoxCards(view.deckId);
      return (
        <CardList
          deck={deck}
          cards={boxCards}
          loading={cardsLoading}
          error={cardsError}
          onCreateCard={(front, back, fi, bi) => createCard(view.deckId, front, back, fi, bi)}
          onUpdateCard={updateCard}
          onDeleteCard={deleteCard}
          onBack={goHome}
          onStudy={() => goToStudy(view.deckId)}
        />
      );
    }

    // ── Study: SRS session ───────────────────────────────────────────────────
    if (view.type === 'study') {
      const deck = getCurrentDeck();
      if (!deck) { goHome(); return null; }
      return (
        <StudySession
          deck={deck}
          onBack={() => goToBox(view.deckId)}
        />
      );
    }

    return null;
  }

  // ── Splash screen ─────────────────────────────────────────────────────────────

  if (showSplash) {
    return <SplashPage onStart={() => setShowSplash(false)} />;
  }

  // ── Active deck for breadcrumbs ───────────────────────────────────────────────

  const activeDeck = getCurrentDeck();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header / breadcrumb ───────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={goHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <BookOpen size={16} />
            </div>
            <span className="font-bold text-slate-800">FlashCards</span>
          </button>

          {view.type !== 'home' && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500 ml-2">
              <span>/</span>
              <button
                onClick={goHome}
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Decks
              </button>
              {activeDeck && (
                <>
                  <span>/</span>
                  <button
                    onClick={() =>
                      view.type !== 'box' ? goToBox(activeDeck.id) : undefined
                    }
                    className={`hover:text-indigo-600 transition-colors cursor-pointer ${
                      view.type === 'box' ? 'text-slate-800 font-medium' : ''
                    }`}
                  >
                    {activeDeck.title}
                  </button>
                </>
              )}
              {view.type === 'study' && (
                <>
                  <span>/</span>
                  <span className="text-slate-800 font-medium">Study</span>
                </>
              )}
            </div>
          )}

          <div className="ml-auto">
            <Link
              href="/dashboard"
              className="text-sm text-slate-500 hover:text-indigo-600 transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {renderView()}
      </main>
    </div>
  );
}
