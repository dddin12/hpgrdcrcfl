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
