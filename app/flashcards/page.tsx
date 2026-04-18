'use client';

import { useState, useCallback, useEffect } from 'react';
import { BookOpen, ArrowLeft, Play, Plus } from 'lucide-react';
import Link from 'next/link';
import { useBoxes } from '@/hooks/useBoxes';
import { useCards } from '@/hooks/useCards';
import type { Deck } from '@/types/api';
import BoxList from '@/components/flashcard/boxes/BoxList';
import CardList from '@/components/flashcard/cards/CardList';
import StudySession from '@/components/flashcard/study/StudySession';
import CramSession from '@/components/flashcard/study/CramSession';
import ModeSelector from '@/components/flashcard/study/ModeSelector';
import SplashPage from '@/components/flashcard/SplashPage';
import BottomNav from '@/components/BottomNav';

type View =
  | { type: 'home' }
  | { type: 'box'; deckId: string }
  | { type: 'study-select'; deckId: string }
  | { type: 'study-srs'; deckId: string }
  | { type: 'study-cram'; deckId: string };

interface RawImportCard {
  front: string;
  back: string;
  frontImageUrl?: string;
  backImageUrl?: string;
}

export default function FlashcardsPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<View>({ type: 'home' });
  const [addCardOpen, setAddCardOpen] = useState(false);

  const {
    decks, loading: decksLoading, error: decksError,
    createBox, updateBox, deleteBox, importBoxes, syncDeck,
  } = useBoxes();

  const {
    cards, loading: cardsLoading, error: cardsError,
    loadCards, getBoxCards, createCard, updateCard, deleteCard, deleteBoxCards, importCards,
  } = useCards();

  const goHome = useCallback(() => setView({ type: 'home' }), []);

  const goToBox = useCallback((deckId: string) => {
    setView({ type: 'box', deckId });
    void loadCards(deckId);
  }, [loadCards]);

  const goToStudy = useCallback((deckId: string) => {
    void loadCards(deckId);
    setView({ type: 'study-select', deckId });
  }, [loadCards]);

  useEffect(() => {
    if (view.type === 'box') void loadCards(view.deckId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const handleDeleteBox = useCallback(async (id: string) => {
    await deleteBox(id);
    deleteBoxCards(id);
    if (view.type !== 'home' && 'deckId' in view && view.deckId === id) goHome();
  }, [deleteBox, deleteBoxCards, view, goHome]);

  const handleImport = useCallback(async (deckTitle: string, rawCards: RawImportCard[]) => {
    const deck = await createBox(deckTitle);
    if (!deck) return;
    if (rawCards.length > 0) {
      await importCards(rawCards.map((c) => ({
        deckId: deck.id, front: c.front, back: c.back,
        frontImageUrl: c.frontImageUrl, backImageUrl: c.backImageUrl,
      })));
    }
  }, [createBox, importCards]);

  void importBoxes;

  function getCurrentDeck(): Deck | undefined {
    if ('deckId' in view) return decks.find((d) => d.id === view.deckId);
    return undefined;
  }

  // ── Back action per view ───────────────────────────────────────────────────

  function getBackAction(): (() => void) | null {
    if (view.type === 'home') return null;
    if (view.type === 'box') return goHome;
    if (view.type === 'study-select') return () => goToBox((view as { deckId: string }).deckId);
    if (view.type === 'study-srs') return () => setView({ type: 'study-select', deckId: (view as { deckId: string }).deckId });
    if (view.type === 'study-cram') return () => setView({ type: 'study-select', deckId: (view as { deckId: string }).deckId });
    return null;
  }

  function getHeaderTitle(): string {
    if (view.type === 'home') return '';
    const deck = getCurrentDeck();
    if (view.type === 'box') return deck?.title ?? '';
    if (view.type === 'study-select') return 'Choose Mode';
    if (view.type === 'study-srs') return deck?.title ?? 'Daily Review';
    if (view.type === 'study-cram') return deck?.title ?? 'Turbo';
    return '';
  }

  function renderView() {
    if (view.type === 'home') {
      return (
        <BoxList
          decks={decks} loading={decksLoading} error={decksError}
          onCreateBox={createBox} onUpdateBox={updateBox} onDeleteBox={handleDeleteBox}
          onOpenBox={goToBox} onStudyBox={goToStudy} onImport={handleImport}
        />
      );
    }

    if (view.type === 'box') {
      const deck = getCurrentDeck();
      if (!deck) { goHome(); return null; }
      const boxCards = getBoxCards(view.deckId);
      return (
        <CardList
          deck={deck} cards={boxCards} loading={cardsLoading} error={cardsError}
          onCreateCard={(front, back, fi, bi) => createCard(view.deckId, front, back, fi, bi)}
          onUpdateCard={updateCard} onDeleteCard={deleteCard}
          onBack={goHome} onStudy={() => goToStudy(view.deckId)}
          onUpdateDeck={syncDeck}
          addCardOpen={addCardOpen} onAddCardOpenChange={setAddCardOpen}
        />
      );
    }

    if (view.type === 'study-select') {
      const deck = getCurrentDeck();
      if (!deck) { goHome(); return null; }
      const boxCards = getBoxCards(view.deckId);
      return (
        <ModeSelector
          deck={deck}
          cardCount={boxCards.length}
          dueCount={boxCards.filter((c) => {
            const due = c.srs?.dueDate;
            return !due || new Date(due) <= new Date();
          }).length}
          onSelect={(mode) => setView({ type: mode === 'srs' ? 'study-srs' : 'study-cram', deckId: view.deckId })}
          onBack={() => goToBox(view.deckId)}
        />
      );
    }

    if (view.type === 'study-srs') {
      const deck = getCurrentDeck();
      if (!deck) { goHome(); return null; }
      return (
        <StudySession
          deck={deck}
          onBack={() => setView({ type: 'study-select', deckId: view.deckId })}
        />
      );
    }

    if (view.type === 'study-cram') {
      const deck = getCurrentDeck();
      if (!deck) { goHome(); return null; }
      const boxCards = getBoxCards(view.deckId);
      return (
        <CramSession
          deck={deck} cards={boxCards}
          onBack={() => setView({ type: 'study-select', deckId: view.deckId })}
        />
      );
    }

    return null;
  }

  if (showSplash) return <SplashPage onStart={() => setShowSplash(false)} />;

  const activeDeck = getCurrentDeck();
  const backAction = getBackAction();

  return (
    <div className="min-h-screen">
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header
        className="bg-white border-b border-slate-200 sticky top-0 z-30"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2">

          {view.type === 'home' ? (
            /* Home: logo + dashboard link */
            <>
              <button
                onClick={goHome}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <BookOpen size={16} />
                </div>
                <span className="font-bold text-slate-800">Flashcard<span className="text-violet-600">AI</span></span>
              </button>
              <div className="ml-auto">
                <Link href="/dashboard" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                  ← Dashboard
                </Link>
              </div>
            </>
          ) : (
            /* Sub-view: back ← · title · right action */
            <>
              {/* Back button — large tap target */}
              <button
                onClick={backAction ?? goHome}
                className="flex items-center gap-1.5 -ml-1 px-3 py-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
                <span className="text-sm font-semibold hidden sm:inline">Back</span>
              </button>

              {/* Center title */}
              <h1 className="flex-1 text-center text-sm font-bold text-slate-800 truncate px-2">
                {getHeaderTitle()}
              </h1>

              {/* Right action */}
              {view.type === 'box' && activeDeck ? (
                <div className="flex items-center gap-1.5">
                  {/* Add Card — icon on mobile, text on desktop */}
                  <button
                    onClick={() => setAddCardOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition"
                    aria-label="Add card"
                  >
                    <Plus size={16} />
                    <span className="text-xs font-semibold hidden sm:inline">Add</span>
                  </button>
                  {/* Study */}
                  <button
                    onClick={() => goToStudy(view.deckId)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition"
                  >
                    <Play size={14} />
                    <span className="hidden sm:inline">Study</span>
                  </button>
                </div>
              ) : (
                /* Spacer to keep title centered */
                <div className="w-16 sm:w-20" />
              )}
            </>
          )}
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-8">
        {renderView()}
      </main>

      <BottomNav />
    </div>
  );
}
