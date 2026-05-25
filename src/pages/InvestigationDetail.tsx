import { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Sparkles, Loader2, RefreshCw, ChevronRight, Pencil, HelpCircle, ListChecks, Tags, FileCheck2, ArrowLeft, Save, Home, AlertTriangle, ChevronDown } from 'lucide-react';
import {
  getInvestigation, computeInputHash, computeQuestionsHash,
  storeAiReport, updateAiReport, storeAiQuestions, patchInvestigation,
} from '@/data/investigationStore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { generateInvestigationReport } from '@/utils/generateReport';
import HpgrdcReportView from '@/components/analysis/HpgrdcReportView';
import EditAiAnalysisDialog from '@/components/analysis/EditAiAnalysisDialog';
import AiQuestionsPanel from '@/components/analysis/AiQuestionsPanel';
import { isAiQuestionPending } from '@/components/analysis/AiQuestionsPanel';
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
  const navigate = useNavigate();
  const [inv, setInv] = useState<HpgrdcInvestigation | undefined>(() => getInvestigation(id));
  const [busyFinal, setBusyFinal] = useState(false);
  const [busyQ, setBusyQ] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentHash, setCurrentHash] = useState<string>('');
  const [currentQHash, setCurrentQHash] = useState<string>('');
  const [editOpen, setEditOpen] = useState(false);
  const [overrideStaleDownload, setOverrideStaleDownload] = useState(false);
  const [dismissedStaleQ, setDismissedStaleQ] = useState(false);

  useEffect(() => {
    if (inv) {
      computeInputHash(inv).then(setCurrentHash);
      computeQuestionsHash(inv).then(setCurrentQHash);
    }
  }, [inv]);

  const isStale = useMemo(() => !!(inv?.aiReport && currentHash && inv.aiInputHash !== currentHash), [inv, currentHash]);
  const isQuestionsStale = useMemo(() => !!(inv?.aiQuestions?.length && currentQHash && inv.questionsInputHash !== currentQHash), [inv, currentQHash]);

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
      const allAnswers = (inv.aiQuestions || []).map(q => ({ question: q.question, answer: q.answer || '', status: q.status || 'not_checked', evidenceSource: q.evidenceSource }));
      // SAFEGUARD: Only confirmed answers are sent as ground truth.
      // Pending questions (not_checked / not_available / blank) are sent as pendingGaps only.
      // N/A questions are dropped entirely — neither facts nor pending. Do NOT auto-mark pending as answered.
      const answers = allAnswers.filter(a => a.status === 'answered' && a.answer.trim());
      const pendingGaps = allAnswers
        .filter(a => a.status !== 'na' && !(a.status === 'answered' && a.answer.trim()))
        .map(a => ({ question: a.question, status: a.status }));
      const missingCheckResponses = (inv.aiMissingChecks || []).map(m => ({ text: m.text, status: m.status || '', response: m.response || '' }));
      const { data, error } = await supabase.functions.invoke('generate-rcfa', {
        body: {
          investigation: inv,
          sopExcerpts: inv.sopExcerpts || [],
          mode: 'final',
          answers,
          pendingGaps,
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
      setOverrideStaleDownload(false);
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
    if (isStale && !overrideStaleDownload) {
      toast.error('Report is outdated. Regenerate or tap "Download existing report without regeneration".');
      return;
    }
    // Chronology row-count guard
    const renderable = (inv.chronology || []).filter(c => (c.event || '').trim());
    if (renderable.length !== (inv.chronology || []).length) {
      toast.error('Chronology row count mismatch. Please review report generation.');
      return;
    }
    setDownloading(true);
    try {
      await generateInvestigationReport(inv, inv.aiReport);
      if (isStale && overrideStaleDownload) {
        toast.message('Downloading previous report — note: inputs have changed.');
        setOverrideStaleDownload(false);
      }
      toast.success('Report downloaded — open the HTML file and print to PDF');
    } catch { toast.error('Failed to download'); }
    finally { setTimeout(() => setDownloading(false), 400); }
  };

  // SAFEGUARD: pendingUnanswered uses the shared isPending rule.
  // N/A is NOT pending. Not checked / Evidence not available / blank ARE pending.
  const pendingUnanswered = (inv.aiQuestions || []).filter(isAiQuestionPending).length;

  const actionBar = (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={()=>navigate(`/new-investigation/${inv.id}`)} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium hover:bg-accent">
        <ArrowLeft className="h-3.5 w-3.5"/> Back to Edit Investigation
      </button>
      <button onClick={()=>{ patchInvestigation(inv, {}); toast.success('Draft saved'); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium hover:bg-accent">
        <Save className="h-3.5 w-3.5"/> Save Draft
      </button>
      <button onClick={()=>navigate('/')} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium hover:bg-accent">
        <Home className="h-3.5 w-3.5"/> Return to Dashboard
      </button>
    </div>
  );

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
          <button onClick={download} disabled={!inv.aiReport || downloading || (isStale && !overrideStaleDownload)} className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileDown className="h-4 w-4"/>}
            Download Report
          </button>
        </div>
      </div>

      {actionBar}

      {inv.aiReport && isStale && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs">
          <p className="mb-2 flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4"/> Report may be outdated. Inputs changed since last generation.
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={runGenerateFinal} disabled={busyFinal} className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-50">
              <RefreshCw className="h-3.5 w-3.5"/> Regenerate AI Report
            </button>
            <button onClick={()=>setOverrideStaleDownload(true)} disabled={overrideStaleDownload} className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-50">
              {overrideStaleDownload ? 'Override active — Download Report' : 'Download existing report without regeneration'}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 1 — AI Investigation Questions */}
      <StageCard
        icon={<HelpCircle className="h-5 w-5 text-primary" />}
        title="Step 1 — AI Suggested Investigation Questions"
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
        {isQuestionsStale && !dismissedStaleQ && (
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded bg-amber-500/15 px-2 py-1.5 text-[11px] text-amber-500">
            <span className="font-semibold">Inputs changed. Existing AI questions may be outdated.</span>
            <button onClick={()=>setDismissedStaleQ(true)} className="rounded border border-amber-500/40 bg-background/40 px-2 py-0.5 font-medium hover:bg-background/80">Keep existing questions</button>
          </div>
        )}
        <AiQuestionsPanel questions={inv.aiQuestions || []} onChange={updateQuestions} />
      </StageCard>

      {/* STAGE 2 — Missing checks */}
      <StageCard
        icon={<ListChecks className="h-5 w-5 text-primary" />}
        title="Step 2 — Missing Checks & Responses"
        description="Investigator marks each suggested missing-evidence check as accepted, ignored, or N/A."
      >
        <MissingChecksPanel checks={inv.aiMissingChecks || []} onChange={updateMissing} />
      </StageCard>

      {/* Advanced: Recommendation Categories (collapsible) */}
      <Collapsible className="glass-card p-5">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 text-left">
          <div className="flex items-start gap-3">
            <Tags className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Advanced — Guide Recommendation Type</p>
              <p className="text-xs text-muted-foreground">Optional. Restrict AI recommendations to selected categories.</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [&[data-state=open]]:rotate-180"/>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <RecommendationCategoriesPanel selected={inv.recommendationCategories || []} onChange={updateCategories} />
        </CollapsibleContent>
      </Collapsible>

      {/* STAGE 3 — Final report */}
      <StageCard
        icon={<FileCheck2 className="h-5 w-5 text-primary" />}
        title="Step 3 — Generate Final Report"
        description="Uses your inputs plus confirmed answers, missing-check responses, and selected categories. Only answered questions are used as facts; unanswered questions remain as pending investigation gaps."
        right={
          !inv.aiReport ? (
            pendingUnanswered > 0 ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button disabled={busyFinal} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {busyFinal ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                    {busyFinal ? 'Generating…' : 'Continue with Pending Questions'}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Continue with pending AI questions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Some AI-suggested investigation questions are unanswered. These will not be used as facts or conclusions. They will be treated only as pending investigation gaps. Pending questions stay pending — they are not auto-marked as answered or accepted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Go Back and Answer</AlertDialogCancel>
                    <AlertDialogAction onClick={runGenerateFinal}>Continue Anyway</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <button onClick={runGenerateFinal} disabled={busyFinal} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {busyFinal ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                {busyFinal ? 'Generating…' : 'Generate Final Report'}
              </button>
            )
          ) : (
            <ConfirmButton
              disabled={busyFinal || !isStale}
              onConfirm={runGenerateFinal}
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
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={!!inv.includePendingGapsInReport}
              onChange={e => setInv(patchInvestigation(inv, { includePendingGapsInReport: e.target.checked }))}
              className="h-3.5 w-3.5 accent-primary"
            />
            Include pending investigation gaps in appendix.
          </label>
          {pendingUnanswered > 0 && (
            <p className="rounded bg-amber-500/10 px-2 py-1 text-[11px] text-amber-500">
              {pendingUnanswered} unanswered question{pendingUnanswered === 1 ? '' : 's'} — these stay pending and are not used as facts or conclusions.
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

      {actionBar}
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
