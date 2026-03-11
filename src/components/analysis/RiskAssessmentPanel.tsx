import { Investigation } from '@/types/investigation';

interface Props {
  investigation: Investigation;
}

const severityLabels = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
const likelihoodLabels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];

function getCellColor(s: number, l: number): string {
  const score = s * l;
  if (score >= 15) return 'bg-critical/80 text-critical-foreground';
  if (score >= 10) return 'bg-warning/60 text-warning-foreground';
  if (score >= 5) return 'bg-info/40 text-foreground';
  return 'bg-success/30 text-foreground';
}

export default function RiskAssessmentPanel({ investigation }: Props) {
  const currentSeverity = 4;
  const currentLikelihood = 4;

  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">5×5 Risk Matrix — Severity vs Likelihood assessment</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="w-28 p-2 text-left text-muted-foreground">Likelihood ↓ / Severity →</th>
              {severityLabels.map((s, i) => (
                <th key={s} className="p-2 font-medium text-muted-foreground">{i + 1}. {s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {likelihoodLabels.map((l, li) => (
              <tr key={l}>
                <td className="p-2 text-left font-medium text-muted-foreground">{li + 1}. {l}</td>
                {severityLabels.map((_, si) => {
                  const s = si + 1;
                  const lv = li + 1;
                  const isActive = s === currentSeverity && lv === currentLikelihood;
                  return (
                    <td key={si} className="p-1">
                      <div className={`rounded-md p-2.5 font-bold ${getCellColor(s, lv)} ${isActive ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''}`}>
                        {s * lv}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Risk Score</p>
          <p className="mt-1 text-3xl font-bold text-critical">{currentSeverity * currentLikelihood}</p>
          <p className="mt-1 text-xs text-muted-foreground">Severity: {currentSeverity} (Major) × Likelihood: {currentLikelihood} (Likely)</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</p>
          <p className="mt-1 text-lg font-bold text-critical">HIGH — Immediate Action Required</p>
          <p className="mt-1 text-xs text-muted-foreground">Corrective actions must be implemented within 48 hours</p>
        </div>
      </div>
    </div>
  );
}
