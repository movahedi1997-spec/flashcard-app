'use client';

import { useState, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import type { StudyMode } from '@/types/flashcard';
import { useBoxes } from '@/hooks/useBoxes';
import { useCards } from '@/hooks/useCards';
import BoxList from '@/components/flashcard/boxes/BoxList';
import CardList from '@/components/flashcard/cards/CardList';
import ModeSelector from '@/components/flashcard/study/ModeSelector';
import StudySession from '@/components/flashcard/study/StudySession';
import SplashPage from '@/components/flashcard/SplashPage';
import Link from 'next/link';

type View =
  | { type: 'home' }
  | { type: 'box'; boxId: string }
  | { type: 'study-select'; boxId: string }
  | { type: 'study'; boxId: string; mode: StudyMode };

export default function FlashcardsPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<View>({ type: 'home' });
  const { boxes, createBox, updateBox, deleteBox, importBoxes } = useBoxes();
  const { cards, getBoxCards, createCard, updateCard, deleteCard, deleteBoxCards, updateCardScore, importCards } = useCards();

  const goHome = useCallback(() => setView({ type: 'home' }), []);
  const goToBox = useCallback((boxId: string) => setView({ type: 'box', boxId }), []);
  const goToStudySelect = useCallback((boxId: string) => setView({ type: 'study-select', boxId }), []);
  const goToStudy = useCallback((boxId: string, mode: StudyMode) => setView({ type: 'study', boxId, mode }), []);

  function handleDeleteBox(id: string) {
    deleteBox(id);
    deleteBoxCards(id);
    if (view.type !== 'home' && 'boxId' in view && view.boxId === id) {
      setView({ type: 'home' });
    }
  }

  function renderView() {
    if (view.type === 'home') {
      return (
        <BoxList
          boxes={boxes}
          cards={cards}
          onCreateBox={createBox}
          onUpdateBox={updateBox}
          onDeleteBox={handleDeleteBox}
          onOpenBox={goToBox}
          onStudyBox={goToStudySelect}
          onImport={(newBoxes, newCards) => { importBoxes(newBoxes); importCards(newCards); }}
        />
      );
    }

    if (view.type === 'box') {
      const box = boxes.find(b => b.id === view.boxId);
      if (!box) { goHome(); return null; }
      const boxCards = getBoxCards(view.boxId);
      return (
        <CardList
          box={box}
          cards={boxCards}
          onCreateCard={(q, a, qi, ai) => createCard(view.boxId, q, a, qi, ai)}
          onUpdateCard={updateCard}
          onDeleteCard={deleteCard}
          onBack={goHome}
          onStudy={() => goToStudySelect(view.boxId)}
        />
      );
    }

    if (view.type === 'study-select') {
      const box = boxes.find(b => b.id === view.boxId);
      if (!box) { goHome(); return null; }
      const boxCards = getBoxCards(view.boxId);
      return (
        <ModeSelector
          box={box}
          cardCount={boxCards.length}
          onSelect={mode => goToStudy(view.boxId, mode)}
          onBack={() => goToBox(view.boxId)}
        />
      );
    }

    if (view.type === 'study') {
      const box = boxes.find(b => b.id === view.boxId);
      if (!box) { goHome(); return null; }
      const boxCards = getBoxCards(view.boxId);
      if (boxCards.length === 0) { goToBox(view.boxId); return null; }
      return (
        <StudySession
          box={box}
          cards={boxCards}
          mode={view.mode}
          onScoreUpdate={updateCardScore}
          onBack={() => goToBox(view.boxId)}
        />
      );
    }

    return null;
  }

  if (showSplash) {
    return <SplashPage onStart={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={goHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <BookOpen size={16} />
            </div>
            <span className="font-bold text-slate-800">FlashCards</span>
          </button>

          {view.type !== 'home' && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500 ml-2">
              <span>/</span>
              <button onClick={goHome} className="hover:text-indigo-600 transition-colors cursor-pointer">Boxes</button>
              {'boxId' in view && (() => {
                const box = boxes.find(b => b.id === (view as { boxId: string }).boxId);
                return box ? (
                  <>
                    <span>/</span>
                    <button
                      onClick={() => goToBox((view as { boxId: string }).boxId)}
                      className={`hover:text-indigo-600 transition-colors cursor-pointer ${view.type === 'box' ? 'text-slate-800 font-medium' : ''}`}
                    >
                      {box.name}
                    </button>
                  </>
                ) : null;
              })()}
              {(view.type === 'study-select' || view.type === 'study') && (
                <>
                  <span>/</span>
                  <span className="text-slate-800 font-medium">Study</span>
                </>
              )}
            </div>
          )}

          <div className="ml-auto">
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {renderView()}
      </main>
    </div>
  );
}
