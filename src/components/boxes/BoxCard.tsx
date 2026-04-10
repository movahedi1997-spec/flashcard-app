import { useState } from 'react';
import { BookOpen, MoreVertical, Pencil, Trash2, Play, Download } from 'lucide-react';
import type { Box, Card } from '../../types';
import ConfirmDialog from '../ui/ConfirmDialog';
import Button from '../ui/Button';

interface Props {
  box: Box;
  cardCount: number;
  cards: Card[];
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onStudy: () => void;
  onExport: () => void;
}

export default function BoxCard({ box, cardCount, onOpen, onRename, onDelete, onStudy, onExport }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4 fade-in">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <BookOpen size={20} />
            </div>
            <div className="min-w-0">
              <h3
                className="font-semibold text-slate-800 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={onOpen}
                title={box.name}
              >
                {box.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {cardCount} {cardCount === 1 ? 'card' : 'cards'}
              </p>
            </div>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button onClick={() => { onRename(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                  <Pencil size={14} /> Rename
                </button>
                <button onClick={() => { onExport(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                  <Download size={14} /> Export JSON
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button onClick={() => { setConfirmOpen(true); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer">
                  <Trash2 size={14} /> Delete Box
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onOpen} className="flex-1">
            Open
          </Button>
          <Button variant="primary" size="sm" onClick={onStudy} disabled={cardCount === 0} className="flex-1">
            <Play size={13} /> Study
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onDelete}
        title="Delete Box"
        message={`Delete "${box.name}" and all its cards? This cannot be undone.`}
      />
    </>
  );
}
