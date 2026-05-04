'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import ReportProfileModal from './ReportProfileModal';

interface Props {
  reportedUserId: string;
  reportedName: string;
}

export default function ReportProfileButton({ reportedUserId, reportedName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
      >
        <Flag size={13} />
        Report this profile
      </button>
      {open && (
        <ReportProfileModal
          reportedUserId={reportedUserId}
          reportedName={reportedName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
