import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, GitBranch, BarChart3, Shield, FileDown, Lightbulb, ChevronRight } from 'lucide-react';
import { mockInvestigations } from '@/data/mockData';
import { StatusBadge, SeverityBadge } from '@/components/StatusBadge';
import FiveWhysPanel from '@/components/analysis/FiveWhysPanel';
import FishbonePanel from '@/components/analysis/FishbonePanel';
import CauseTreePanel from '@/components/analysis/CauseTreePanel';
import RiskAssessmentPanel from '@/components/analysis/RiskAssessmentPanel';
import CorrectiveActionsPanel from '@/components/analysis/CorrectiveActionsPanel';

const tabs = [
  { id: 'five-whys', label: '5 Whys', icon: FileSearch },
  { id: 'fishbone', label: 'Fishbone', icon: GitBranch },
  { id: 'cause-tree', label: 'Cause Tree', icon: BarChart3 },
  { id: 'risk', label: 'Risk Assessment', icon: Shield },
  { id: 'actions', label: 'Corrective Actions', icon: Lightbulb },
];

export default function InvestigationDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('five-whys');
  const investigation = mockInvestigations.find(inv => inv.id === id) || mockInvestigations[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <button className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-accent">
            <FileDown className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operator</p>
          <p className="mt-1 text-sm font-medium">{investigation.operator}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date & Time</p>
          <p className="mt-1 text-sm font-medium">{new Date(investigation.dateTime).toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</p>
          <p className="mt-1 text-sm font-bold text-critical">{investigation.riskScore ?? '—'} / 25</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Incident Description</p>
        <p className="mt-2 text-sm leading-relaxed">{investigation.description}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Immediate Response</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{investigation.immediateResponse}</p>
      </div>

      {/* Analysis Tabs */}
      <div className="glass-card overflow-hidden">
        <div className="flex overflow-x-auto border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
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
      </div>
    </div>
  );
}
