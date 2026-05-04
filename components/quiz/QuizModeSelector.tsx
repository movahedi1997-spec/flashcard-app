import { Brain, Zap } from 'lucide-react';
import type { QuizDeck } from '@/types/api';

export type QuizStudyMode = 'srs' | 'turbo';

interface Props {
  deck: QuizDeck;
  questionCount: number;
  dueCount: number;
  onSelect: (mode: QuizStudyMode) => void;
}

export default function QuizModeSelector({ deck, questionCount, dueCount, onSelect }: Props) {
  void deck;
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <p className="text-sm text-slate-500">{questionCount} questions · Choose a study mode</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onSelect('srs')}
          className="group bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-start transition-all hover:shadow-md cursor-pointer"
        >
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 w-fit mb-4 group-hover:bg-indigo-100 transition-colors">
            <Brain size={24} />
          </div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">SRS Quiz</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Study today&apos;s due questions. Your answers are recorded and scheduled using spaced repetition.
          </p>
          <div className="mt-4 text-xs font-medium text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full w-fit">
            {dueCount} due today
          </div>
        </button>

        <button
          onClick={() => onSelect('turbo')}
          className="group bg-white border-2 border-slate-200 hover:border-amber-400 rounded-2xl p-6 text-start transition-all hover:shadow-md cursor-pointer"
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 w-fit mb-4 group-hover:bg-amber-100 transition-colors">
            <Zap size={24} />
          </div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">Turbo Quiz</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Race through all questions in random order. No scheduling — just a quick score at the end.
          </p>
          <div className="mt-4 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
            {questionCount} questions · no scheduling
          </div>
        </button>
      </div>
    </div>
  );
}
