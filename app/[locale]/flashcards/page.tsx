'use client';

import { useState, useCallback, useEffect } from 'react';
import { BookOpen, ArrowLeft, Play, Plus, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useBoxes } from '@/hooks/useBoxes';
import { useCards } from '@/hooks/useCards';
import { useQuizDecks } from '@/hooks/useQuizDecks';
import { useQuizQuestions } from '@/hooks/useQuizQuestions';
import type { Deck, QuizDeck } from '@/types/api';
import BoxList from '@/components/flashcard/boxes/BoxList';
import CardList from '@/components/flashcard/cards/CardList';
import StudySession from '@/components/flashcard/study/StudySession';
import CramSession from '@/components/flashcard/study/CramSession';
import ModeSelector from '@/components/flashcard/study/ModeSelector';
import SplashPage from '@/components/flashcard/SplashPage';
import BottomNav from '@/components/BottomNav';
import QuizDeckList from '@/components/quiz/QuizDeckList';
import QuizQuestionList from '@/components/quiz/QuizQuestionList';
import QuizModeSelector from '@/components/quiz/QuizModeSelector';
import SRSQuizSession from '@/components/quiz/SRSQuizSession';
import TurboQuizSession from '@/components/quiz/TurboQuizSession';

type Tab = 'flashcards' | 'quiz';

type View =
  | { type: 'home' }
  | { type: 'box'; deckId: string }
  | { type: 'study-select'; deckId: string }
  | { type: 'study-srs'; deckId: string }
  | { type: 'study-cram'; deckId: string }
  | { type: 'quiz-home' }
  | { type: 'quiz-box'; deckId: string }
  | { type: 'quiz-study-select'; deckId: string }
  | { type: 'quiz-study-srs'; deckId: string }
  | { type: 'quiz-study-turbo'; deckId: string };

interface RawImportCard {
  front: string;
  back: string;
  frontImageUrl?: string;
  backImageUrl?: string;
}

