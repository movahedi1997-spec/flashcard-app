'use client';

/**
 * components/flashcard/cards/CardItem.tsx  (TASK-006 update)
 *
 * Updated from legacy Card type (question/answer/score) to ApiCard
 * (front/back/frontImageUrl/backImageUrl/srs/aiGenerated).
 * Score badge replaced with SRS interval info.
 */

import { useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp, ImageIcon, Brain } from 'lucide-react';
import type { ApiCard } from '@/types/api';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Props {
  card: ApiCard;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CardItem({ card, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Format the SRS due / interval badge
  const srsLabel = (() => {
    if (!card.srs) return null;
    const due = new Date(card.srs.dueDate);
    const now = new Date();
    if (card.srs.reviewCount === 0) return { text: 'New', cls: 'bg-blue-50 text-blue-500 border-blue-100' };
    if (due <= now) return { text: 'Due', cls: 'bg-amber-50 text-amber-600 border-amber-100' };
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
    const label = diffDays < 7 ? `${diffDays}d` : diffDays < 30 ? `${Math.round(diffDays / 7)}w` : `${Math.round(diffDays / 30)}mo`;
    return { text: label, cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  })();

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden fade-in">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              {card.frontImageUrl && (
                <span className="inline-flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                  <ImageIcon size={10} /> img
                </span>
              )}
              {card.aiGenerated && (
                <span className="inline-flex items-center gap-1 text-xs text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100">
                  <Brain size={10} /> AI
                </span>
              )}
              <p className="text-sm font-medium text-slate-800 line-clamp-2">
                {card.front || <span className="italic text-slate-400">No text</span>}
              </p>
            </div>

            {expanded && (
              <div className="mt-3 flex flex-col gap-3">
                {card.frontImageUrl && (
                  <img
                    src={card.frontImageUrl}
                    alt="Question"
                    className="rounded-lg max-h-40 object-contain border border-slate-200"
                  />
                )}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide flex items-center gap-1">
                    Answer
                    {card.backImageUrl && (
                      <span className="inline-flex items-center gap-1 text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 normal-case">
                        <ImageIcon size={10} /> img
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-700">
                    {card.back || <span className="italic text-slate-400">No text</span>}
                  </p>
                  {card.backImageUrl && (
                    <img
                      src={card.backImageUrl}
                      alt="Answer"
                      className="mt-2 rounded-lg max-h-40 object-contain border border-slate-200"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {srsLabel && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${srsLabel.cls}`}
                title="Next review"
              >
                {srsLabel.text}
              </span>
            )}
            <button
              onClick={() => setExpanded((p) => !p)}
              aria-label={expanded ? 'Collapse card' : 'Expand card'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <button
              onClick={onEdit}
              aria-label="Edit card"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              aria-label="Delete card"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onDelete}
        title="Delete Card"
        message="Are you sure you want to delete this card? This cannot be undone."
      />
    </>
  );
}
