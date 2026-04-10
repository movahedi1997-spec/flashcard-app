'use client';

import { useState, useCallback } from 'react';
import type { Box } from '@/types/flashcard';
import { storage } from '@/lib/flashcard/storage';
import { generateId } from '@/lib/flashcard/helpers';

export function useBoxes() {
  const [boxes, setBoxes] = useState<Box[]>(() => storage.getBoxes());

  const createBox = useCallback((name: string): Box => {
    const box: Box = { id: generateId(), name: name.trim(), createdAt: new Date().toISOString() };
    setBoxes(prev => { const u = [...prev, box]; storage.saveBoxes(u); return u; });
    return box;
  }, []);

  const updateBox = useCallback((id: string, name: string) => {
    setBoxes(prev => { const u = prev.map(b => b.id === id ? { ...b, name: name.trim() } : b); storage.saveBoxes(u); return u; });
  }, []);

  const deleteBox = useCallback((id: string) => {
    setBoxes(prev => { const u = prev.filter(b => b.id !== id); storage.saveBoxes(u); return u; });
  }, []);

  const importBoxes = useCallback((newBoxes: Box[]) => {
    setBoxes(prev => { const u = [...prev, ...newBoxes]; storage.saveBoxes(u); return u; });
  }, []);

  return { boxes, createBox, updateBox, deleteBox, importBoxes };
}
