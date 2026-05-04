'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2, TrendingUp, Clock, LayoutList, Users, ChevronDown, Check, Heart } from 'lucide-react';
import type { PublicDeck, Subject } from '@/types/api';
import ExploreFeedRow from './ExploreFeedRow';
import ExploreCreatorRow, { type CreatorResult } from './ExploreCreatorRow';
import AuthGateModal from './AuthGateModal';
import { SUBJECTS } from '@/lib/subjects';

type DeckTypeFilter = 'all' | 'flashcard' | 'quiz';
type ExploreTab = 'decks' | 'people';

type SortMode = 'recent' | 'trending';

interface ExploreResponse {
  decks:      PublicDeck[];
  total:      number;
  page:       number;
  totalPages: number;
}

interface CreatorsResponse {
  creators:   CreatorResult[];
  total:      number;
  page:       number;
  totalPages: number;
}

const PAGE_SIZE = 20;

// ── Subject picker — dropdown on mobile, pills on desktop ─────────────────────

interface SubjectPickerProps {
  value: Subject | 'all';
  onChange: (v: Subject | 'all') => void;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
  label?: string;
}

function SubjectPicker({ value, onChange, mobileOnly, desktopOnly, label }: SubjectPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SUBJECTS.find((s) => s.value === value) ?? SUBJECTS[0]!;

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  if (desktopOnly) {
    return (
      <div className="hidden sm:flex flex-col gap-2">
        {label && <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SUBJECTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange(s.value)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                value === s.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // mobileOnly — dropdown button
  return (
    <div className={`relative ${mobileOnly ? 'sm:hidden' : ''}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
          value !== 'all'
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
            : 'bg-white text-gray-600 border-gray-200'
        }`}
      >
        <span>{current.emoji}</span>
        <span>{current.label}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute start-0 top-full mt-1.5 z-50 w-64 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            {SUBJECTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => { onChange(s.value); setOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold transition bg-white ${
                  value === s.value ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <span className="text-base leading-none">{s.emoji}</span>
                <span className="truncate">{s.label}</span>
                {value === s.value && <Check size={11} className="ms-auto text-indigo-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Decks sub-grid ────────────────────────────────────────────────────────────

interface DecksTabProps {
  isAuthenticated: boolean | null;
  onAuthRequired: () => void;
}

function DecksTab({ isAuthenticated, onAuthRequired }: DecksTabProps) {
  const [decks, setDecks]             = useState<PublicDeck[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState('');

  const [sort, setSort]         = useState<SortMode>('trending');
  const [subject, setSubject]   = useState<Subject | 'all'>('all');
  const [deckType, setDeckType] = useState<DeckTypeFilter>('all');
  const [search, setSearch]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showLiked, setShowLiked] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 350);
  }

  const fetchPage = useCallback(async (p: number, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(p), sort });
      if (subject && subject !== 'all') params.set('subject', subject);
      if (deckType !== 'all') params.set('deckType', deckType);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (showLiked) params.set('liked', 'true');

      const res = await fetch(`/api/explore?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load decks.');
      const data = (await res.json()) as ExploreResponse;

      setDecks((prev) => append ? [...prev, ...data.decks] : data.decks);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sort, subject, deckType, debouncedSearch, showLiked]);

  useEffect(() => {
    setDecks([]);
    setPage(0);
    fetchPage(0, false);
  }, [fetchPage]);

  function handleCopied(deckId: string) {
    setDecks((prev) => prev.map((d) => d.id === deckId ? { ...d, alreadyCopied: true } : d));
  }

  const hasMore = page + 1 < totalPages;

  // Infinite scroll — auto-fetch next page when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMore && !loadingMore && !loading) {
          void fetchPage(page + 1, true);
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPage]);

  const searchExpanded = searchFocused || !!search;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        {/* Row 1: Sort + search (search expands to full width when focused) */}
        <div className="flex items-center gap-2">
          {!searchExpanded && (
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5 flex-shrink-0">
              <button
                onClick={() => setSort('trending')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${sort === 'trending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <TrendingUp size={13} /> Trending
              </button>
              <button
                onClick={() => setSort('recent')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${sort === 'recent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Clock size={13} /> Recent
              </button>
            </div>
          )}
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search decks…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 ps-9 pe-8 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setDebouncedSearch(''); }}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Type + Liked filters + mobile subject picker */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setDeckType(deckType === 'flashcard' ? 'all' : 'flashcard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${deckType === 'flashcard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🃏 Flashcards
            </button>
            <button
              onClick={() => setDeckType(deckType === 'quiz' ? 'all' : 'quiz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${deckType === 'quiz' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🧠 Quizzes
            </button>
            <button
              onClick={() => {
                if (!isAuthenticated) { onAuthRequired(); return; }
                setShowLiked((v) => !v);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${showLiked ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-500 hover:text-rose-400'}`}
            >
              <Heart size={13} className={showLiked ? 'fill-rose-400 text-rose-400' : ''} /> Liked
            </button>
          </div>
          <SubjectPicker value={subject} onChange={setSubject} mobileOnly />
        </div>

        {/* Row 3: Subject pills — desktop only */}
        <SubjectPicker value={subject} onChange={setSubject} desktopOnly label="Filter by subject" />
      </div>

      {!loading && (
        <p className="text-xs text-gray-400">
          {total === 0 ? 'No decks found' : `${total.toLocaleString()} deck${total !== 1 ? 's' : ''}`}
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/5 rounded bg-gray-100" />
                <div className="h-2.5 w-1/3 rounded bg-gray-100" />
              </div>
              <div className="h-7 w-16 rounded-xl bg-gray-100 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {!loading && decks.length > 0 && (
        <div className="flex flex-col gap-3">
          {decks.map((deck) => (
            <ExploreFeedRow
              key={deck.id}
              deck={deck}
              onCopied={handleCopied}
              isAuthenticated={isAuthenticated}
              onAuthRequired={onAuthRequired}
            />
          ))}
        </div>
      )}

      {!loading && decks.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
            <LayoutList className="h-7 w-7 text-gray-400" />
          </div>
          <p className="text-gray-600 font-semibold">No decks found</p>
          <p className="text-sm text-gray-400 mt-1">
            {showLiked ? 'You haven\'t liked any decks yet.' : debouncedSearch ? `No results for "${debouncedSearch}"` : 'No public decks in this category yet.'}
          </p>
          {(debouncedSearch || subject !== 'all' || showLiked) && (
            <button
              onClick={() => { setSearch(''); setDebouncedSearch(''); setSubject('all'); setShowLiked(false); }}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
        </div>
      )}
    </div>
  );
}

// ── People sub-grid ───────────────────────────────────────────────────────────

function PeopleTab() {
  const [creators, setCreators]       = useState<CreatorResult[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef2 = useRef<HTMLDivElement>(null);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 350);
  }

  const fetchPage = useCallback(async (p: number, append: boolean) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(p) });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/creators?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load creators.');
      const data = (await res.json()) as CreatorsResponse;

      setCreators((prev) => append ? [...prev, ...data.creators] : data.creators);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setCreators([]);
    setPage(0);
    fetchPage(0, false);
  }, [fetchPage]);

  const hasMore = page + 1 < totalPages;

  useEffect(() => {
    const sentinel = sentinelRef2.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMore && !loadingMore && !loading) {
          void fetchPage(page + 1, true);
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPage]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or username…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2 ps-9 pe-8 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setDebouncedSearch(''); }}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-gray-400">
          {total === 0 ? 'No creators found' : `${total.toLocaleString()} creator${total !== 1 ? 's' : ''}`}
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 last:border-b-0 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 rounded bg-gray-100" />
                <div className="h-2.5 w-1/2 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && creators.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          {creators.map((creator) => (
            <ExploreCreatorRow key={creator.id} creator={creator} />
          ))}
        </div>
      )}

      {!loading && creators.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
            <Users className="h-7 w-7 text-gray-400" />
          </div>
          <p className="text-gray-600 font-semibold">No creators found</p>
          <p className="text-sm text-gray-400 mt-1">
            {debouncedSearch ? `No results for "${debouncedSearch}"` : 'No public profiles yet.'}
          </p>
          {debouncedSearch && (
            <button
              onClick={() => { setSearch(''); setDebouncedSearch(''); }}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef2} className="h-4" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
        </div>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function ExploreGrid() {
  const [tab, setTab] = useState<ExploreTab>('decks');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => setIsAuthenticated(r.ok))
      .catch(() => setIsAuthenticated(false));
  }, []);

  const requireAuth = useCallback(() => setShowAuthGate(true), []);

  return (
    <div className="space-y-4">
      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}

      {/* Top-level tab switcher */}
      <div className="flex items-center gap-1 border-b border-gray-100 pb-0">
        <button
          onClick={() => setTab('decks')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
            tab === 'decks'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <LayoutList size={14} /> Decks
        </button>
        <button
          onClick={() => {
            if (!isAuthenticated) { requireAuth(); return; }
            setTab('people');
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
            tab === 'people'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users size={14} /> People
        </button>
      </div>

      {tab === 'decks'  && <DecksTab isAuthenticated={isAuthenticated} onAuthRequired={requireAuth} />}
      {tab === 'people' && <PeopleTab />}
    </div>
  );
}
