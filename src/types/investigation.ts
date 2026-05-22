export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'in-progress' | 'review' | 'closed';
export type IncidentType = 'chemical-spill' | 'equipment-failure' | 'fire' | 'electrical' | 'biological' | 'radiation' | 'ergonomic' | 'other';

export interface Investigation {
  id: string;
  labName: string;
  equipment: string;
  incidentType: IncidentType;
  description: string;
  operator: string;
  dateTime: string;
  immediateResponse: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: string;
  riskScore?: number;
  rootCause?: string;
  immeditateCause?: string;
  contributingCauses?: string[];
  correctiveActions?: CorrectiveAction[];
  fiveWhys?: FiveWhyStep[];
  fishboneCategories?: FishboneCategory[];
}

export interface FiveWhyStep {
  question: string;
  answer: string;
  level: number;
}

export interface FishboneCategory {
  name: string;
  causes: string[];
}

export interface CorrectiveAction {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  status: 'pending' | 'in-progress' | 'completed';
  sopReference?: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: 'sop' | 'equipment-manual' | 'safety-manual' | 'maintenance';
  uploadedAt: string;
  size: string;
}

export interface SopExcerpt {
  name: string;
  text: string;
}

export interface RcfaActionItem {
  description: string;
  priority?: 'low' | 'medium' | 'high';
  owner?: string;
  dueWindow?: string;
}

export interface RcfaReport {
  incidentSummary: string;
  chronology: { time?: string; event: string }[];
  immediateCause: string;
  fiveWhys: { why: string; because: string }[];
  fishbone: {
    man: string[];
    machine: string[];
    method: string[];
    material: string[];
    measurement: string[];
    environment: string[];
  };
  keyFactors: {
    human: string[];
    system: string[];
    physical: string[];
    organizational: string[];
  };
  barriers: {
    existing: string[];
    failed: string[];
    missing: string[];
  };
  riskAssessment: {
    severity: string;
    likelihood: string;
    escalation: string;
  };
  correctiveActions: RcfaActionItem[];
  preventiveActions: RcfaActionItem[];
  lessonsLearned: string[];
  assumptions?: string[];
  generatedBy: 'ai' | 'template';
}
