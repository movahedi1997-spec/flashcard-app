'use client';

/**
 * ExploreGrid — interactive deck feed for the Explore page.
 *
 * Handles: subject filter pills, debounced search, cursor-based pagination,
 * and copy-to-library. Runs entirely client-side after the server component
 * hands off initial rendered markup.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2, LayoutGrid } from 'lucide-react';
import type { PublicDeck, Subject } from '@/types/api';
import ExploreDeckCard from './ExploreDeckCard';

// ── Subject filter pills ──────────────────────────────────────────────────────

const SUBJECTS: { value: Subject | 'all'; label: string; emoji: string }[] = [
  { value: 'all',       label: 'All',      emoji: '🌐' },
  { value: 'medicine',  label: 'Medicine', emoji: '🩺' },
  { value: 'pharmacy',  label: 'Pharmacy', emoji: '💊' },
  { value: 'chemistry', label: 'Chemistry',emoji: '⚗️' },
  { value: 'other',     label: 'Other',    emoji: '📚' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExploreResponse {
  decks:      PublicDeck[];
  nextCursor: string | null;
  total:      number;
}

export default function ExploreGrid() {
  const [decks, setDecks]             = useState<PublicDeck[]>([]);
  const [nextCursor, setNextCursor]   = useState<string | null>(null);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState('');

  const [subject, setSubject]   = useState<Subject | 'all'>('all');
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input by 350ms
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 350);
  }

  // ── Fetch decks ─────────────────────────────────────────────────────────────

  const fetchDecks = useCallback(async (
    cursor: string | null,
    append: boolean,
  ) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ limit: '20' });
      if (subject && subject !== 'all') params.set('subject', subject);
      if (debouncedSearch)              params.set('search',  debouncedSearch);
      if (cursor)                       params.set('cursor',  cursor);

      const res = await fetch(`/api/explore?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load decks.');

      const data = (await res.json()) as ExploreResponse;

      setDecks((prev) => append ? [...prev, ...data.decks] : data.decks);
      setNextCursor(data.nextCursor);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [subject, debouncedSearch]);

  // Re-fetch from scratch when filter/search changes
  useEffect(() => {
    setDecks([]);
    setNextCursor(null);
    fetchDecks(null, false);
  }, [fetchDecks]);

  // ── Copy handler — update alreadyCopied locally ──────────────────────────────

  function handleCopied(deckId: string) {
    setDecks((prev) =>
      prev.map((d) => (d.id === deckId ? { ...d, alreadyCopied: true } : d)),
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Search + filter row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search decks…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-10 pe-9 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setDebouncedSearch(''); }}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Subject pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {SUBJECTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSubject(s.value)}
              className={`flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold transition
                ${subject === s.value
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
                }`}
            >
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          {total === 0
            ? 'No decks found'
            : `${total.toLocaleString()} deck${total !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-gray-100 bg-white animate-pulse">
              <div className="h-28 rounded-t-3xl bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-2/3 rounded bg-gray-100" />
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-9 w-full rounded-xl bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deck grid */}
      {!loading && decks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {decks.map((deck) => (
            <ExploreDeckCard key={deck.id} deck={deck} onCopied={handleCopied} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && decks.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
            <LayoutGrid className="h-7 w-7 text-gray-400" />
          </div>
          <p className="text-gray-600 font-semibold">No decks found</p>
          <p className="text-sm text-gray-400 mt-1">
            {debouncedSearch
              ? `No results for "${debouncedSearch}"`
              : 'No public decks in this category yet — be the first!'}
          </p>
          {(debouncedSearch || subject !== 'all') && (
            <button
              onClick={() => { setSearch(''); setDebouncedSearch(''); setSubject('all'); }}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Load more */}
      {nextCursor && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchDecks(nextCursor, true)}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-50"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
