export interface Box {
  id: string;
  name: string;
  createdAt: string;
}

export interface Card {
  id: string;
  boxId: string;
  question: string;
  questionImage?: string;
  answer: string;
  answerImage?: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export type StudyMode = 'turbo' | 'score';

export type SortOption = 'newest' | 'oldest' | 'score-asc' | 'score-desc' | 'alpha';

export interface StudyStats {
  correct: number;
  wrong: number;
  notSure: number;
}
