'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import FlashLogoMark from './FlashLogoMark';

export default function NavLogo() {
  const [isPwa, setIsPwa] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);
    setIsPwa(standalone);
  }, []);

  const inner = (
    <span className="flex items-center gap-2 font-bold text-gray-900">
      <FlashLogoMark size={28} />
      <span className="text-sm">
        Flashcard<span className="text-violet-600">AI</span>
      </span>
    </span>
  );

  if (isPwa) {
    return <div className="cursor-default select-none">{inner}</div>;
  }

  return <Link href="/">{inner}</Link>;
}
