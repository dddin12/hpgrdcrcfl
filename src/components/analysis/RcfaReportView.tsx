import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, FileText, Clock, AlertOctagon, ListOrdered, Fish, Users, ShieldAlert, Gauge, Wrench, Sparkles, GraduationCap, Info } from 'lucide-react';
import type { RcfaReport, RcfaActionItem } from '@/types/investigation';

const FISH_COLORS: Record<string, string> = {
  man: 'border-rose-500/40 bg-rose-500/5',
  machine: 'border-blue-500/40 bg-blue-500/5',
  method: 'border-emerald-500/40 bg-emerald-500/5',
  material: 'border-amber-500/40 bg-amber-500/5',
  measurement: 'border-cyan-500/40 bg-cyan-500/5',
  environment: 'border-violet-500/40 bg-violet-500/5',
};

function Section({ title, icon: Icon, defaultOpen = true, children }: { title: string; icon: any; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-border p-4">{children}</div>}
    </div>
  );
}

function ActionTable({ items }: { items: RcfaActionItem[] }) {
  if (!items?.length) return <p className="text-xs text-muted-foreground">None specified.</p>;
  const colorFor = (p?: string) => p === 'high' ? 'bg-destructive/15 text-destructive' : p === 'medium' ? 'bg-amber-500/15 text-amber-500' : p === 'low' ? 'bg-blue-500/15 text-blue-400' : 'bg-muted text-muted-foreground';
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-left text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-2 pr-3 font-medium">#</th>
            <th className="py-2 pr-3 font-medium">Action</th>
            <th className="py-2 pr-3 font-medium">Priority</th>
            <th className="py-2 pr-3 font-medium">Owner</th>
            <th className="py-2 font-medium">Due</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a, i) => (
            <tr key={i} className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 font-mono text-muted-foreground">{i + 1}</td>
              <td className="py-2 pr-3">{a.description}</td>
              <td className="py-2 pr-3"><span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${colorFor(a.priority)}`}>{a.priority || '—'}</span></td>
              <td className="py-2 pr-3 text-muted-foreground">{a.owner || '—'}</td>
              <td className="py-2 text-muted-foreground">{a.dueWindow || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-xs text-muted-foreground">None identified.</p>;
  return <ul className="space-y-1.5 text-sm">{items.map((x, i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />{x}</li>)}</ul>;
}

export default function RcfaReportView({ report }: { report: RcfaReport }) {
  return (
    <div className="space-y-3">
      <Section title="1. Incident Summary" icon={FileText}>
        <p className="text-sm leading-relaxed">{report.incidentSummary}</p>
      </Section>

      <Section title="2. Chronology of Events" icon={Clock}>
        <ol className="relative space-y-3 border-l border-border pl-5">
          {report.chronology.map((c, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative">
              <span className="absolute -left-[27px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
              {c.time && <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">{c.time}</div>}
              <div className="text-sm">{c.event}</div>
            </motion.li>
          ))}
        </ol>
      </Section>

      <Section title="3. Immediate Cause" icon={AlertOctagon}>
        <p className="rounded-md border-l-2 border-amber-500 bg-amber-500/5 p-3 text-sm">{report.immediateCause}</p>
      </Section>

      <Section title="4. 5 Whys Analysis" icon={ListOrdered}>
        <ol className="space-y-3">
          {report.fiveWhys.map((w, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{w.why}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">→ {w.because}</div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="5. Fishbone Analysis (6M)" icon={Fish}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(['man','machine','method','material','measurement','environment'] as const).map(k => (
            <div key={k} className={`rounded-md border ${FISH_COLORS[k]} p-3`}>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider">{k}</div>
              <ul className="space-y-1 text-xs">
                {(report.fishbone[k] || []).map((x, i) => <li key={i}>• {x}</li>)}
                {!report.fishbone[k]?.length && <li className="text-muted-foreground">—</li>}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="6. Key Factors Identified" icon={Users}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(['human','system','physical','organizational'] as const).map(k => (
            <div key={k} className="rounded-md border border-border bg-muted/30 p-3">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{k} factors</div>
              <Bullets items={report.keyFactors[k] || []} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="7. Barrier Failure Analysis" icon={ShieldAlert}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-500">Existing</div>
            <Bullets items={report.barriers.existing} />
          </div>
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-destructive">Failed</div>
            <Bullets items={report.barriers.failed} />
          </div>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-500">Missing</div>
            <Bullets items={report.barriers.missing} />
          </div>
        </div>
      </Section>

      <Section title="8. Risk Assessment" icon={Gauge}>
        <div className="grid gap-3 md:grid-cols-3">
          {(['severity','likelihood','escalation'] as const).map(k => (
            <div key={k} className="rounded-md border border-border bg-muted/30 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{k === 'escalation' ? 'Escalation Potential' : k}</div>
              <div className="mt-1 text-sm">{report.riskAssessment[k]}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="9. Corrective Actions" icon={Wrench}>
        <ActionTable items={report.correctiveActions} />
      </Section>

      <Section title="10. Preventive Actions" icon={Sparkles}>
        <ActionTable items={report.preventiveActions} />
      </Section>

      <Section title="11. Lessons Learned" icon={GraduationCap}>
        <Bullets items={report.lessonsLearned} />
      </Section>

      {report.assumptions?.length ? (
        <Section title="Assumptions / Information Gaps" icon={Info} defaultOpen={false}>
          <Bullets items={report.assumptions} />
        </Section>
      ) : null}
    </div>
  );
}