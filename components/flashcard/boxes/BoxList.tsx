'use client';

/**
 * components/flashcard/boxes/BoxList.tsx  (TASK-006 update)
 *
 * Updated for the new async useBoxes hook:
 *  - Props use Deck instead of Box
 *  - onCreateBox / onUpdateBox / onDeleteBox are all async
 *  - loading + error states rendered
 *  - handleImport maps legacy JSON (question/answer) to new schema (front/back)
 *    and delegates creation to the parent via onImport(deckTitle, rawCards)
 */

import { useState, useRef } from 'react';
import { Plus, BookOpen, Upload, Loader2, AlertCircle } from 'lucide-react';
import type { Deck } from '@/types/api';
import type { DeckUpdate } from '@/hooks/useBoxes';
import BoxCard from './BoxCard';
import BoxForm from './BoxForm';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

// ── Raw card shape coming from legacy JSON export files ───────────────────────

interface RawImportCard {
  front: string;
  back: string;
  frontImageUrl?: string;
  backImageUrl?: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  decks: Deck[];
  loading: boolean;
  error: string | null;
  onCreateBox: (name: string, description?: string) => Promise<Deck | null>;
  onUpdateBox: (id: string, updates: DeckUpdate) => Promise<void>;
  onDeleteBox: (id: string) => Promise<void>;
  onOpenBox: (deckId: string) => void;
  onStudyBox: (deckId: string) => void;
  /** Parent orchestrates the server calls: create deck, then bulk-create cards. */
  onImport: (deckTitle: string, rawCards: RawImportCard[]) => Promise<void>;
}

// ── Export helper (client-side, no API call needed) ───────────────────────────

function exportDeckAsJson(deckTitle: string, cards: RawImportCard[]) {
  const blob = new Blob(
    [JSON.stringify({ deck: deckTitle, cards }, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${deckTitle.replace(/\s+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BoxList({
  decks,
  loading,
  error,
  onCreateBox,
  onUpdateBox,
  onDeleteBox,
  onOpenBox,
  onStudyBox,
  onImport,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editDeck, setEditDeck] = useState<Deck | null>(null);
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  // ── JSON import ──────────────────────────────────────────────────────────────

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = JSON.parse(ev.target?.result as string) as Record<string, any>;

        // Support both old schema (question/answer) and new schema (front/back)
        const deckTitle: string = data.deck ?? data.box ?? file.name.replace(/\.json$/, '');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawCards: RawImportCard[] = (data.cards ?? []).map((c: any) => ({
          front:        c.front       ?? c.question ?? '',
          back:         c.back        ?? c.answer   ?? '',
          frontImageUrl: c.frontImageUrl ?? c.questionImage ?? undefined,
          backImageUrl:  c.backImageUrl  ?? c.answerImage   ?? undefined,
        }));

        setImporting(true);
        await onImport(deckTitle, rawCards);
      } catch {
        alert('Invalid JSON file — could not import deck.');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────────

  if (loading && decks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading your decks…</p>
      </div>
    );
  }

  // ── Error banner ──────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">My Decks</h2>
        <div className="flex gap-2">
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => importRef.current?.click()}
            disabled={importing}
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Import
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> New Deck
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {decks.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={36} />}
          title="No decks yet"
          description="Create your first deck to start organizing your flashcards."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> Create Deck
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <BoxCard
              key={deck.id}
              deck={deck}
              cardCount={deck.cardCount}
              onOpen={() => onOpenBox(deck.id)}
              onRename={() => setEditDeck(deck)}
              onDelete={() => void onDeleteBox(deck.id)}
              onStudy={() => onStudyBox(deck.id)}
              onExport={() =>
                exportDeckAsJson(deck.title, [/* populated by parent if needed */])
              }
            />
          ))}
        </div>
      )}

      {/* Create deck form */}
      <BoxForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(name) => void onCreateBox(name)}
        mode="create"
      />

      {/* Edit / rename deck form */}
      <BoxForm
        open={!!editDeck}
        onClose={() => setEditDeck(null)}
        onSubmit={(name) => {
          if (editDeck) void onUpdateBox(editDeck.id, { title: name });
          setEditDeck(null);
        }}
        initialName={editDeck?.title ?? ''}
        mode="edit"
      />
    </div>
  );
}
