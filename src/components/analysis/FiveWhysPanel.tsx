import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircleQuestion, Sparkles, ArrowDown } from 'lucide-react';
import { Investigation } from '@/types/investigation';

interface Props {
  investigation: Investigation;
}

const mockWhys = [
  { question: 'Why did the HPLC pump fail?', answer: 'The pump seal degraded and cracked, allowing solvent to leak.' },
  { question: 'Why did the pump seal degrade?', answer: 'The seal exceeded its service life without replacement.' },
  { question: 'Why was the seal not replaced on schedule?', answer: 'The preventive maintenance task was overdue by 3 weeks.' },
  { question: 'Why was preventive maintenance overdue?', answer: 'The maintenance tracking system had no automated alerts configured.' },
  { question: 'Why were automated alerts not configured?', answer: 'The CMMS implementation did not include alert setup for lab-specific equipment per SOP-MAINT-005.' },
];

export default function FiveWhysPanel({ investigation }: Props) {
  const [revealed, setRevealed] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const revealNext = () => {
    if (revealed < mockWhys.length) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setRevealed(prev => prev + 1);
        setIsAnalyzing(false);
      }, 1200);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-xs text-muted-foreground">AI-guided 5 Whys analysis based on incident data and uploaded SOPs</p>
      </div>

      <div className="space-y-1">
        {mockWhys.slice(0, revealed).map((why, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MessageCircleQuestion className="h-3.5 w-3.5 text-primary" />
                  <p className="text-sm font-semibold">{why.question}</p>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{why.answer}</p>
              </div>
            </div>
            {i < revealed - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {revealed < mockWhys.length && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={revealNext}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Ask Why #{revealed + 1}
              </>
            )}
          </button>
        </div>
      )}

      {revealed === mockWhys.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Root Cause Identified</p>
          <p className="mt-1 text-sm font-medium">CMMS implementation gap — automated maintenance alerts were not configured for lab equipment as required by SOP-MAINT-005.</p>
        </motion.div>
      )}
    </div>
  );
}
