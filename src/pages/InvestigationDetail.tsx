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
import hpLogo from '@/assets/hp-logo.png';
import rndLogo from '@/assets/rnd-logo.png';

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
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const investigation = mockInvestigations.find(inv => inv.id === id) || mockInvestigations[0];

  const handleExport = async () => {
    setIsGenerating(true);
    await generateInvestigationReport(investigation);
    setTimeout(() => setIsGenerating(false), 1000);
  };

  const handleAiAnalysis = () => {
    setIsAnalyzing(true);
    setAiInsight(null);
    // Simulate AI analysis
    setTimeout(() => {
      setAiInsight(
        `Based on the incident data and referenced SOPs, this ${investigation.severity}-severity incident involving ${investigation.equipment} shows a pattern consistent with deferred maintenance. ` +
        `Key finding: The root cause traces back to gaps in CMMS configuration (SOP-MAINT-005 §4.2). ` +
        `Risk score of ${investigation.riskScore}/25 places this in the HIGH risk quadrant. ` +
        `Recommended priority: Implement automated PM alerts within 48 hours and conduct immediate seal inspection across all similar equipment.`
      );
      setIsAnalyzing(false);
    }, 2500);
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
            {isGenerating ? 'Generating...' : 'Export Report'}
          </motion.button>
        </div>
      </motion.div>

      {/* Company branding bar */}
      <motion.div variants={item} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2">
        <img src={hpLogo} alt="HP" className="h-8 w-auto" />
        <div className="h-6 w-px bg-border" />
        <img src={rndLogo} alt="R&D" className="h-8 w-auto" />
        <div className="ml-auto text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Confidential Investigation</div>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Operator', value: investigation.operator },
          { label: 'Date & Time', value: new Date(investigation.dateTime).toLocaleString() },
          { label: 'Risk Score', value: `${investigation.riskScore ?? '—'} / 25`, highlight: true },
        ].map((field, i) => (
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

      {/* AI Analysis Button */}
      <motion.div variants={item}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAiAnalysis}
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
              <p className="text-sm font-semibold">{isAnalyzing ? 'AI is analyzing incident data and referenced SOPs...' : 'Run AI-Powered Analysis'}</p>
              <p className="text-xs text-muted-foreground">Generate intelligent insights based on incident data and uploaded documents</p>
            </div>
          </div>
        </motion.button>

        <AnimatePresence>
          {aiInsight && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-4"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">AI Analysis Summary</p>
                  <p className="mt-2 text-sm leading-relaxed">{aiInsight}</p>
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
