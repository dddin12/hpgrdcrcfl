import { motion } from 'framer-motion';
import RiskAssessmentPanel from '@/components/analysis/RiskAssessmentPanel';
import { mockInvestigations } from '@/data/mockData';

export default function RiskMatrix() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Risk Matrix</h1>
        <p className="text-sm text-muted-foreground">Organization-wide risk assessment overview</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <RiskAssessmentPanel investigation={mockInvestigations[0]} report={null} />
      </motion.div>
    </div>
  );
}
