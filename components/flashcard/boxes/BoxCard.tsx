'use client';

import { useState } from 'react';
import { MoreVertical, Pencil, Trash2, Play, Download } from 'lucide-react';
import type { Deck } from '@/types/api';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';

interface Props {
  deck: Deck;
  cardCount: number;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onStudy: () => void;
  onExport: () => void;
}

// ── Palette map — keys match Deck.color values ────────────────────────────────
// All hover shadow classes written as full strings so Tailwind JIT includes them.

const PALETTES: Record<string, { gradient: string; border: string; hoverShadow: string }> = {
  indigo:  { gradient: 'from-indigo-600 to-violet-600',   border: 'border-indigo-100',   hoverShadow: 'hover:shadow-indigo-200/70'   },
  emerald: { gradient: 'from-emerald-600 to-teal-600',    border: 'border-emerald-100',  hoverShadow: 'hover:shadow-emerald-200/70'  },
  amber:   { gradient: 'from-amber-500 to-orange-500',    border: 'border-amber-100',    hoverShadow: 'hover:shadow-amber-200/70'    },
  rose:    { gradient: 'from-rose-500 to-pink-600',       border: 'border-rose-100',     hoverShadow: 'hover:shadow-rose-200/70'     },
  sky:     { gradient: 'from-sky-500 to-cyan-600',        border: 'border-sky-100',      hoverShadow: 'hover:shadow-sky-200/70'      },
  // Pro colors
  violet:  { gradient: 'from-violet-600 to-purple-700',   border: 'border-violet-100',   hoverShadow: 'hover:shadow-violet-200/70'   },
  fuchsia: { gradient: 'from-fuchsia-500 to-pink-600',    border: 'border-fuchsia-100',  hoverShadow: 'hover:shadow-fuchsia-200/70'  },
  teal:    { gradient: 'from-teal-500 to-cyan-600',       border: 'border-teal-100',     hoverShadow: 'hover:shadow-teal-200/70'     },
  gold:    { gradient: 'from-yellow-500 to-amber-600',    border: 'border-yellow-100',   hoverShadow: 'hover:shadow-yellow-200/70'   },
  slate:   { gradient: 'from-slate-700 to-slate-900',     border: 'border-slate-200',    hoverShadow: 'hover:shadow-slate-300/70'    },
};

const DEFAULT_PALETTE = PALETTES.indigo;

function getPalette(color: string) {
  return PALETTES[color] ?? DEFAULT_PALETTE;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BoxCard({
  deck,
  cardCount,
  onOpen,
  onRename,
  onDelete,
  onStudy,
  onExport,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const palette = getPalette(deck.color);

  return (
    <>
      {/*
        No shadow by default — only appears on hover (issue #4 + performance).
        When the menu is open the card is elevated to z-50 so its dropdown
        floats above sibling cards (issue #2).
      */}
      <div
        className={`group relative flex flex-col rounded-3xl border ${palette.border} bg-white
          transition-all duration-200
          hover:-translate-y-1 hover:shadow-xl ${palette.hoverShadow}
          ${menuOpen ? 'z-50' : 'z-0'}`}
      >
        {/* ── Gradient header ───────────────────────────────────────────── */}
        <div className={`bg-gradient-to-br ${palette.gradient} rounded-t-3xl px-5 pt-5 pb-9`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-white/60 text-[11px] font-semibold uppercase tracking-widest mb-1.5">
                {cardCount} {cardCount === 1 ? 'card' : 'cards'}
              </p>
              <h3
                className="text-white font-extrabold text-lg leading-snug line-clamp-2 cursor-pointer hover:underline decoration-white/40"
                onClick={onOpen}
                title={deck.title}
              >
                {deck.title}
              </h3>
            </div>

            {/* ── 3-dot menu ──────────────────────────────────────────── */}
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((p) => !p)}
                aria-label="Deck options"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div
                  className="absolute end-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={() => { onRename(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => { onExport(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Download size={14} /> Export JSON
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => { setConfirmOpen(true); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete Deck
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── White body ─────────────────────────────────────────────────── */}
        <div className="px-5 pb-5 flex flex-col gap-3 flex-1">
          {/* Floating stub card overlapping the gradient header */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-3 -mt-5 z-10 relative">
            <div className="flex items-center gap-2">
              <span className="text-xl leading-none">{deck.emoji}</span>
              <p className="text-xs text-slate-500 truncate">
                {deck.description || 'No description'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onOpen} className="flex-1">
              Open
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onStudy}
              disabled={cardCount === 0}
              className="flex-1"
            >
              <Play size={13} /> Study
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onDelete}
        title="Delete Deck"
        message={`Delete "${deck.title}" and all its cards? This cannot be undone.`}
      />
    </>
  );
}
