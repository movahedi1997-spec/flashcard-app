import { useState, useMemo } from 'react';
import { Plus, Search, SlidersHorizontal, CreditCard, Play } from 'lucide-react';
import type { Box, Card, SortOption } from '../../types';
import CardItem from './CardItem';
import CardForm from './CardForm';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';

interface Props {
  box: Box;
  cards: Card[];
  onCreateCard: (question: string, answer: string, questionImage?: string, answerImage?: string) => void;
  onUpdateCard: (id: string, question: string, answer: string, questionImage?: string, answerImage?: string) => void;
  onDeleteCard: (id: string) => void;
  onBack: () => void;
  onStudy: () => void;
}

const sortLabels: Record<SortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  'score-asc': 'Score ↑',
  'score-desc': 'Score ↓',
  alpha: 'A → Z',
};

export default function CardList({ box, cards, onCreateCard, onUpdateCard, onDeleteCard, onBack, onStudy }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [showSort, setShowSort] = useState(false);

  const filtered = useMemo(() => {
    let result = [...cards];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.question.toLowerCase().includes(q) || c.answer.toLowerCase().includes(q));
    }
    switch (sort) {
      case 'newest':    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case 'oldest':    result.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      case 'score-asc': result.sort((a, b) => a.score - b.score); break;
      case 'score-desc':result.sort((a, b) => b.score - a.score); break;
      case 'alpha':     result.sort((a, b) => a.question.localeCompare(b.question)); break;
    }
    return result;
  }, [cards, search, sort]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-800 truncate">{box.name}</h2>
          <p className="text-sm text-slate-500">{cards.length} {cards.length === 1 ? 'card' : 'cards'}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onStudy} disabled={cards.length === 0}>
          <Play size={13} /> Study
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Add Card
        </Button>
      </div>

      {/* Search + Sort */}
      {cards.length > 0 && (
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cards…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowSort(p => !p)}>
              <SlidersHorizontal size={14} /> {sortLabels[sort]}
            </Button>
            {showSort && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10" onMouseLeave={() => setShowSort(false)}>
                {(Object.keys(sortLabels) as SortOption[]).map(opt => (
                  <button key={opt} onClick={() => { setSort(opt); setShowSort(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer ${sort === opt ? 'text-indigo-600 font-medium' : 'text-slate-600'}`}>
                    {sortLabels[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card list */}
      {cards.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={36} />}
          title="No cards yet"
          description="Add your first flashcard to this box."
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} /> Add Card</Button>}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Search size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No cards match your search.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(card => (
            <CardItem
              key={card.id}
              card={card}
              onEdit={() => setEditCard(card)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </div>
      )}

      <CardForm open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={onCreateCard} mode="create" />
      <CardForm
        open={!!editCard}
        onClose={() => setEditCard(null)}
        onSubmit={(q, a, qi, ai) => { if (editCard) onUpdateCard(editCard.id, q, a, qi, ai); }}
        initialCard={editCard ?? undefined}
        mode="edit"
      />
    </div>
  );
}
