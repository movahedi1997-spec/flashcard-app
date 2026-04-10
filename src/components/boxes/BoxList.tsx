import { useState, useRef } from 'react';
import { Plus, BookOpen, Upload } from 'lucide-react';
import type { Box, Card } from '../../types';
import BoxCard from './BoxCard';
import BoxForm from './BoxForm';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import { generateId } from '../../utils/helpers';
import { exportBoxAsJson } from '../../utils/study';

interface Props {
  boxes: Box[];
  cards: Card[];
  onCreateBox: (name: string) => void;
  onUpdateBox: (id: string, name: string) => void;
  onDeleteBox: (id: string) => void;
  onOpenBox: (boxId: string) => void;
  onStudyBox: (boxId: string) => void;
  onImport: (boxes: Box[], cards: Card[]) => void;
}

export default function BoxList({ boxes, cards, onCreateBox, onUpdateBox, onDeleteBox, onOpenBox, onStudyBox, onImport }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editBox, setEditBox] = useState<Box | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const boxName = data.box ?? file.name.replace('.json', '');
        const newBox: Box = { id: generateId(), name: boxName, createdAt: new Date().toISOString() };
        const newCards: Card[] = (data.cards ?? []).map((c: Partial<Card>) => ({
          ...c,
          id: generateId(),
          boxId: newBox.id,
          createdAt: c.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        onImport([newBox], newCards);
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">My Boxes</h2>
        <div className="flex gap-2">
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Button variant="secondary" size="sm" onClick={() => importRef.current?.click()}>
            <Upload size={14} /> Import
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> New Box
          </Button>
        </div>
      </div>

      {boxes.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={36} />}
          title="No boxes yet"
          description="Create your first box to start organizing your flashcards."
          action={<Button onClick={() => setCreateOpen(true)}><Plus size={14} /> Create Box</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boxes.map(box => {
            const boxCards = cards.filter(c => c.boxId === box.id);
            return (
              <BoxCard
                key={box.id}
                box={box}
                cardCount={boxCards.length}
                cards={boxCards}
                onOpen={() => onOpenBox(box.id)}
                onRename={() => setEditBox(box)}
                onDelete={() => { onDeleteBox(box.id); }}
                onStudy={() => onStudyBox(box.id)}
                onExport={() => exportBoxAsJson(box.name, boxCards)}
              />
            );
          })}
        </div>
      )}

      <BoxForm open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={onCreateBox} mode="create" />
      <BoxForm
        open={!!editBox}
        onClose={() => setEditBox(null)}
        onSubmit={name => { if (editBox) onUpdateBox(editBox.id, name); }}
        initialName={editBox?.name ?? ''}
        mode="edit"
      />
    </div>
  );
}
