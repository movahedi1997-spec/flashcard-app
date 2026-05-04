import type { Subject } from '@/types/api';

export const SUBJECTS: { value: Subject | 'all'; label: string; emoji: string }[] = [
  { value: 'all',             label: 'All',          emoji: '🌐' },
  { value: 'medicine',        label: 'Medicine',     emoji: '🩺' },
  { value: 'pharmacy',        label: 'Pharmacy',     emoji: '💊' },
  { value: 'chemistry',       label: 'Chemistry',    emoji: '⚗️' },
  { value: 'biology',         label: 'Biology',      emoji: '🧬' },
  { value: 'physics',         label: 'Physics',      emoji: '⚛️' },
  { value: 'mathematics',     label: 'Mathematics',  emoji: '📐' },
  { value: 'computer_science',label: 'CS',           emoji: '💻' },
  { value: 'languages',       label: 'Languages',    emoji: '🗣️' },
  { value: 'history',         label: 'History',      emoji: '🏛️' },
  { value: 'philosophy',      label: 'Philosophy',   emoji: '🤔' },
  { value: 'psychology',      label: 'Psychology',   emoji: '🧠' },
  { value: 'literature',      label: 'Literature',   emoji: '📖' },
  { value: 'economics',       label: 'Economics',    emoji: '📊' },
  { value: 'law',             label: 'Law',          emoji: '⚖️' },
  { value: 'science',         label: 'Science',      emoji: '🔬' },
  { value: 'other',           label: 'Other',        emoji: '📚' },
];

export const SUBJECT_LABELS: Record<string, string> = Object.fromEntries(
  SUBJECTS.filter((s) => s.value !== 'all').map((s) => [s.value, s.label]),
);

export const VALID_SUBJECTS = SUBJECTS.filter((s) => s.value !== 'all').map((s) => s.value as Subject);
