import { Zap, Brain } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import type { Deck } from '@/types/api';

export type StudyMode = 'srs' | 'cram';

interface Props {
  deck: Deck;
  cardCount: number;
  dueCount: number;
  onSelect: (mode: StudyMode) => void;
  onBack: () => void;
}

export default function ModeSelector({ deck, cardCount, dueCount, onSelect, onBack }: Props) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          aria-label="Back"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{deck.title}</h2>
          <p className="text-sm text-slate-500">{cardCount} cards · Choose a study mode</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SRS Study */}
        <button
          onClick={() => onSelect('srs')}
          className="group bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-left transition-all hover:shadow-md cursor-pointer"
        >
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 w-fit mb-4 group-hover:bg-indigo-100 transition-colors">
            <Brain size={24} />
          </div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">Daily Review</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Study today's due cards. Your answers are recorded and the app schedules what to show you next.
          </p>
          <div className="mt-4 text-xs font-medium text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full w-fit">
            {dueCount} due today
          </div>
        </button>

        {/* Cram / Turbo */}
        <button
          onClick={() => onSelect('cram')}
          className="group bg-white border-2 border-slate-200 hover:border-amber-400 rounded-2xl p-6 text-left transition-all hover:shadow-md cursor-pointer"
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 w-fit mb-4 group-hover:bg-amber-100 transition-colors">
            <Zap size={24} />
          </div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">Turbo</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Flip through every card in random order. No grading — nothing is recorded. Great for a quick pre-exam sweep.
          </p>
          <div className="mt-4 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
            {cardCount} cards · read-only
          </div>
        </button>
      </div>
    </div>
  );
}
