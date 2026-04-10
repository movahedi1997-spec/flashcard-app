import { Zap, BarChart2 } from 'lucide-react';
import type { Box, StudyMode } from '@/types/flashcard';

interface Props {
  box: Box;
  cardCount: number;
  onSelect: (mode: StudyMode) => void;
  onBack: () => void;
}

export default function ModeSelector({ box, cardCount, onSelect, onBack }: Props) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">←</button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{box.name}</h2>
          <p className="text-sm text-slate-500">{cardCount} cards · Choose a study mode</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('turbo')}
          className="group bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-left transition-all hover:shadow-md cursor-pointer"
        >
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 w-fit mb-4 group-hover:bg-indigo-100 transition-colors">
            <Zap size={24} />
          </div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">Turbo Mode</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Go through every card once in random order. Great for a quick full review.
          </p>
          <div className="mt-4 text-xs font-medium text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full w-fit">
            {cardCount} cards
          </div>
        </button>

        <button
          onClick={() => onSelect('score')}
          className="group bg-white border-2 border-slate-200 hover:border-amber-400 rounded-2xl p-6 text-left transition-all hover:shadow-md cursor-pointer"
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 w-fit mb-4 group-hover:bg-amber-100 transition-colors">
            <BarChart2 size={24} />
          </div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">Score-Based Mode</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Weak cards appear more often. Cards with lower scores get repeated up to 3×.
          </p>
          <div className="mt-4 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
            Adaptive
          </div>
        </button>
      </div>
    </div>
  );
}
