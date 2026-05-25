import type { AiQuestion } from '@/types/investigation';

const SRC_BADGE: Record<string, string> = {
  'User input': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'SOP/manual': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Photo': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'Missing evidence': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

// Pending iff: no status, or status is not_checked / not_available,
// or status is 'answered' but the answer text is blank.
// N/A is explicitly NOT pending.
export function isAiQuestionPending(q: AiQuestion): boolean {
  const s = q.status;
  if (!s || s === 'not_checked' || s === 'not_available') return true;
  if (s === 'answered' && !(q.answer || '').trim()) return true;
  return false;
}

export default function AiQuestionsPanel({
  questions, onChange,
}: {
  questions: AiQuestion[];
  onChange: (next: AiQuestion[]) => void;
}) {
  const update = (id: string, patch: Partial<AiQuestion>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...patch } : q));
  };
  const pendingQs = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => isAiQuestionPending(q));
  const pending = pendingQs.length;

  const jumpTo = (id: string) => {
    const el = document.getElementById(`aiq-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-amber-500');
      setTimeout(() => el.classList.remove('ring-2', 'ring-amber-500'), 1600);
    }
  };

  if (!questions.length) {
    return <p className="text-xs text-muted-foreground">No questions generated yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold">{questions.length} investigation question{questions.length === 1 ? '' : 's'}</span>
        {pending > 0 && (
          <button
            type="button"
            onClick={() => pendingQs[0] && jumpTo(pendingQs[0].q.id)}
            className="rounded border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-500 hover:bg-amber-500/25"
          >
            {pending} question{pending === 1 ? '' : 's'} need status
          </button>
        )}
      </div>
      {pending > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-2 text-[11px]">
          <p className="mb-1 font-semibold text-amber-500">Pending AI Questions</p>
          <ul className="space-y-1">
            {pendingQs.map(({ q, i }) => (
              <li key={q.id} className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">
                  Question #{i + 1}: {q.question.length > 90 ? q.question.slice(0, 90) + '…' : q.question}
                </span>
                <button
                  type="button"
                  onClick={() => jumpTo(q.id)}
                  className="shrink-0 rounded border border-amber-500/40 bg-background px-1.5 py-0.5 font-medium text-amber-500 hover:bg-amber-500/10"
                >
                  Jump to question
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {questions.map((q, i) => {
        const badgeCls = SRC_BADGE[q.evidenceSource] || 'bg-muted text-muted-foreground border-border';
        const pendingCard = isAiQuestionPending(q);
        return (
          <div
            key={q.id}
            id={`aiq-${q.id}`}
            data-pending={pendingCard ? 'true' : undefined}
            className={`rounded-lg border p-3 text-xs space-y-2 transition-shadow ${pendingCard ? 'border-l-4 border-amber-500/50 bg-amber-500/5' : 'border-border bg-muted/30'}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold text-foreground">{i + 1}. {q.question}</p>
                {q.why && <p className="mt-1 text-[11px] text-muted-foreground"><span className="font-semibold uppercase tracking-wider">Why:</span> {q.why}</p>}
                {q.sopRef && <p className="mt-1 text-[11px] text-emerald-400/90"><span className="font-semibold uppercase tracking-wider">Ref:</span> {q.sopRef}</p>}
                {pendingCard && (
                  <p className="mt-1 text-[11px] font-medium text-amber-500">
                    Response pending — select Answered / N.A. / Not checked / Evidence not available.
                  </p>
                )}
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