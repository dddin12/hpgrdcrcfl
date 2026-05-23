import type { AiQuestion } from '@/types/investigation';

const SRC_BADGE: Record<string, string> = {
  'User input': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'SOP/manual': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Photo': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'Missing evidence': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

export default function AiQuestionsPanel({
  questions, onChange,
}: {
  questions: AiQuestion[];
  onChange: (next: AiQuestion[]) => void;
}) {
  const update = (id: string, patch: Partial<AiQuestion>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...patch } : q));
  };
  const pending = questions.filter(q => !q.status || q.status === 'not_checked').length;

  if (!questions.length) {
    return <p className="text-xs text-muted-foreground">No questions generated yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">{questions.length} investigation question{questions.length === 1 ? '' : 's'}</span>
        {pending > 0 && <span className="rounded bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-500">{pending} pending</span>}
      </div>
      {questions.map((q, i) => {
        const badgeCls = SRC_BADGE[q.evidenceSource] || 'bg-muted text-muted-foreground border-border';
        return (
          <div key={q.id} className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold text-foreground">{i + 1}. {q.question}</p>
                {q.why && <p className="mt-1 text-[11px] text-muted-foreground"><span className="font-semibold uppercase tracking-wider">Why:</span> {q.why}</p>}
              </div>
              <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold ${badgeCls}`}>{q.evidenceSource}</span>
            </div>
            <textarea
              className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              placeholder="Investigator response (leave blank if not checked)"
              value={q.answer || ''}
              rows={2}
              onChange={e => update(q.id, { answer: e.target.value, status: e.target.value.trim() ? 'answered' : 'not_checked' })}
            />
            <div className="flex flex-wrap gap-1">
              {(['answered','na','not_checked','not_available'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => update(q.id, { status: s })}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium border ${q.status === s ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-background hover:bg-muted text-muted-foreground'}`}
                >
                  {s === 'answered' ? 'Answered' : s === 'na' ? 'N/A' : s === 'not_checked' ? 'Not checked' : 'Evidence not available'}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}