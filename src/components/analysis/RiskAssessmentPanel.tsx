import type { Investigation, RcfaReport } from '@/types/investigation';

interface Props {
  investigation: Investigation;
  report?: RcfaReport | null;
}

const severityLabels = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
const likelihoodLabels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];

function cellColor(s: number, l: number) {
  const score = s * l;
  if (score >= 15) return 'bg-critical/80 text-critical-foreground';
  if (score >= 10) return 'bg-warning/60 text-warning-foreground';
  if (score >= 5)  return 'bg-info/40 text-foreground';
  return 'bg-success/30 text-foreground';
}

function severityIndex(sev?: string): number {
  const v = (sev || '').toLowerCase();
  if (v.includes('catastroph') || v.includes('critical')) return 5;
  if (v.includes('major') || v.includes('high')) return 4;
  if (v.includes('moderate') || v.includes('medium')) return 3;
  if (v.includes('minor') || v.includes('low')) return 2;
  if (v.includes('negligib')) return 1;
  return 0;
}

function likelihoodIndex(l?: string): number {
  const v = (l || '').toLowerCase();
  if (v.includes('almost') || v.includes('certain')) return 5;
  if (v.includes('likely')) return 4;
  if (v.includes('possible')) return 3;
  if (v.includes('unlikely')) return 2;
  if (v.includes('rare')) return 1;
  return 0;
}

function riskBand(score: number) {
  if (score >= 15) return { label: 'HIGH — Immediate Action Required', color: 'text-critical', note: 'Corrective actions must be implemented within 48 hours.' };
  if (score >= 10) return { label: 'ELEVATED — Action Required', color: 'text-warning', note: 'Plan and implement corrective actions within 2 weeks.' };
  if (score >= 5)  return { label: 'MODERATE — Monitor', color: 'text-info', note: 'Track and re-assess at next periodic review.' };
  return { label: 'LOW — Acceptable', color: 'text-success', note: 'Maintain existing controls and continue monitoring.' };
}

export default function RiskAssessmentPanel({ investigation, report }: Props) {
  // Derive S × L from the AI report when available; otherwise fall back to investigation severity.
  const sevFromReport = severityIndex(report?.riskAssessment?.severity);
  const likFromReport = likelihoodIndex(report?.riskAssessment?.likelihood);
  const sevFromInv = severityIndex(investigation.severity);
  const currentSeverity = sevFromReport || sevFromInv || 3;
  const currentLikelihood = likFromReport || 3;
  const score = currentSeverity * currentLikelihood;
  const band = riskBand(score);

  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">
        5×5 Risk Matrix — Severity vs Likelihood {report ? '(positioned from AI risk assessment)' : '(positioned from incident severity; generate the RCFA report to refine likelihood)'}.
      </p>

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
                      <div className={`rounded-md p-2.5 font-bold ${cellColor(s, lv)} ${isActive ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''}`}>
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
          <p className={`mt-1 text-3xl font-bold ${band.color}`}>{score}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Severity: {currentSeverity} ({severityLabels[currentSeverity - 1]}) × Likelihood: {currentLikelihood} ({likelihoodLabels[currentLikelihood - 1]})
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</p>
          <p className={`mt-1 text-lg font-bold ${band.color}`}>{band.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{band.note}</p>
        </div>
      </div>

      {report?.riskAssessment?.escalation && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Escalation Potential</p>
          <p className="mt-1 text-sm">{report.riskAssessment.escalation}</p>
        </div>
      )}
    </div>
  );
}