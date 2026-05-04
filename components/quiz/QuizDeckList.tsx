'use client';

import { useState } from 'react';
import { Plus, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import type { QuizDeck, Subject } from '@/types/api';
import type { QuizDeckUpdate } from '@/hooks/useQuizDecks';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import BoxForm, { type DeckFormValues } from '@/components/flashcard/boxes/BoxForm';
import QuizDeckCard from './QuizDeckCard';

interface Props {
  decks: QuizDeck[];
  loading: boolean;
  error: string | null;
  isPro?: boolean;
  onCreateDeck: (title: string, description?: string, subject?: Subject | null, color?: string, emoji?: string) => Promise<QuizDeck | null>;
  onUpdateDeck: (id: string, updates: QuizDeckUpdate) => Promise<void>;
  onDeleteDeck: (id: string) => Promise<void>;
  onOpenDeck: (deckId: string) => void;
  onStudyDeck: (deckId: string) => void;
}

export default function QuizDeckList({
  decks, loading, error, isPro = false,
  onCreateDeck, onUpdateDeck, onDeleteDeck, onOpenDeck, onStudyDeck,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editDeck, setEditDeck] = useState<QuizDeck | null>(null);

  if (loading && decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading quiz decks…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Quiz Decks</h2>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> New Quiz Deck
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {decks.length === 0 ? (
        <EmptyState
          icon={<HelpCircle size={36} />}
          title="No quiz decks yet"
          description="Create a quiz deck and add MCQ questions, or generate them with AI."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> Create Quiz Deck
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <QuizDeckCard
              key={deck.id}
              deck={deck}
              onOpen={() => onOpenDeck(deck.id)}
              onRename={() => setEditDeck(deck)}
              onDelete={() => void onDeleteDeck(deck.id)}
              onStudy={() => onStudyDeck(deck.id)}
            />
          ))}
        </div>
      )}

      {/* Reuse BoxForm — same fields, just different defaults */}
      <BoxForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={({ name, description, color, emoji, subject }: DeckFormValues) =>
          void onCreateDeck(name, description, subject, color, emoji)
        }
        initial={{ emoji: '🧠' }}
        mode="create"
        isPro={isPro}
        titleOverride="Create Quiz Deck"
      />

      <BoxForm
        open={!!editDeck}
        onClose={() => setEditDeck(null)}
        onSubmit={({ name, description, color, emoji, subject }: DeckFormValues) => {
          if (editDeck) void onUpdateDeck(editDeck.id, { title: name, description, color, emoji, subject });
          setEditDeck(null);
        }}
        initial={editDeck ? {
          name: editDeck.title,
          description: editDeck.description,
          color: editDeck.color,
          emoji: editDeck.emoji,
          subject: editDeck.subject,
        } : undefined}
        mode="edit"
        isPro={isPro}
        titleOverride="Edit Quiz Deck"
      />
    </div>
  );
}
