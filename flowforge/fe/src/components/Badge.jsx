const COLORS = {
  // Status
  Todo: 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Review: 'bg-amber-100 text-amber-700',
  Done: 'bg-emerald-100 text-emerald-700',
  Planning: 'bg-slate-100 text-slate-700',
  'On Hold': 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  // Priority
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
  // Workflow execution status
  Success: 'bg-emerald-100 text-emerald-700',
  Failed: 'bg-red-100 text-red-700',
  Running: 'bg-blue-100 text-blue-700',
};

export default function Badge({ children, color }) {
  const cls = color || COLORS[children] || 'bg-slate-100 text-slate-700';
  return <span className={`badge ${cls}`}>{children}</span>;
}
