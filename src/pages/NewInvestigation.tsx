import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Upload, ArrowRight, Sparkles, X, FileText } from 'lucide-react';
import { IncidentType, IncidentSeverity } from '@/types/investigation';
import { toast } from 'sonner';

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

const fieldClass = "w-full rounded-md border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200";
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function NewInvestigation() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
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

  const addFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files);
    const oversized = newFiles.filter(f => f.size > 20 * 1024 * 1024);
    const valid = newFiles.filter(f => f.size <= 20 * 1024 * 1024);
    if (oversized.length) toast.error(`${oversized.length} file(s) exceed 20 MB limit`);
    if (valid.length) {
      setAttachments(prev => [...prev, ...valid]);
      toast.success(`${valid.length} file(s) attached`);
    }
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Investigation created successfully');
    navigate('/investigation/INV-2026-001');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <AlertTriangle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">New Incident Investigation</h1>
          <p className="text-sm text-muted-foreground">Enter incident details to begin root cause analysis</p>
        </div>
      </motion.div>

      <motion.form
        variants={container}
        initial="hidden"
        animate="show"
        onSubmit={handleSubmit}
        className="glass-card divide-y divide-border"
      >
        <motion.div variants={item} className="grid gap-5 p-6 md:grid-cols-2">
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
        </motion.div>

        <motion.div variants={item} className="space-y-5 p-6">
          <div>
            <label className={labelClass}>Incident Description</label>
            <textarea className={fieldClass + ' min-h-[100px] resize-y'} placeholder="Describe what happened, including timeline of events..." value={formData.description} onChange={e => update('description', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Immediate Response Taken</label>
            <textarea className={fieldClass + ' min-h-[80px] resize-y'} placeholder="What actions were taken immediately after the incident?" value={formData.immediateResponse} onChange={e => update('immediateResponse', e.target.value)} />
          </div>
        </motion.div>

        <motion.div variants={item} className="p-6">
          <label className={labelClass}>Attachments</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.csv,.xlsx"
            className="hidden"
            onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
          />
          <motion.div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            whileHover={{ borderColor: 'hsl(38 92% 55% / 0.5)' }}
            className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/50'
            }`}
          >
            <div className="text-center">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              </motion.div>
              <p className="mt-2 text-sm text-muted-foreground">Drop files here or click to upload</p>
              <p className="text-xs text-muted-foreground">Photos, logs, data files (max 20MB each)</p>
            </div>
          </motion.div>

          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2">
                {attachments.map((file, i) => (
                  <motion.div
                    key={file.name + i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3 rounded-md border border-border bg-muted/50 px-3 py-2"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="flex-1 truncate text-sm text-foreground">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                    <button type="button" onClick={() => removeFile(i)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={item} className="flex items-center justify-end gap-3 p-6">
          <button type="button" onClick={() => navigate('/')} className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            Begin Analysis
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.div>
      </motion.form>
    </div>
  );
}
