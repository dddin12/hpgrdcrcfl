import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Upload, ArrowRight } from 'lucide-react';
import { IncidentType, IncidentSeverity } from '@/types/investigation';

const incidentTypes: { value: IncidentType; label: string }[] = [
  { value: 'chemical-spill', label: 'Chemical Spill' },
  { value: 'equipment-failure', label: 'Equipment Failure' },
  { value: 'fire', label: 'Fire / Thermal Event' },
  { value: 'electrical', label: 'Electrical Incident' },
  { value: 'biological', label: 'Biological Hazard' },
  { value: 'radiation', label: 'Radiation Exposure' },
  { value: 'ergonomic', label: 'Ergonomic Injury' },
  { value: 'other', label: 'Other' },
];

const fieldClass = "w-full rounded-md border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

export default function NewInvestigation() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    labName: '',
    equipment: '',
    incidentType: '' as IncidentType,
    severity: '' as IncidentSeverity,
    description: '',
    operator: '',
    dateTime: '',
    immediateResponse: '',
  });

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/investigation/INV-2026-001');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <AlertTriangle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">New Incident Investigation</h1>
          <p className="text-sm text-muted-foreground">Enter incident details to begin AI-guided root cause analysis</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass-card divide-y divide-border"
      >
        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <label className={labelClass}>Lab Name</label>
            <input className={fieldClass} placeholder="e.g. Analytical Chemistry Lab B" value={formData.labName} onChange={e => update('labName', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Equipment Involved</label>
            <input className={fieldClass} placeholder="e.g. HPLC System — Agilent 1260" value={formData.equipment} onChange={e => update('equipment', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Incident Type</label>
            <select className={fieldClass} value={formData.incidentType} onChange={e => update('incidentType', e.target.value)} required>
              <option value="">Select type...</option>
              {incidentTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Severity</label>
            <select className={fieldClass} value={formData.severity} onChange={e => update('severity', e.target.value)} required>
              <option value="">Select severity...</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Operator / Reporter</label>
            <input className={fieldClass} placeholder="Full name" value={formData.operator} onChange={e => update('operator', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Date & Time of Incident</label>
            <input type="datetime-local" className={fieldClass} value={formData.dateTime} onChange={e => update('dateTime', e.target.value)} required />
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className={labelClass}>Incident Description</label>
            <textarea className={fieldClass + ' min-h-[100px] resize-y'} placeholder="Describe what happened, including timeline of events..." value={formData.description} onChange={e => update('description', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Immediate Response Taken</label>
            <textarea className={fieldClass + ' min-h-[80px] resize-y'} placeholder="What actions were taken immediately after the incident?" value={formData.immediateResponse} onChange={e => update('immediateResponse', e.target.value)} />
          </div>
        </div>

        <div className="p-6">
          <label className={labelClass}>Attachments</label>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 transition-colors hover:border-primary/50">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Drop files here or click to upload</p>
              <p className="text-xs text-muted-foreground">Photos, logs, data files (max 20MB each)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6">
          <button type="button" onClick={() => navigate('/')} className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Begin AI Analysis
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.form>
    </div>
  );
}
