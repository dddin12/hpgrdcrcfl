import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, GitBranch, BarChart3, Shield, FileDown, Lightbulb, ChevronRight, Sparkles, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { getInvestigation } from '@/data/investigationStore';
import { mockInvestigations } from '@/data/mockData';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import FiveWhysPanel from '@/components/analysis/FiveWhysPanel';
import FishbonePanel from '@/components/analysis/FishbonePanel';
import CauseTreePanel from '@/components/analysis/CauseTreePanel';
import RiskAssessmentPanel from '@/components/analysis/RiskAssessmentPanel';
import CorrectiveActionsPanel from '@/components/analysis/CorrectiveActionsPanel';
import { generateInvestigationReport } from '@/utils/generateReport';
import { buildFallbackReport } from '@/utils/fallbackReport';
import RcfaReportView from '@/components/analysis/RcfaReportView';
import { supabase } from '@/integrations/supabase/client';
import type { RcfaReport } from '@/types/investigation';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const tabs = [
  { id: 'five-whys', label: '5 Whys', icon: FileSearch },
  { id: 'fishbone', label: 'Fishbone', icon: GitBranch },
  { id: 'cause-tree', label: 'Cause Tree', icon: BarChart3 },
  { id: 'risk', label: 'Risk Assessment', icon: Shield },
  { id: 'actions', label: 'Corrective Actions', icon: Lightbulb },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function InvestigationDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('five-whys');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<RcfaReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const investigation = getInvestigation(id) || mockInvestigations[0];

  const handleExport = async () => {
    if (!report) {
      toast.error('Generate the RCFA report first');
      return;
    }
    setIsGenerating(true);
    try {
      await generateInvestigationReport(investigation, report);
      toast.success('Report downloaded — open the HTML file and print to PDF');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  const runGenerate = async () => {
    setIsAnalyzing(true);
    try {
      const sopExcerpts = (investigation as any).sopExcerpts ?? [];
      const { data, error } = await supabase.functions.invoke('generate-rcfa', {
        body: { investigation, sopExcerpts },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.report) throw new Error('Empty response from AI');
      setReport(data.report as RcfaReport);
      toast.success('RCFA report generated');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'AI generation failed';
      toast.error(`${msg} — using template fallback`);
      setReport(buildFallbackReport(investigation));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Investigations</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-mono text-foreground">{investigation.id}</span>
          </div>
          <h1 className="mt-1 text-xl font-bold">{investigation.equipment}</h1>
          <p className="text-sm text-muted-foreground">{investigation.labName}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={investigation.status} />
          <SeverityBadge severity={investigation.severity} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            disabled={isGenerating || !report}
            title={!report ? 'Generate the RCFA report first' : 'Download cached report'}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {isGenerating ? 'Generating...' : 'Download Report'}
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Operator', value: investigation.operator },
          { label: 'Date & Time', value: new Date(investigation.dateTime).toLocaleString() },
          { label: 'Risk Score', value: `${investigation.riskScore ?? '—'} / 25`, highlight: true },
        ].map((field) => (
          <motion.div
            key={field.label}
            whileHover={{ scale: 1.02, y: -2 }}
            className="glass-card p-4 transition-shadow hover:shadow-lg"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</p>
            <p className={`mt-1 text-sm font-${field.highlight ? 'bold text-critical' : 'medium'}`}>{field.value}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} className="glass-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Incident Description</p>
        <p className="mt-2 text-sm leading-relaxed">{investigation.description}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Immediate Response</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{investigation.immediateResponse}</p>
      </motion.div>

      {/* Generate RCFA Report */}
      <motion.div variants={item} className="glass-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">AI-Assisted RCFA Report</p>
              <p className="text-xs text-muted-foreground">11-section audit-ready analysis. AI is triggered only when you click Generate.</p>
            </div>
          </div>
          {!report ? (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={runGenerate} disabled={isAnalyzing}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isAnalyzing ? 'Generating...' : 'Generate RCFA Report'}
            </motion.button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button disabled={isAnalyzing} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-60">
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Regenerate
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Regenerate RCFA report?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will trigger another AI call and replace the cached report. Use only if the current report is unsatisfactory.
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

        <AnimatePresence>
          {report && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
              {report.generatedBy === 'template' && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>AI generation unavailable; draft report generated using structured template.</span>
                </div>
              )}
              <RcfaReportView report={report} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Analysis Tabs */}
      <motion.div variants={item} className="glass-card overflow-hidden">
        <div className="flex overflow-x-auto border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {activeTab === 'five-whys' && <FiveWhysPanel investigation={investigation} report={report} />}
            {activeTab === 'fishbone' && <FishbonePanel investigation={investigation} report={report} />}
            {activeTab === 'cause-tree' && <CauseTreePanel investigation={investigation} report={report} />}
            {activeTab === 'risk' && <RiskAssessmentPanel investigation={investigation} report={report} />}
            {activeTab === 'actions' && <CorrectiveActionsPanel investigation={investigation} report={report} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
