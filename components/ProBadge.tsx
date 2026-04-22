import { Zap } from 'lucide-react';

interface Props {
  isPro: boolean;
  size?: 'sm' | 'md';
}

export default function ProBadge({ isPro, size = 'sm' }: Props) {
  if (isPro) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 font-bold text-white ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}>
        <Zap size={size === 'sm' ? 9 : 11} />
        Pro
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-gray-100 font-medium text-gray-500 ${
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
    }`}>
      Basic
    </span>
  );
}
