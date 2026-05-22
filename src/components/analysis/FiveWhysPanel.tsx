import { motion } from 'framer-motion';
import { MessageCircleQuestion, ArrowDown, Target } from 'lucide-react';
import type { Investigation, RcfaReport } from '@/types/investigation';
import EmptyAnalysisState from './EmptyAnalysisState';

interface Props {
  investigation: Investigation;
  report?: RcfaReport | null;
}

export default function FiveWhysPanel({ report }: Props) {
  if (!report?.fiveWhys?.length) {
    return <EmptyAnalysisState label="5 Whys analysis not generated yet" />;
  }

  const whys = report.fiveWhys;
  const lastBecause = whys[whys.length - 1]?.because;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <p className="text-xs text-muted-foreground">
          AI-derived 5 Whys chain — each answer drives the next question down to the systemic root cause.
        </p>
      </div>

      <div className="space-y-1">
        {whys.map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MessageCircleQuestion className="h-3.5 w-3.5 text-primary" />
                  <p className="text-sm font-semibold">{w.why}</p>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">→ {w.because}</p>
              </div>
            </div>
            {i < whys.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {lastBecause && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: whys.length * 0.08 + 0.1 }}
          className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Systemic Root Cause</p>
          <p className="mt-1 text-sm font-medium">{lastBecause}</p>
        </motion.div>
      )}
    </div>
  );
}