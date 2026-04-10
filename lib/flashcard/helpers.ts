export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function scoreColor(score: number): string {
  if (score > 0) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score < 0) return 'text-red-600 bg-red-50 border-red-200';
  return 'text-slate-500 bg-slate-100 border-slate-200';
}
