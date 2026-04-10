import type { Card } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Turbo mode: every card appears exactly once in random order. */
export function buildTurboDeck(cards: Card[]): Card[] {
  return shuffle(cards);
}

/**
 * Score-based mode: cards with lower scores appear more often.
 *   score <  0  → 3 appearances
 *   score 0–2   → 2 appearances
 *   score >  2  → 1 appearance
 */
export function buildScoreDeck(cards: Card[]): Card[] {
  const deck: Card[] = [];
  for (const card of cards) {
    const reps = card.score < 0 ? 3 : card.score <= 2 ? 2 : 1;
    for (let i = 0; i < reps; i++) deck.push(card);
  }
  return shuffle(deck);
}

export function exportBoxAsJson(boxName: string, cards: Card[]): void {
  const data = { box: boxName, exportedAt: new Date().toISOString(), cards };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${boxName.replace(/\s+/g, '_')}_flashcards.json`;
  a.click();
  URL.revokeObjectURL(url);
}
