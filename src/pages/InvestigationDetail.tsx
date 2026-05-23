import { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Sparkles, Loader2, RefreshCw, ChevronRight, Pencil, HelpCircle, ListChecks, Tags, FileCheck2 } from 'lucide-react';
import {
  getInvestigation, computeInputHash, computeQuestionsHash,
  storeAiReport, updateAiReport, storeAiQuestions, patchInvestigation,
} from '@/data/investigationStore';
import { generateInvestigationReport } from '@/utils/generateReport';
import HpgrdcReportView from '@/components/analysis/HpgrdcReportView';
import EditAiAnalysisDialog from '@/components/analysis/EditAiAnalysisDialog';
import AiQuestionsPanel from '@/components/analysis/AiQuestionsPanel';
import MissingChecksPanel from '@/components/analysis/MissingChecksPanel';
import RecommendationCategoriesPanel from '@/components/analysis/RecommendationCategoriesPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { HpgrdcInvestigation, HpgrdcAiReport, AiQuestion, AiMissingCheck } from '@/types/investigation';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function InvestigationDetail() {
  const { id } = useParams();
  const [inv, setInv] = useState<HpgrdcInvestigation | undefined>(() => getInvestigation(id));
  const [busyFinal, setBusyFinal] = useState(false);
  const [busyQ, setBusyQ] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentHash, setCurrentHash] = useState<string>('');
  const [currentQHash, setCurrentQHash] = useState<string>('');
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (inv) {
      computeInputHash(inv).then(setCurrentHash);
      computeQuestionsHash(inv).then(setCurrentQHash);
    }
  }, [inv]);

  const isStale = useMemo(() => !!inv?.aiReport && currentHash && inv.aiInputHash !== currentHash, [inv, currentHash]);
  const isQuestionsStale = useMemo(() => !!inv?.aiQuestions?.length && currentQHash && inv.questionsInputHash !== currentQHash, [inv, currentQHash]);

  if (!inv) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-lg font-semibold">Investigation not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">Cleared from local storage or never created.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to dashboard</Link>
      </div>
    );
  }

  const runGenerateQuestions = async () => {
    setBusyQ(true);
    try {
      const hash = await computeQuestionsHash(inv);
      const { data, error } = await supabase.functions.invoke('generate-rcfa', {
        body: { investigation: inv, sopExcerpts: inv.sopExcerpts || [], mode: 'questions' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const questions: AiQuestion[] = Array.isArray(data?.questions) ? data.questions : [];
      const missing: AiMissingCheck[] = Array.isArray(data?.missingChecks) ? data.missingChecks : [];
      if (!questions.length) throw new Error('No questions returned');
      const next = storeAiQuestions(inv, questions, missing, hash);
      setInv(next);
      setCurrentQHash(hash);
      toast.success(`${questions.length} investigation questions generated`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to generate questions');
    } finally { setBusyQ(false); }
  };

  const updateQuestions = (next: AiQuestion[]) => {
    setInv(patchInvestigation(inv, { aiQuestions: next }));
  };
  const updateMissing = (next: AiMissingCheck[]) => {
    setInv(patchInvestigation(inv, { aiMissingChecks: next }));
  };
  const updateCategories = (next: string[]) => {
    setInv(patchInvestigation(inv, { recommendationCategories: next }));
  };
  const toggleAppendix = (v: boolean) => {
    setInv(patchInvestigation(inv, { includeSupportNotesInReport: v }));
  };

  const runGenerateFinal = async () => {
    setBusyFinal(true);
    try {
      const hash = await computeInputHash(inv);
      const answers = (inv.aiQuestions || []).map(q => ({ question: q.question, answer: q.answer || '', status: q.status || 'not_checked', evidenceSource: q.evidenceSource }));
      const missingCheckResponses = (inv.aiMissingChecks || []).map(m => ({ text: m.text, status: m.status || '', response: m.response || '' }));
      const { data, error } = await supabase.functions.invoke('generate-rcfa', {
        body: {
          investigation: inv,
          sopExcerpts: inv.sopExcerpts || [],
          mode: 'final',
          answers,
          missingCheckResponses,
          recommendationCategories: inv.recommendationCategories || [],
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.report) throw new Error('Empty response');
      const report: HpgrdcAiReport = {
        ...data.report,
        inputHash: hash,
        generatedAt: new Date().toISOString(),
        model: data.report.model || 'pro',
      };
      const next = storeAiReport(inv, report);
      setInv(next);
      setCurrentHash(hash);
      toast.success('Final investigation report generated');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'AI generation failed');
    } finally {
      setBusyFinal(false);
    }
  };

  const download = async () => {
    if (!inv.aiReport) { toast.error('Generate the report first'); return; }
    setDownloading(true);
    try {
      await generateInvestigationReport(inv, inv.aiReport);
      toast.success('Report downloaded — open the HTML file and print to PDF');
    } catch { toast.error('Failed to download'); }
    finally { setTimeout(() => setDownloading(false), 400); }
  };

  const pendingUnanswered = (inv.aiQuestions || []).filter(q => !q.status || q.status === 'not_checked').length;
  const confirmFinalIfPending = () => {
    if (pendingUnanswered > 0) {
      const ok = window.confirm(`Unanswered investigation questions may reduce RCFA quality. You have ${pendingUnanswered} pending question${pendingUnanswered === 1 ? '' : 's'}. Generate the final report anyway?`);
      if (!ok) return;
    }
    runGenerateFinal();
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">Investigations</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-mono text-foreground">{inv.id}</span>
          </div>
          <h1 className="mt-1 text-xl font-bold">{inv.incidentTitle}</h1>
          <p className="text-sm text-muted-foreground">{inv.location} • {inv.dateOfIncident}{inv.timeOfIncident?` ${inv.timeOfIncident}`:''}</p>
        </div>
        <div className="flex items-center gap-2">
          {inv.classification && (
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {inv.classification === 'NA' ? 'Not Applicable' : inv.classification}
            </span>
          )}
          {inv.aiReport && (
            <button onClick={()=>setEditOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium hover:bg-accent">
              <Pencil className="h-4 w-4"/> Edit AI Analysis
            </button>
          )}
          <button onClick={download} disabled={!inv.aiReport || downloading} className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileDown className="h-4 w-4"/>}
            Download Report
          </button>
        </div>
      </div>

      {/* STAGE 1 — AI Investigation Questions */}
      <StageCard
        icon={<HelpCircle className="h-5 w-5 text-primary" />}
        title="Stage 1 — AI Investigation Questions"
        description="AI reviews your inputs, SOPs and photos and returns grounded investigation questions. Cached until inputs change."
        right={
          !inv.aiQuestions?.length ? (
            <button onClick={runGenerateQuestions} disabled={busyQ} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {busyQ ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
              {busyQ ? 'Generating…' : 'Generate Questions'}
            </button>
          ) : (
            <ConfirmButton
              disabled={busyQ || !isQuestionsStale}
              onConfirm={runGenerateQuestions}
              label={busyQ ? 'Generating…' : 'Regenerate Questions'}
              icon={busyQ ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}
              title="Regenerate questions?"
              body="Inputs have changed. Regeneration will consume one AI call and replace the current questions."
            />
          )
        }
      >
        {isQuestionsStale && <p className="mb-2 rounded bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-500">Inputs changed since questions were generated — consider regenerating.</p>}
        <AiQuestionsPanel questions={inv.aiQuestions || []} onChange={updateQuestions} />
      </StageCard>

      {/* STAGE 2 — Missing checks */}
      <StageCard
        icon={<ListChecks className="h-5 w-5 text-primary" />}
        title="Stage 2 — Missing Checks & Responses"
        description="Investigator marks each suggested missing-evidence check as accepted, ignored, or N/A."
      >
        <MissingChecksPanel checks={inv.aiMissingChecks || []} onChange={updateMissing} />
      </StageCard>

      {/* STAGE 3 — Recommendation Categories */}
      <StageCard
        icon={<Tags className="h-5 w-5 text-primary" />}
        title="Stage 3 — Recommendation Categories"
        description="Choose the categories that apply. AI will only draft recommendations within these."
      >
        <RecommendationCategoriesPanel selected={inv.recommendationCategories || []} onChange={updateCategories} />
      </StageCard>

      {/* STAGE 4 — Final report */}
      <StageCard
        icon={<FileCheck2 className="h-5 w-5 text-primary" />}
        title="Stage 4 — Generate Final Report"
        description="Uses your inputs plus confirmed answers, missing-check responses, and selected categories. Cached until any of those change."
        right={
          !inv.aiReport ? (
            <button onClick={confirmFinalIfPending} disabled={busyFinal} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {busyFinal ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
              {busyFinal ? 'Generating…' : 'Generate Final Report'}
            </button>
          ) : (
            <ConfirmButton
              disabled={busyFinal || !isStale}
              onConfirm={confirmFinalIfPending}
              label={busyFinal ? 'Generating…' : 'Regenerate'}
              icon={busyFinal ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}
              title="Regenerate final report?"
              body="Inputs, answers, missing checks or categories changed. Regeneration will consume one AI call and create a new report version."
            />
          )
        }
      >
        <div className="space-y-3">
          {inv.aiReport && (
            <p className="text-[11px] text-muted-foreground">
              Last generated {new Date(inv.aiReport.generatedAt).toLocaleString()} • model: {inv.aiReport.model}
              {isStale && <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 font-semibold text-amber-500">Inputs changed — regenerate</span>}
            </p>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={!!inv.includeSupportNotesInReport}
              onChange={e => toggleAppendix(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Include investigation support notes in appendix (questions, missing checks, categories).
          </label>
          {pendingUnanswered > 0 && (
            <p className="rounded bg-amber-500/10 px-2 py-1 text-[11px] text-amber-500">
              {pendingUnanswered} unanswered question{pendingUnanswered === 1 ? '' : 's'} — these will remain as visible investigation gaps.
            </p>
          )}
        </div>
      </StageCard>

      <AnimatePresence>
        {inv.aiReport && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
            <HpgrdcReportView inv={inv} report={inv.aiReport} />
          </motion.div>
        )}
      </AnimatePresence>

      {inv.aiReport && (
        <EditAiAnalysisDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          report={inv.aiReport}
          onSave={(next) => {
            const updated = updateAiReport(inv, next);
            setInv(updated);
          }}
        />
      )}
    </motion.div>
  );
}

function StageCard({ icon, title, description, right, children }: {
  icon: React.ReactNode; title: string; description: string; right?: React.ReactNode; children?: React.ReactNode;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icon}</div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {right}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

function ConfirmButton({ disabled, onConfirm, label, icon, title, body }: {
  disabled?: boolean; onConfirm: () => void; label: string; icon: React.ReactNode; title: string; body: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button disabled={disabled} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">
          {icon} {label}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Yes, continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
