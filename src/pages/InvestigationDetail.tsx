import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, GitBranch, BarChart3, Shield, FileDown, Lightbulb, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { mockInvestigations } from '@/data/mockData';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import FiveWhysPanel from '@/components/analysis/FiveWhysPanel';
import FishbonePanel from '@/components/analysis/FishbonePanel';
import CauseTreePanel from '@/components/analysis/CauseTreePanel';
import RiskAssessmentPanel from '@/components/analysis/RiskAssessmentPanel';
import CorrectiveActionsPanel from '@/components/analysis/CorrectiveActionsPanel';
import { generateInvestigationReport } from '@/utils/generateReport';
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

function buildAnalysisSummary(investigation: typeof mockInvestigations[0]): string {
  const parts: string[] = [];
  parts.push(`Incident involving ${investigation.equipment} in ${investigation.labName} — classified as ${investigation.severity.toUpperCase()} severity.`);
  
  if (investigation.immeditateCause) {
    parts.push(`Immediate cause identified: ${investigation.immeditateCause}.`);
  }
  if (investigation.contributingCauses?.length) {
    parts.push(`Contributing factors: ${investigation.contributingCauses.join('; ')}.`);
  }
  if (investigation.rootCause) {
    parts.push(`Root cause: ${investigation.rootCause}.`);
  }
  if (investigation.riskScore) {
    const riskLevel = investigation.riskScore >= 15 ? 'HIGH' : investigation.riskScore >= 8 ? 'MEDIUM' : 'LOW';
    parts.push(`Risk score: ${investigation.riskScore}/25 (${riskLevel} risk quadrant).`);
  }
  if (!investigation.rootCause) {
    parts.push('Root cause analysis is still pending — complete the 5 Whys and Fishbone analysis tabs to identify the root cause.');
  }
  return parts.join(' ');
}

export default function InvestigationDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('five-whys');
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const investigation = mockInvestigations.find(inv => inv.id === id) || mockInvestigations[0];

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      await generateInvestigationReport(investigation);
      toast.success('Report downloaded — open the HTML file and print to PDF');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  const handleGenerateSummary = () => {
    setIsAnalyzing(true);
    setAnalysisSummary(null);
    // Brief delay for UX feedback, then build from real data
    setTimeout(() => {
      setAnalysisSummary(buildAnalysisSummary(investigation));
      setIsAnalyzing(false);
    }, 800);
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
            disabled={isGenerating}
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

      {/* Generate Analysis Summary */}
      <motion.div variants={item}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerateSummary}
          disabled={isAnalyzing}
          className="w-full rounded-lg border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            {isAnalyzing ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="text-sm font-semibold">{isAnalyzing ? 'Generating summary...' : 'Generate Analysis Summary'}</p>
              <p className="text-xs text-muted-foreground">Build a structured summary from the investigation data and analysis</p>
            </div>
          </div>
        </motion.button>

        <AnimatePresence>
          {analysisSummary && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-4"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Analysis Summary</p>
                  <p className="mt-2 text-sm leading-relaxed">{analysisSummary}</p>
                </div>
              </div>
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
            {activeTab === 'five-whys' && <FiveWhysPanel investigation={investigation} />}
            {activeTab === 'fishbone' && <FishbonePanel investigation={investigation} />}
            {activeTab === 'cause-tree' && <CauseTreePanel investigation={investigation} />}
            {activeTab === 'risk' && <RiskAssessmentPanel investigation={investigation} />}
            {activeTab === 'actions' && <CorrectiveActionsPanel investigation={investigation} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
