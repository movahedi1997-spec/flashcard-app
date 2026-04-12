'use client';

/**
 * components/flashcard/cards/CardList.tsx  (TASK-006 update)
 *
 * Updated for the new async useCards hook:
 *  - Props use Deck + ApiCard instead of Box + Card
 *  - loading + error states rendered
 *  - onCreateCard / onUpdateCard / onDeleteCard are all async
 *  - Score-based sort options removed (SRS replaces scoring)
 *  - Search updated to use card.front / card.back
 */

import { useState, useMemo } from 'react';
import { Plus, Search, SlidersHorizontal, CreditCard, Play, Loader2, AlertCircle } from 'lucide-react';
import type { Deck, ApiCard } from '@/types/api';
import type { CardUpdate } from '@/hooks/useCards';
import CardItem from './CardItem';
import CardForm from './CardForm';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

// ── Sort options (score-based removed) ───────────────────────────────────────

type SortOption = 'newest' | 'oldest' | 'alpha' | 'due';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  alpha:  'A → Z',
  due:    'Due soonest',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  deck: Deck;
  cards: ApiCard[];
  loading: boolean;
  error: string | null;
  onCreateCard: (
    front: string,
    back: string,
    frontImageUrl?: string,
    backImageUrl?: string,
  ) => Promise<ApiCard | null>;
  onUpdateCard: (id: string, updates: CardUpdate) => Promise<void>;
  onDeleteCard: (id: string) => Promise<void>;
  onBack: () => void;
  onStudy: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CardList({
  deck,
  cards,
  loading,
  error,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onBack,
  onStudy,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editCard, setEditCard] = useState<ApiCard | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [showSort, setShowSort] = useState(false);

  const filtered = useMemo(() => {
    let result = [...cards];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.front.toLowerCase().includes(q) ||
          c.back.toLowerCase().includes(q),
      );
    }

    switch (sort) {
      case 'newest':
        result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case 'alpha':
        result.sort((a, b) => a.front.localeCompare(b.front));
        break;
      case 'due':
        result.sort((a, b) => {
          const aDue = a.srs?.dueDate ?? '1970-01-01';
          const bDue = b.srs?.dueDate ?? '1970-01-01';
          return aDue.localeCompare(bDue);
        });
        break;
    }

    return result;
  }, [cards, search, sort]);

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          aria-label="Back to decks"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-800 truncate">{deck.title}</h2>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading…' : `${cards.length} ${cards.length === 1 ? 'card' : 'cards'}`}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onStudy}
          disabled={cards.length === 0 || loading}
        >
          <Play size={13} /> Study
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Add Card
        </Button>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Loading spinner (only shown when cards haven't loaded yet) ────── */}
      {loading && cards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm">Loading cards…</p>
        </div>
      )}

      {/* ── Search + sort ────────────────────────────────────────────────────── */}
      {!loading && cards.length > 0 && (
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSort((p) => !p)}
            >
              <SlidersHorizontal size={14} /> {SORT_LABELS[sort]}
            </Button>
            {showSort && (
              <div
                className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10"
                onMouseLeave={() => setShowSort(false)}
              >
                {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSort(opt); setShowSort(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer ${
                      sort === opt ? 'text-indigo-600 font-medium' : 'text-slate-600'
                    }`}
                  >
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Card list ────────────────────────────────────────────────────────── */}
      {!loading && cards.length === 0 && (
        <EmptyState
          icon={<CreditCard size={36} />}
          title="No cards yet"
          description="Add your first flashcard to this deck."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={14} /> Add Card
            </Button>
          }
        />
      )}

      {!loading && cards.length > 0 && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Search size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No cards match your search.</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onEdit={() => setEditCard(card)}
              onDelete={() => void onDeleteCard(card.id)}
            />
          ))}
        </div>
      )}

      {/* ── Create card form ─────────────────────────────────────────────────── */}
      <CardForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(front, back, fi, bi) => void onCreateCard(front, back, fi, bi)}
        mode="create"
      />

      {/* ── Edit card form ───────────────────────────────────────────────────── */}
      <CardForm
        open={!!editCard}
        onClose={() => setEditCard(null)}
        onSubmit={(front, back, fi, bi) => {
          if (editCard) void onUpdateCard(editCard.id, { front, back, frontImageUrl: fi, backImageUrl: bi });
          setEditCard(null);
        }}
        initialCard={editCard ?? undefined}
        mode="edit"
      />
    </div>
  );
}
