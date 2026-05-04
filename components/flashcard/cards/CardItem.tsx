'use client';

/**
 * components/flashcard/cards/CardItem.tsx  (TASK-006 update)
 *
 * Updated from legacy Card type (question/answer/score) to ApiCard
 * (front/back/frontImageUrl/backImageUrl/srs/aiGenerated).
 * Score badge replaced with SRS interval info.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Trash2, ChevronDown, ChevronUp, ImageIcon, Brain, Sparkles } from 'lucide-react';
import type { ApiCard } from '@/types/api';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AIImproveModal from './AIImproveModal';
import MathContent from '@/components/MathContent';

interface Props {
  card: ApiCard;
  onEdit: () => void;
  onDelete: () => void;
  onImprove?: (front: string, back: string) => void;
}

export default function CardItem({ card, onEdit, onDelete, onImprove }: Props) {
  const t = useTranslations('flashcards');
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [improveOpen, setImproveOpen] = useState(false);

  // Format the SRS due / interval badge
  const srsLabel = (() => {
    if (!card.srs) return null;
    const due = new Date(card.srs.dueDate);
    const now = new Date();
    if (card.srs.reviewCount === 0) return { text: t('card.srsNew'), cls: 'bg-blue-50 text-blue-500 border-blue-100' };
    if (due <= now) return { text: t('card.srsDue'), cls: 'bg-amber-50 text-amber-600 border-amber-100' };
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
              {card.front
                ? <MathContent text={card.front} className="text-sm font-medium text-slate-800 line-clamp-2" />
                : <span className="italic text-slate-400 text-sm">{t('card.noText')}</span>
              }
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
                    {t('card.answer')}
                    {card.backImageUrl && (
                      <span className="inline-flex items-center gap-1 text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 normal-case">
                        <ImageIcon size={10} /> img
                      </span>
                    )}
                  </p>
                  {card.back
                    ? <MathContent text={card.back} block className="text-sm text-slate-700" />
                    : <span className="italic text-slate-400 text-sm">{t('card.noText')}</span>
                  }
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
                title={t('card.nextReview')}
              >
                {srsLabel.text}
              </span>
            )}
            <button
              onClick={() => setExpanded((p) => !p)}
              aria-label={expanded ? t('card.collapseCard') : t('card.expandCard')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <button
              onClick={() => setImproveOpen(true)}
              aria-label={t('card.improveWithAI')}
              title={t('card.improveWithAI')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer"
            >
              <Sparkles size={15} />
            </button>
            <button
              onClick={onEdit}
              aria-label={t('card.editCard')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              aria-label={t('card.deleteCard')}
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
        title={t('card.deleteCard')}
        message={t('card.deleteConfirm')}
      />

      <AIImproveModal
        open={improveOpen}
        onClose={() => setImproveOpen(false)}
        currentFront={card.front}
        currentBack={card.back}
        onApply={(front, back) => onImprove?.(front, back)}
      />
    </>
  );
}
