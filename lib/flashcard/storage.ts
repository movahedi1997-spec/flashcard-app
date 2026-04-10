import type { Box, Card } from '@/types/flashcard';

const BOXES_KEY = 'fc_boxes';
const CARDS_KEY = 'fc_cards';

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const storage = {
  getBoxes: (): Box[] => safeGet<Box[]>(BOXES_KEY, []),
  saveBoxes: (boxes: Box[]): void => localStorage.setItem(BOXES_KEY, JSON.stringify(boxes)),
  getCards: (): Card[] => safeGet<Card[]>(CARDS_KEY, []),
  saveCards: (cards: Card[]): void => localStorage.setItem(CARDS_KEY, JSON.stringify(cards)),
};