export default function FlashcardsPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<View>({ type: 'home' });
  const [activeTab, setActiveTab] = useState<Tab>('flashcards');
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const {
    decks, loading: decksLoading, error: decksError,
    createBox, updateBox, deleteBox, importBoxes, syncDeck, reload: reloadDecks,
  } = useBoxes();

  const {
    cards, loading: cardsLoading, error: cardsError,
    loadCards, getBoxCards, createCard, updateCard, deleteCard, deleteBoxCards, importCards,
  } = useCards();

  const {
    decks: quizDecks, loading: quizDecksLoading, error: quizDecksError,
    createDeck: createQuizDeck, updateDeck: updateQuizDeck, deleteDeck: deleteQuizDeck,
  } = useQuizDecks();

  const {
    questions, loading: questionsLoading, error: questionsError,
    loadQuestions, createQuestion, updateQuestion, deleteQuestion, appendQuestions,
  } = useQuizQuestions();

  useEffect(() => {
    fetch('/api/user/me')
      .then((r) => r.json())
      .then((d: { isPro?: boolean }) => { if (d.isPro) setIsPro(true); })
      .catch(() => {});
  }, []);

  const goHome = useCallback(() => {
    setView(activeTab === 'quiz' ? { type: 'quiz-home' } : { type: 'home' });
  }, [activeTab]);

  const goToBox = useCallback((deckId: string) => {
    setView({ type: 'box', deckId });
    void loadCards(deckId);
  }, [loadCards]);

  const goToStudy = useCallback((deckId: string) => {
    void loadCards(deckId);
    setView({ type: 'study-select', deckId });
  }, [loadCards]);

  const goToQuizBox = useCallback((deckId: string) => {
    setView({ type: 'quiz-box', deckId });
    void loadQuestions(deckId);
  }, [loadQuestions]);

  const goToQuizStudy = useCallback((deckId: string) => {
    void loadQuestions(deckId);
    setView({ type: 'quiz-study-select', deckId });
  }, [loadQuestions]);

  useEffect(() => {
    if (view.type === 'box') void loadCards(view.deckId);
    if (view.type === 'quiz-box') void loadQuestions(view.deckId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const handleDeleteBox = useCallback(async (id: string) => {
    await deleteBox(id);
    deleteBoxCards(id);
    if (view.type !== 'home' && 'deckId' in view && view.deckId === id) setView({ type: 'home' });
  }, [deleteBox, deleteBoxCards, view]);

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
    if ('deckId' in view) return decks.find((d) => d.id === (view as { deckId: string }).deckId);
    return undefined;
  }

  function getCurrentQuizDeck(): QuizDeck | undefined {
    if ('deckId' in view) return quizDecks.find((d) => d.id === (view as { deckId: string }).deckId);
    return undefined;
  }

  function getBackAction(): (() => void) | null {
    if (view.type === 'home' || view.type === 'quiz-home') return null;
    if (view.type === 'box') return () => setView({ type: 'home' });
    if (view.type === 'study-select') return () => goToBox((view as { deckId: string }).deckId);
    if (view.type === 'study-srs') return () => setView({ type: 'study-select', deckId: (view as { deckId: string }).deckId });
    if (view.type === 'study-cram') return () => setView({ type: 'study-select', deckId: (view as { deckId: string }).deckId });
    if (view.type === 'quiz-box') return () => setView({ type: 'quiz-home' });
    if (view.type === 'quiz-study-select') return () => goToQuizBox((view as { deckId: string }).deckId);
    if (view.type === 'quiz-study-srs') return () => setView({ type: 'quiz-study-select', deckId: (view as { deckId: string }).deckId });
    if (view.type === 'quiz-study-turbo') return () => setView({ type: 'quiz-study-select', deckId: (view as { deckId: string }).deckId });
    return null;
  }

  function getHeaderTitle(): string {
    if (view.type === 'home' || view.type === 'quiz-home') return '';
    const deck = getCurrentDeck();
    const quizDeck = getCurrentQuizDeck();
    if (view.type === 'box') return deck?.title ?? '';
    if (view.type === 'study-select') return 'Choose Mode';
    if (view.type === 'study-srs') return deck?.title ?? 'Daily Review';
    if (view.type === 'study-cram') return deck?.title ?? 'Turbo';
    if (view.type === 'quiz-box') return quizDeck?.title ?? '';
    if (view.type === 'quiz-study-select') return 'Choose Mode';
    if (view.type === 'quiz-study-srs') return quizDeck?.title ?? 'SRS Quiz';
    if (view.type === 'quiz-study-turbo') return quizDeck?.title ?? 'Turbo Quiz';
    return '';
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setView(tab === 'quiz' ? { type: 'quiz-home' } : { type: 'home' });
  }

  function renderView() {
    if (view.type === 'home') {
      return (
        <BoxList
          decks={decks} loading={decksLoading} error={decksError}
          isPro={isPro}
          onCreateBox={createBox} onUpdateBox={updateBox} onDeleteBox={handleDeleteBox}
          onOpenBox={goToBox} onStudyBox={goToStudy} onImport={handleImport}
          onAnkiImported={(deckId) => { void reloadDecks().then(() => goToBox(deckId)); }}
        />
      );
    }

    if (view.type === 'quiz-home') {
      return (
        <QuizDeckList
          decks={quizDecks}
          loading={quizDecksLoading}
          error={quizDecksError}
          isPro={isPro}
          onCreateDeck={createQuizDeck}
          onUpdateDeck={updateQuizDeck}
          onDeleteDeck={deleteQuizDeck}
          onOpenDeck={goToQuizBox}
          onStudyDeck={goToQuizStudy}
        />
      );
    }

    if (view.type === 'box') {
      const deck = getCurrentDeck();
      if (!deck) { setView({ type: 'home' }); return null; }
      const boxCards = getBoxCards(view.deckId);
      return (
        <CardList
          deck={deck} cards={boxCards} loading={cardsLoading} error={cardsError}
          onCreateCard={(front, back, fi, bi) => createCard(view.deckId, front, back, fi, bi)}
          onUpdateCard={updateCard} onDeleteCard={deleteCard}
          onBack={() => setView({ type: 'home' })} onStudy={() => goToStudy(view.deckId)}
          onUpdateDeck={syncDeck}
          onReloadCards={() => loadCards(view.deckId)}
          addCardOpen={addCardOpen} onAddCardOpenChange={setAddCardOpen}
        />
      );
    }

    if (view.type === 'quiz-box') {
      const quizDeck = getCurrentQuizDeck();
      if (!quizDeck) { setView({ type: 'quiz-home' }); return null; }
      const deckQuestions = questions.filter((q) => q.quizDeckId === view.deckId);
      return (
        <QuizQuestionList
          deckId={view.deckId}
          questions={deckQuestions}
          loading={questionsLoading}
          error={questionsError}
          isPro={isPro}
          onCreateQuestion={createQuestion}
          onUpdateQuestion={updateQuestion}
          onDeleteQuestion={deleteQuestion}
          onAppendQuestions={appendQuestions}
          onStudy={() => goToQuizStudy(view.deckId)}
          onBack={() => setView({ type: 'quiz-home' })}
        />
      );
    }

    if (view.type === 'study-select') {
      const deck = getCurrentDeck();
      if (!deck) { setView({ type: 'home' }); return null; }
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

    if (view.type === 'quiz-study-select') {
      const quizDeck = getCurrentQuizDeck();
      if (!quizDeck) { setView({ type: 'quiz-home' }); return null; }
      const deckQuestions = questions.filter((q) => q.quizDeckId === view.deckId);
      const dueCount = deckQuestions.filter((q) => {
        const due = q.srs?.dueDate;
        return !due || new Date(due) <= new Date();
      }).length;
      return (
        <QuizModeSelector
          deck={quizDeck}
          questionCount={deckQuestions.length}
          dueCount={dueCount}
          onSelect={(mode) => setView({
            type: mode === 'srs' ? 'quiz-study-srs' : 'quiz-study-turbo',
            deckId: view.deckId,
          })}
        />
      );
    }

    if (view.type === 'study-srs') {
      const deck = getCurrentDeck();
      if (!deck) { setView({ type: 'home' }); return null; }
      return (
        <StudySession
          deck={deck}
          onBack={() => setView({ type: 'study-select', deckId: view.deckId })}
          isPro={isPro}
        />
      );
    }

    if (view.type === 'study-cram') {
      const deck = getCurrentDeck();
      if (!deck) { setView({ type: 'home' }); return null; }
      const boxCards = getBoxCards(view.deckId);
      return (
        <CramSession
          deck={deck} cards={boxCards}
          onBack={() => setView({ type: 'study-select', deckId: view.deckId })}
        />
      );
    }

    if (view.type === 'quiz-study-srs') {
      return (
        <SRSQuizSession
          deckId={view.deckId}
          onBack={() => setView({ type: 'quiz-study-select', deckId: view.deckId })}
        />
      );
    }

    if (view.type === 'quiz-study-turbo') {
      return (
        <TurboQuizSession
          deckId={view.deckId}
          onBack={() => setView({ type: 'quiz-study-select', deckId: view.deckId })}
        />
      );
    }

    return null;
  }

  if (showSplash) return <SplashPage onStart={() => setShowSplash(false)} isFirstVisit={!decksLoading && decks.length === 0} />;

  const activeDeck = getCurrentDeck();
  const backAction = getBackAction();
  const isHomeView = view.type === 'home' || view.type === 'quiz-home';

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <header
        className="bg-white border-b border-slate-200 sticky top-0 z-30"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2">

          {isHomeView ? (
            <>
              <button
                onClick={() => setView(activeTab === 'quiz' ? { type: 'quiz-home' } : { type: 'home' })}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <BookOpen size={16} />
                </div>
                <span className="font-bold text-slate-800">Flashcard<span className="text-violet-600">AI</span></span>
              </button>

              {/* Tab switcher */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5 ms-4">
                <button
                  onClick={() => handleTabChange('flashcards')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'flashcards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BookOpen size={12} /> Flashcards
                </button>
                <button
                  onClick={() => handleTabChange('quiz')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'quiz' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <HelpCircle size={12} /> Quiz
                </button>
              </div>

              <div className="ms-auto hidden sm:block">
                <Link href="/dashboard" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                  ← Dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={backAction ?? goHome}
                className="flex items-center gap-1.5 -ms-1 px-3 py-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
                <span className="text-sm font-semibold hidden sm:inline">Back</span>
              </button>

              <h1 className="flex-1 text-center text-sm font-bold text-slate-800 truncate px-2">
                {getHeaderTitle()}
              </h1>

              {view.type === 'box' && activeDeck ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setAddCardOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition"
                    aria-label="Add card"
                  >
                    <Plus size={16} />
                    <span className="text-xs font-semibold hidden sm:inline">Add</span>
                  </button>
                  <button
                    onClick={() => goToStudy(view.deckId)}
                    aria-label="Study"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition"
                  >
                    <Play size={14} />
                    <span className="hidden sm:inline">Study</span>
                  </button>
                </div>
              ) : (
                <div className="w-16 sm:w-20" />
              )}
            </>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-8">
        {renderView()}
      </main>

      <BottomNav />
    </div>
  );
}
