'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className={`fixed bottom-24 end-4 sm:bottom-8 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 active:scale-95 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
