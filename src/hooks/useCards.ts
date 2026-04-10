import { useState, useCallback } from 'react';
import type { Card } from '../types';
import { storage } from '../utils/storage';
import { generateId } from '../utils/helpers';

export function useCards() {
  const [cards, setCards] = useState<Card[]>(() => storage.getCards());

  const getBoxCards = useCallback((boxId: string) => cards.filter(c => c.boxId === boxId), [cards]);

  const createCard = useCallback((
    boxId: string, question: string, answer: string,
    questionImage?: string, answerImage?: string
  ): Card => {
    const now = new Date().toISOString();
    const card: Card = {
      id: generateId(), boxId,
      question: question.trim(), questionImage,
      answer: answer.trim(), answerImage,
      score: 0, createdAt: now, updatedAt: now,
    };
    setCards(prev => { const u = [...prev, card]; storage.saveCards(u); return u; });
    return card;
  }, []);

  const updateCard = useCallback((
    id: string, question: string, answer: string,
    questionImage?: string, answerImage?: string
  ) => {
    setCards(prev => {
      const u = prev.map(c => c.id === id
        ? { ...c, question: question.trim(), questionImage, answer: answer.trim(), answerImage, updatedAt: new Date().toISOString() }
        : c
      );
      storage.saveCards(u); return u;
    });
  }, []);

  const deleteCard = useCallback((id: string) => {
    setCards(prev => { const u = prev.filter(c => c.id !== id); storage.saveCards(u); return u; });
  }, []);

  const deleteBoxCards = useCallback((boxId: string) => {
    setCards(prev => { const u = prev.filter(c => c.boxId !== boxId); storage.saveCards(u); return u; });
  }, []);

  const updateCardScore = useCallback((id: string, delta: number) => {
    setCards(prev => {
      const u = prev.map(c => c.id === id ? { ...c, score: c.score + delta, updatedAt: new Date().toISOString() } : c);
      storage.saveCards(u); return u;
    });
  }, []);

  const importCards = useCallback((newCards: Card[]) => {
    setCards(prev => { const u = [...prev, ...newCards]; storage.saveCards(u); return u; });
  }, []);

  return { cards, getBoxCards, createCard, updateCard, deleteCard, deleteBoxCards, updateCardScore, importCards };
}
