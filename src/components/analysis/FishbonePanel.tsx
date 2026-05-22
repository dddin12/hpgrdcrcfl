import { motion } from 'framer-motion';
import type { Investigation, RcfaReport } from '@/types/investigation';
import EmptyAnalysisState from './EmptyAnalysisState';

interface Props {
  investigation: Investigation;
  report?: RcfaReport | null;
}

type Cat = { key: keyof RcfaReport['fishbone']; name: string; color: string; bg: string; border: string; dot: string };

const top: Cat[] = [
  { key: 'man', name: 'Man',           color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/40',    dot: 'bg-rose-500' },
  { key: 'machine', name: 'Machine',   color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/40',    dot: 'bg-blue-500' },
  { key: 'method', name: 'Method',     color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', dot: 'bg-emerald-500' },
];
const bottom: Cat[] = [
  { key: 'material', name: 'Material',         color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/40',  dot: 'bg-amber-500' },
  { key: 'measurement', name: 'Measurement',   color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/40',   dot: 'bg-cyan-500' },
  { key: 'environment', name: 'Environment',   color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/40', dot: 'bg-violet-500' },
];

function Bone({ cat, causes, index, side }: { cat: Cat; causes: string[]; index: number; side: 'top' | 'bottom' }) {
  const delay = 0.15 + index * 0.1;
  return (
    <motion.div
      initial={{ opacity: 0, y: side === 'top' ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex-1 min-w-[140px] flex flex-col items-center gap-2"
    >
      {side === 'bottom' && <div className={`w-px h-8 ${cat.dot} opacity-40`} />}
      <div className={`rounded-lg border-2 ${cat.border} ${cat.bg} px-3 py-2 w-full max-w-[200px]`}>
        <div className="flex items-center gap-1.5 mb-2">
          <span className={`h-2.5 w-2.5 rounded-full ${cat.dot}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${cat.color}`}>{cat.name}</span>
        </div>
        <div className="space-y-1">
          {causes.length === 0 && <div className="text-[10px] text-muted-foreground italic px-2 py-1">No causes identified</div>}
          {causes.map((c, ci) => (
            <motion.div
              key={ci}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.08 + ci * 0.05 }}
              className={`text-[10px] leading-tight px-2 py-1 rounded ${cat.bg} border ${cat.border} text-muted-foreground`}
            >
              {c}
            </motion.div>
          ))}
        </div>
      </div>
      {side === 'top' && <div className={`w-px h-8 ${cat.dot} opacity-40`} />}
    </motion.div>
  );
}

export default function FishbonePanel({ investigation, report }: Props) {
  if (!report?.fishbone) {
    return <EmptyAnalysisState label="Fishbone (6M) analysis not generated yet" />;
  }
  return (
    <div className="overflow-x-auto">
      <p className="mb-4 text-xs text-muted-foreground">
        Ishikawa (6M) causes for: <span className="font-medium text-foreground">{investigation.equipment}</span>
      </p>
      <div className="min-w-[600px] pb-4">
        <div className="flex gap-3 justify-center px-4">
          {top.map((cat, i) => <Bone key={cat.key} cat={cat} causes={report.fishbone[cat.key] || []} index={i} side="top" />)}
        </div>
        <div className="relative flex items-center mx-4 my-0">
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6 }}
            className="flex-1 h-1 bg-gradient-to-r from-muted via-primary/60 to-destructive rounded-full origin-left"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="ml-2 shrink-0 rounded-lg border-2 border-destructive bg-destructive/10 px-4 py-2 text-center max-w-[200px]"
          >
            <p className="text-[9px] font-bold uppercase tracking-wider text-destructive">Effect</p>
            <p className="text-xs font-semibold leading-tight mt-0.5 text-foreground">{investigation.equipment} — {investigation.incidentType.replace('-', ' ')}</p>
          </motion.div>
        </div>
        <div className="flex gap-3 justify-center px-4">
          {bottom.map((cat, i) => <Bone key={cat.key} cat={cat} causes={report.fishbone[cat.key] || []} index={i} side="bottom" />)}
        </div>
      </div>
    </div>
  );
}