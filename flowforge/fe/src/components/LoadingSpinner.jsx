import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 24, full = false, label }) {
  if (full) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={size} />
        {label && <p className="text-sm">{label}</p>}
      </div>
    );
  }
  return <Loader2 className="animate-spin inline-block" size={size} />;
}
