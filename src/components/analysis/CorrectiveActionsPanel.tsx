import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Wrench, Sparkles } from 'lucide-react';
import type { Investigation, RcfaReport, RcfaActionItem } from '@/types/investigation';
import EmptyAnalysisState from './EmptyAnalysisState';

interface Props {
  investigation: Investigation;
  report?: RcfaReport | null;
}

const priorityStyles: Record<string, string> = {
  high: 'bg-critical/15 text-critical border-critical/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  low: 'bg-info/15 text-info border-info/30',
};

function ActionList({ items, kind }: { items: RcfaActionItem[]; kind: 'corrective' | 'preventive' }) {
  if (!items?.length) {
    return <p className="text-xs text-muted-foreground italic px-1">None proposed by the AI for this category.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((a, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4"
        >
          {kind === 'corrective' ? <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{kind === 'corrective' ? 'CA' : 'PA'}-{String(i + 1).padStart(3, '0')}</span>
              {a.priority && (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityStyles[a.priority]}`}>{a.priority}</span>
              )}
            </div>
            <p className="mt-1 text-sm">{a.description}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
              {a.owner && <span>Owner: <span className="text-foreground">{a.owner}</span></span>}
              {a.dueWindow && <span>Due: <span className="text-foreground">{a.dueWindow}</span></span>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function CorrectiveActionsPanel({ report }: Props) {
  if (!report) return <EmptyAnalysisState label="Corrective & preventive actions not generated yet" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-xs text-muted-foreground">AI-proposed actions grounded in the incident details and any SOP excerpts you attached.</p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold">Corrective Actions</h3>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Immediate containment</span>
        </div>
        <ActionList items={report.correctiveActions || []} kind="corrective" />
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">Preventive Actions</h3>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Long-term improvements</span>
        </div>
        <ActionList items={report.preventiveActions || []} kind="preventive" />
      </div>

      {report.lessonsLearned?.length ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-primary">Lessons Learned</h3>
          </div>
          <ul className="space-y-1.5 text-sm">
            {report.lessonsLearned.map((l, i) => (
              <li key={i} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />{l}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}