import { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Sparkles, Loader2, RefreshCw, ChevronRight, Pencil } from 'lucide-react';
import { getInvestigation, computeInputHash, storeAiReport, updateAiReport } from '@/data/investigationStore';
import { generateInvestigationReport } from '@/utils/generateReport';
import HpgrdcReportView from '@/components/analysis/HpgrdcReportView';
import EditAiAnalysisDialog from '@/components/analysis/EditAiAnalysisDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { HpgrdcInvestigation, HpgrdcAiReport } from '@/types/investigation';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function InvestigationDetail() {
  const { id } = useParams();
  const [inv, setInv] = useState<HpgrdcInvestigation | undefined>(() => getInvestigation(id));
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentHash, setCurrentHash] = useState<string>('');
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (inv) computeInputHash(inv).then(setCurrentHash);
  }, [inv]);

  const isStale = useMemo(() => !!inv?.aiReport && currentHash && inv.aiInputHash !== currentHash, [inv, currentHash]);

  if (!inv) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-lg font-semibold">Investigation not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">Cleared from local storage or never created.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">← Back to dashboard</Link>
      </div>
    );
  }

  const runGenerate = async () => {
    setBusy(true);
    try {
      const hash = await computeInputHash(inv);
      const { data, error } = await supabase.functions.invoke('generate-rcfa', {
        body: { investigation: inv, sopExcerpts: inv.sopExcerpts || [], deepReview: false },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.report) throw new Error('Empty response');
      const report: HpgrdcAiReport = {
        ...data.report,
        inputHash: hash,
        generatedAt: new Date().toISOString(),
        model: data.report.model || 'flash',
      };
      const next = storeAiReport(inv, report);
      setInv(next);
      setCurrentHash(hash);
      toast.success('Investigation analysis generated');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'AI generation failed');
    } finally {
      setBusy(false);
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
          {inv.classification && <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{inv.classification}</span>}
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

      {/* Generate panel */}
      <div className="glass-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">AI Investigation Analysis</p>
              <p className="text-xs text-muted-foreground">
                Generates WHY Tree, Key Factors, Systems to Reinforce, and Recommendations. AI runs only on click. Cached until inputs change.
              </p>
              {inv.aiReport && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Last generated {new Date(inv.aiReport.generatedAt).toLocaleString()} • model: {inv.aiReport.model}
                  {isStale && <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 font-semibold text-amber-500">Inputs changed — regenerate</span>}
                </p>
              )}
            </div>
          </div>
          {!inv.aiReport ? (
            <button onClick={runGenerate} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
              {busy ? 'Generating...' : 'Generate Report'}
            </button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}
                  Regenerate
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Regenerate analysis?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Triggers another AI call and replaces the cached analysis. The previous version is kept in history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={runGenerate}>Yes, regenerate</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <AnimatePresence>
        {inv.aiReport && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
            <HpgrdcReportView inv={inv} report={inv.aiReport} />
          </motion.div>
        )}
        {!inv.aiReport && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="glass-card p-8 text-center">
            <p className="text-sm font-semibold">Investigation saved</p>
            <p className="mt-1 text-xs text-muted-foreground">Click <b>Generate Report</b> above to produce the WHY Tree, Key Factors, Systems to Reinforce, and Recommendations.</p>
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
