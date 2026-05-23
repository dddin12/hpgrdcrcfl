import type { AiMissingCheck } from '@/types/investigation';

export default function MissingChecksPanel({
  checks, onChange,
}: {
  checks: AiMissingCheck[];
  onChange: (next: AiMissingCheck[]) => void;
}) {
  const update = (id: string, patch: Partial<AiMissingCheck>) => {
    onChange(checks.map(c => c.id === id ? { ...c, ...patch } : c));
  };
  if (!checks.length) return <p className="text-xs text-muted-foreground">No missing-evidence checks suggested.</p>;

  return (
    <div className="space-y-2">
      {checks.map((c, i) => (
        <div key={c.id} className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-2">
          <p className="font-medium">{i + 1}. To verify — {c.text}</p>
          <div className="flex flex-wrap gap-1">
            {(['accept','ignore','na'] as const).map(s => (
              <button key={s} type="button" onClick={() => update(c.id, { status: s })}
                className={`rounded px-2 py-0.5 text-[10px] font-medium border ${c.status === s ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-background hover:bg-muted text-muted-foreground'}`}>
                {s === 'accept' ? 'Accept' : s === 'ignore' ? 'Ignore' : 'Not applicable'}
              </button>
            ))}
          </div>
          <input
            className="w-full rounded border border-border bg-background px-2 py-1 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            placeholder="Optional response / evidence reference"
            value={c.response || ''}
            onChange={e => update(c.id, { response: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
}