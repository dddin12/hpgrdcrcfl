import type { Investigation, RcfaReport } from '@/types/investigation';

export function buildFallbackReport(inv: Investigation): RcfaReport {
  const causes = inv.contributingCauses ?? [];
  return {
    incidentSummary: `${inv.severity?.toUpperCase()} severity incident involving ${inv.equipment} at ${inv.labName}. ${inv.description}`,
    chronology: [
      { time: inv.dateTime, event: 'Incident occurred' },
      { event: inv.immediateResponse || 'Immediate response initiated' },
    ],
    immediateCause: inv.immeditateCause || 'Not determined — awaiting investigator input.',
    fiveWhys: [
      { why: 'Why did the incident occur?', because: inv.immeditateCause || 'Pending determination.' },
      { why: 'Why was that condition present?', because: causes[0] || 'Pending determination.' },
      { why: 'Why was that not prevented?', because: causes[1] || 'Pending determination.' },
      { why: 'Why was the control inadequate?', because: causes[2] || 'Pending determination.' },
      { why: 'Why did the system allow this?', because: inv.rootCause || 'Pending determination.' },
    ],
    fishbone: {
      man: ['Operator action under review'],
      machine: [inv.equipment],
      method: ['Procedure adherence under review'],
      material: ['Materials/consumables under review'],
      measurement: ['Instrumentation/monitoring under review'],
      environment: ['Lab environmental conditions under review'],
    },
    keyFactors: {
      human: ['Pending investigator input'],
      system: ['Pending investigator input'],
      physical: ['Pending investigator input'],
      organizational: ['Pending investigator input'],
    },
    barriers: {
      existing: ['Standard lab SOPs', 'PPE requirements'],
      failed: ['Pending barrier analysis'],
      missing: ['Pending barrier analysis'],
    },
    riskAssessment: {
      severity: inv.severity ?? 'unknown',
      likelihood: 'To be assessed',
      escalation: 'To be assessed',
    },
    correctiveActions: (inv.correctiveActions ?? []).map(a => ({
      description: a.description, priority: a.priority, owner: a.assignee, dueWindow: a.dueDate,
    })),
    procedureGaps: [],
    references: [],
    preventiveActions: [{ description: 'Define preventive actions after root cause is confirmed.' }],
    lessonsLearned: ['Complete AI-assisted analysis or manual review to populate lessons learned.'],
    assumptions: ['AI generation unavailable — this is a deterministic template draft.'],
    generatedBy: 'template',
  };
}