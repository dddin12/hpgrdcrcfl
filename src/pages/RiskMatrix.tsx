import RiskAssessmentPanel from '@/components/analysis/RiskAssessmentPanel';
import { mockInvestigations } from '@/data/mockData';

export default function RiskMatrix() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Risk Matrix</h1>
        <p className="text-sm text-muted-foreground">Organization-wide risk assessment overview</p>
      </div>
      <div className="glass-card p-6">
        <RiskAssessmentPanel investigation={mockInvestigations[0]} />
      </div>
    </div>
  );
}
