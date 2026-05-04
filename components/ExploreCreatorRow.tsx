'use client';

import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { avatarColor, initials } from '@/lib/avatar';

export interface CreatorResult {
  id:               string;
  name:             string;
  username:         string;
  bio:              string | null;
  avatarUrl:        string | null;
  isVerifiedCreator: boolean;
  deckCount:        number;
  totalCopies:      number;
  joinedAt:         string;
}

interface Props {
  creator: CreatorResult;
}

export default function ExploreCreatorRow({ creator }: Props) {
  const bg = avatarColor(creator.username);

  return (
    <Link
      href={`/creators/${creator.username}`}
      className="flex items-start gap-3 px-4 py-3.5 bg-white hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-b-0 no-underline group"
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full ${bg} flex items-center justify-center text-sm font-bold text-white select-none`}
        aria-hidden="true"
      >
        {creator.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creator.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          initials(creator.name)
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
            {creator.name}
          </span>
          {creator.isVerifiedCreator && (
            <BadgeCheck className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
          )}
          <span className="text-xs text-gray-400">@{creator.username}</span>
        </div>

        {creator.bio && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
            {creator.bio}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
          <span>{creator.deckCount} {creator.deckCount === 1 ? 'deck' : 'decks'}</span>
          {creator.totalCopies > 0 && (
            <>
              <span>·</span>
              <span>{creator.totalCopies.toLocaleString()} {creator.totalCopies === 1 ? 'copy' : 'copies'}</span>
            </>
          )}
        </div>
      </div>

      {/* Arrow hint */}
      <div className="flex-shrink-0 self-center text-gray-300 group-hover:text-indigo-400 transition-colors text-lg leading-none">
        ›
      </div>
    </Link>
  );
}
