import { useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp, ImageIcon } from 'lucide-react';
import type { Card } from '../../types';
import { scoreColor } from '../../utils/helpers';
import ConfirmDialog from '../ui/ConfirmDialog';

interface Props {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CardItem({ card, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasQuestionImage = !!card.questionImage;
  const hasAnswerImage = !!card.answerImage;

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden fade-in">
        <div className="flex items-start gap-3 p-4">
          <div className="flex-1 min-w-0">
            {/* Question preview */}
            <div className="flex items-center gap-1.5 mb-0.5">
              {hasQuestionImage && (
                <span className="inline-flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                  <ImageIcon size={10} /> img
                </span>
              )}
              <p className="text-sm font-medium text-slate-800 line-clamp-2">
                {card.question || <span className="italic text-slate-400">No text</span>}
              </p>
            </div>

            {expanded && (
              <div className="mt-3 flex flex-col gap-3">
                {/* Question image */}
                {card.questionImage && (
                  <img src={card.questionImage} alt="Question" className="rounded-lg max-h-40 object-contain border border-slate-200" />
                )}

                {/* Answer */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide flex items-center gap-1">
                    Answer
                    {hasAnswerImage && (
                      <span className="inline-flex items-center gap-1 text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 normal-case">
                        <ImageIcon size={10} /> img
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-700">
                    {card.answer || <span className="italic text-slate-400">No text</span>}
                  </p>
                  {card.answerImage && (
                    <img src={card.answerImage} alt="Answer" className="mt-2 rounded-lg max-h-40 object-contain border border-slate-200" />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreColor(card.score)}`}>
              {card.score > 0 ? `+${card.score}` : card.score}
            </span>
            <button onClick={() => setExpanded(p => !p)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title={expanded ? 'Collapse' : 'Expand'}>
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <button onClick={onEdit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer" title="Edit">
              <Pencil size={15} />
            </button>
            <button onClick={() => setConfirmOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Delete">
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
