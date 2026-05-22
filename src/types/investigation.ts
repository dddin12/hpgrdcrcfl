export type Classification = 'FATAL' | 'LWC' | 'RWC' | 'MTC' | 'FAC' | 'NM' | 'PFE';

export const CLASSIFICATIONS: Classification[] = ['FATAL', 'LWC', 'RWC', 'MTC', 'FAC', 'NM', 'PFE'];

export interface SopExcerpt {
  name: string;
  pages: { page: number | string; text: string }[];
}

export interface Photograph {
  name: string;
  dataUrl: string;
  caption?: string;
}

export interface HpgrdcInvestigation {
  id: string;
  createdAt: string;

  // Section A — Header
  incidentTitle: string;
  classification: Classification | '';
  numbers: string;
  injured: { company: number; contractor: number; visitors: number };
  injuredName: string;
  ageSex: string;
  ticketDept: string;
  companyContractor: string;
  natureOfInjury: string;
  reportedBy: string;

  // Section B — Incident Information
  location: string;
  incidentNumber: string;
  dateOfIncident: string;
  timeOfIncident: string;
  investigationInitiated: string;
  reportSubmission: string;

  // Section C — Investigation Information
  recordsReviewed: string[];
  personsInteracted: string[];
  priorSimilar: { occurred: boolean; notes: string };

  // Section D — Narrative
  summary: string;
  chronology: { time?: string; event: string }[];
  facts: string[];

  // Section E — Attachments
  sopExcerpts?: SopExcerpt[];
  photographs?: Photograph[];

  // AI cache
  aiReport?: HpgrdcAiReport;
  aiInputHash?: string;
  aiHistory?: HpgrdcAiReport[];

  // For dashboard convenience
  preparedBy?: string;
  approvedBy?: string;
}

export interface HpgrdcAiReport {
  whyTree: {
    effect: string;
    cause: { primary: string; secondary?: string };
    why: string[];
    deeper: string[];
    rootWeakness: string[];
  };
  keyFactors: {
    system: string[];
    human: string[];
    physical: string[];
  };
  systemsToReinforce: { system: string; deficiency: string }[];
  recommendations: {
    recommendation: string;
    responsibility: string;
    targetDate: string;
    verifiedBy: string;
  }[];
  generatedAt: string;
  inputHash: string;
  model: 'flash' | 'pro';
}

export const SYSTEMS_TO_REINFORCE: string[] = [
  'Communication and Training',
  'Management of Change',
  'Incident Investigation/Communication',
  'Observations and Audits',
  'Planning & Emergency Response',
  'Contractors Management',
  'Quality Assurance',
  'Mechanical Integrity',
  'Pre-Start Up Safety Inspection',
  'Process Technology',
  'Risk Analysis',
  'Safe Work Practices, SOP, SMP',
  'Safety Leadership',
];
