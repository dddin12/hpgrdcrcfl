import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleQuestion, Sparkles, ArrowDown, Check, Pencil, X } from 'lucide-react';
import { Investigation } from '@/types/investigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  investigation: Investigation;
}

interface WhyStep {
  question: string;
  aiAnswer: string;
  userAnswer?: string;
  accepted: boolean;
}

const initialWhys: WhyStep[] = [
  { question: 'Why did the transient engine dynamometer shut down?', aiAnswer: 'The eddy current absorber overheated, triggering the emergency shutdown circuit.', accepted: false },
  { question: 'Why did the eddy current absorber overheat?', aiAnswer: 'Coolant flow to the absorber was insufficient — the flow sensor was reading false-normal values.', accepted: false },
  { question: 'Why was the coolant flow sensor giving false readings?', aiAnswer: 'The sensor had drifted out of calibration over 6 months without recalibration.', accepted: false },
  { question: 'Why was the sensor not recalibrated on schedule?', aiAnswer: 'The CMMS preventive maintenance task for dyno sensor calibration was overdue — no automated alerts were configured.', accepted: false },
  { question: 'Why were automated calibration alerts not configured in the CMMS?', aiAnswer: 'The CMMS implementation for the engine test cell did not include sensor-specific PM tasks as required by SOP-DYNO-003.', accepted: false },
];

export default function FiveWhysPanel({ investigation }: Props) {
  const [whys, setWhys] = useState<WhyStep[]>(initialWhys);
  const [revealed, setRevealed] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [pendingCustom, setPendingCustom] = useState<number | null>(null);

  const acceptAndContinue = (index: number) => {
    const updated = [...whys];
    updated[index] = { ...updated[index], accepted: true };
    setWhys(updated);
    if (revealed < whys.length) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setRevealed(prev => prev + 1);
        setIsAnalyzing(false);
      }, 1000);
    }
  };

  const startCustomInput = (index: number) => {
    setPendingCustom(index);
    setCustomInput('');
  };

  const submitCustomInput = (index: number) => {
    if (!customInput.trim()) return;
    const updated = [...whys];
    updated[index] = { ...updated[index], userAnswer: customInput.trim(), accepted: true };
    setWhys(updated);
    setPendingCustom(null);
    setCustomInput('');
    if (revealed < whys.length) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setRevealed(prev => prev + 1);
        setIsAnalyzing(false);
      }, 1000);
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setCustomInput(whys[index].userAnswer || whys[index].aiAnswer);
  };

  const submitEdit = (index: number) => {
    if (!customInput.trim()) return;
    const updated = [...whys];
    updated[index] = { ...updated[index], userAnswer: customInput.trim() };
    setWhys(updated);
    setEditingIndex(null);
    setCustomInput('');
  };

  const getDisplayAnswer = (why: WhyStep) => why.userAnswer || why.aiAnswer;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-xs text-muted-foreground">AI-guided 5 Whys — accept AI answers or provide your own at each step</p>
      </div>

      <div className="space-y-1">
        {whys.slice(0, revealed).map((why, i) => (
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
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircleQuestion className="h-3.5 w-3.5 text-primary" />
                  <p className="text-sm font-semibold">{why.question}</p>
                </div>

                {/* Editing mode */}
                {editingIndex === i ? (
                  <div className="flex gap-2">
                    <Input
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter your answer..."
                      className="text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && submitEdit(i)}
                    />
                    <Button size="sm" onClick={() => submitEdit(i)}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingIndex(null); setCustomInput(''); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : why.accepted ? (
                  /* Accepted answer */
                  <div className="flex items-start justify-between gap-2">
                    <p className="mt-1 text-sm text-muted-foreground">
                      {why.userAnswer && <span className="text-[10px] font-semibold text-primary mr-1.5">[YOUR INPUT]</span>}
                      {getDisplayAnswer(why)}
                    </p>
                    <button onClick={() => startEdit(i)} className="shrink-0 mt-1 text-muted-foreground hover:text-primary transition-colors">
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                ) : pendingCustom === i ? (
                  /* Custom input mode */
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground italic">AI suggestion: {why.aiAnswer}</p>
                    <div className="flex gap-2">
                      <Input
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Type your own answer..."
                        className="text-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && submitCustomInput(i)}
                      />
                      <Button size="sm" onClick={() => submitCustomInput(i)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setPendingCustom(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Pending acceptance — show AI answer + action buttons */
                  <div className="space-y-2">
                    <p className="mt-1 text-sm text-muted-foreground">{why.aiAnswer}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => acceptAndContinue(i)} className="text-xs h-7">
                        <Check className="h-3 w-3 mr-1" /> Accept & Continue
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => startCustomInput(i)} className="text-xs h-7">
                        <Pencil className="h-3 w-3 mr-1" /> I know the answer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {i < revealed - 1 && why.accepted && (
              <div className="flex justify-center py-1">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Analyzing indicator */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-spin" />
              Analyzing next cause...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Root cause conclusion */}
      {revealed === whys.length && whys[whys.length - 1].accepted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Root Cause Identified</p>
          <p className="mt-1 text-sm font-medium">
            CMMS implementation gap — sensor-specific preventive maintenance tasks (including calibration schedules) were not configured for engine test cell equipment as required by SOP-DYNO-003.
          </p>
        </motion.div>
      )}
    </div>
  );
}
