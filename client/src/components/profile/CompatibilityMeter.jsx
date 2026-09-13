export function CompatibilityMeter({ score }) {
  const rounded = Math.round(score ?? 0);
  const color = rounded >= 70 ? 'bg-emerald-500' : rounded >= 40 ? 'bg-amber-500' : 'bg-slate-400';

  return (
    <div className="flex items-center gap-2" title={`${rounded}% compatible based on skills, interests, availability, and experience`}>
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rounded}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600">{rounded}% match</span>
    </div>
  );
}
