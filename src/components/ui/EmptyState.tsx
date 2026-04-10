import { type ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="p-5 rounded-2xl bg-slate-100 text-slate-400">{icon}</div>
      <div>
        <p className="text-lg font-semibold text-slate-700">{title}</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
