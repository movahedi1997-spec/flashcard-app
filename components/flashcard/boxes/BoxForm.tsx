'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { Subject } from '@/types/api';

// ── Palette options (must match BoxCard PALETTES keys) ────────────────────────

const FREE_COLORS = [
  { key: 'indigo',  label: 'Indigo',  swatch: 'bg-indigo-500'  },
  { key: 'emerald', label: 'Emerald', swatch: 'bg-emerald-500' },
  { key: 'amber',   label: 'Amber',   swatch: 'bg-amber-500'   },
  { key: 'rose',    label: 'Rose',    swatch: 'bg-rose-500'    },
  { key: 'sky',     label: 'Sky',     swatch: 'bg-sky-500'     },
];

const PRO_COLORS = [
  { key: 'violet',  label: 'Violet',   swatch: 'bg-violet-600'  },
  { key: 'fuchsia', label: 'Fuchsia',  swatch: 'bg-fuchsia-500' },
  { key: 'teal',    label: 'Teal',     swatch: 'bg-teal-500'    },
  { key: 'gold',    label: 'Gold',     swatch: 'bg-yellow-500'  },
  { key: 'slate',   label: 'Charcoal', swatch: 'bg-slate-700'   },
];

const EMOJI_PRESETS = [
  '📚','📖','🔬','🧪','💊','🩺','⚗️','🧬','🔭','✏️',
  '📝','🎯','💡','🧠','🌍','🎨','💻','🎵','🏆','⭐',
  '🧮','🗺️','🎭','🔑','🚀','🌱','🏛️','🎓','🔐','🧩',
];

// ── Props ─────────────────────────────────────────────────────────────────────

const SUBJECT_OPTIONS: { value: Subject | ''; label: string }[] = [
  { value: '',               label: 'No subject' },
  { value: 'medicine',       label: 'Medicine' },
  { value: 'pharmacy',       label: 'Pharmacy' },
  { value: 'chemistry',      label: 'Chemistry' },
  { value: 'biology',        label: 'Biology' },
  { value: 'physics',        label: 'Physics' },
  { value: 'mathematics',    label: 'Mathematics' },
  { value: 'computer_science', label: 'Computer Science' },
  { value: 'languages',      label: 'Languages' },
  { value: 'history',        label: 'History' },
  { value: 'philosophy',     label: 'Philosophy' },
  { value: 'psychology',     label: 'Psychology' },
  { value: 'literature',     label: 'Literature' },
  { value: 'economics',      label: 'Economics' },
  { value: 'law',            label: 'Law' },
  { value: 'science',        label: 'Science' },
  { value: 'other',          label: 'Other' },
];

export interface DeckFormValues {
  name: string;
  description: string;
  color: string;
  emoji: string;
  subject: Subject | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: DeckFormValues) => void;
  initial?: Partial<DeckFormValues & { subject?: Subject | null }>;
  mode: 'create' | 'edit';
  isPro?: boolean;
  /** Override the modal title (defaults to "Create Deck" / "Edit Deck"). */
  titleOverride?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BoxForm({ open, onClose, onSubmit, initial, mode, isPro = false, titleOverride }: Props) {
  const t = useTranslations('flashcards');
  const [name, setName]               = useState(initial?.name        ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor]             = useState(initial?.color       ?? 'indigo');
  const [emoji, setEmoji]             = useState(initial?.emoji       ?? '📚');
  const [subject, setSubject]         = useState<Subject | ''>(initial?.subject ?? '');
  const [nameError, setNameError]     = useState('');

  // Sync when the modal opens with pre-filled values (edit mode)
  useEffect(() => {
    if (open) {
      setName(initial?.name        ?? '');
      setDescription(initial?.description ?? '');
      setColor(initial?.color       ?? 'indigo');
      setEmoji(initial?.emoji       ?? '📚');
      setSubject(initial?.subject   ?? '');
      setNameError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameError(t('deckNameRequired')); return; }
    onSubmit({ name: name.trim(), description: description.trim(), color, emoji, subject: subject || null });
    onClose();
  }

  function handleClose() {
    setNameError('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={titleOverride ?? t(mode === 'create' ? 'createDeck.title' : 'editDeck.title')}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        <Input
          label={t('deckNameLabel')}
          placeholder={t('deckNamePlaceholder')}
          value={name}
          onChange={(e) => { setName(e.target.value); setNameError(''); }}
          error={nameError}
          autoFocus
        />

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            {t('createDeck.descriptionLabel')} <span className="text-slate-400 font-normal">{t('descriptionOptional')}</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('createDeck.descriptionPlaceholder')}
            rows={2}
            maxLength={300}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        {/* Subject */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Subject <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject | '')}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {SUBJECT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Colour picker */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">{t('colourLabel')}</label>
          <div className="flex flex-wrap gap-2.5">
            {FREE_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                title={c.label}
                onClick={() => setColor(c.key)}
                className={`h-8 w-8 rounded-full ${c.swatch} transition-all ${
                  color === c.key
                    ? 'ring-2 ring-offset-2 ring-slate-500 scale-110'
                    : 'opacity-60 hover:opacity-100'
                }`}
              />
            ))}
            {/* Pro-only colors */}
            {PRO_COLORS.map((c) => (
              isPro ? (
                <button
                  key={c.key}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.key)}
                  className={`h-8 w-8 rounded-full ${c.swatch} transition-all ${
                    color === c.key
                      ? 'ring-2 ring-offset-2 ring-slate-500 scale-110'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ) : (
                <Link
                  key={c.key}
                  href="/pricing"
                  title={`${c.label} — ${t('proOnly')}`}
                  className={`relative h-8 w-8 rounded-full ${c.swatch} opacity-40 flex items-center justify-center`}
                >
                  <Lock size={11} className="text-white drop-shadow" />
                </Link>
              )
            ))}
          </div>
          {!isPro && (
            <p className="text-xs text-indigo-500">
              <Link href="/pricing" className="hover:underline font-medium">Upgrade to Pro</Link>{' '}{t('upgradeForColors')}
            </p>
          )}
        </div>

        {/* Emoji picker */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">{t('iconLabel')}</label>
          {/* Preset grid */}
          <div className="grid grid-cols-10 gap-1">
            {EMOJI_PRESETS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition ${
                  emoji === e
                    ? 'bg-indigo-100 ring-1 ring-indigo-400'
                    : 'hover:bg-slate-100'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          {/* Custom emoji input */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl">{emoji}</span>
            <input
              type="text"
              value={emoji}
              onChange={(e) => {
                // Take only the first grapheme cluster (one emoji)
                const val = [...e.target.value].slice(0, 2).join('');
                if (val) setEmoji(val);
              }}
              placeholder={t('emojiPlaceholder')}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <Button variant="secondary" type="button" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button type="submit">
            {t(mode === 'create' ? 'createDeck.submit' : 'editDeck.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
