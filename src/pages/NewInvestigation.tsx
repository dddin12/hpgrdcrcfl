import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Upload, ArrowRight, X, FileText, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseSopFiles } from '@/utils/parseSop';
import { saveInvestigation, newInvestigationId } from '@/data/investigationStore';
import { CLASSIFICATIONS } from '@/types/investigation';
import type { HpgrdcInvestigation, Classification, Photograph } from '@/types/investigation';
import { findInvalidRows } from '@/utils/validation';

const fieldClass = "w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition";
const labelClass = "block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1";
const sectionTitle = "text-xs font-bold uppercase tracking-[0.2em] text-primary border-b border-border pb-2 mb-4";
const helpClass = "mt-1 text-[10px] italic text-muted-foreground";

function fmtSize(b: number) { return b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB'; }

function readImage(file: File): Promise<Photograph> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ name: file.name, dataUrl: String(r.result) });
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function NewInvestigation() {
  const navigate = useNavigate();
  const docRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<File[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);

  const [d, setD] = useState({
    incidentTitle: '',
    classification: '' as Classification | '',
    numbers: '',
    company: 0, contractor: 0, visitors: 0,
    injuredName: '', ageSex: '', ticketDept: '', companyContractor: '',
    natureOfInjury: '', reportedBy: '',
    location: '', incidentNumber: '',
    dateOfIncident: '', timeOfIncident: '',
    investigationInitiated: '', reportSubmission: '',
    priorOccurred: false, priorNotes: '',
    summary: '',
  });

  const [records, setRecords] = useState<string[]>(['']);
  const [persons, setPersons] = useState<string[]>(['']);
  const [chronology, setChronology] = useState<{time: string; event: string}[]>([{time:'', event:''}]);
  const [facts, setFacts] = useState<string[]>(['']);

  const upd = (k: keyof typeof d, v: any) => setD(p => ({...p, [k]: v}));

  const addDocs = (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.size <= 20*1024*1024);
    setDocs(p => [...p, ...arr]);
  };
  const addPhotos = (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= 5*1024*1024);
    if (arr.length < Array.from(files).length) toast.error('Some photos skipped (must be images, max 5 MB each)');
    setPhotos(p => [...p, ...arr]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.incidentTitle || !d.classification || !d.location || !d.dateOfIncident || !d.summary) {
      toast.error('Fill incident title, classification, location, date, and summary');
      return;
    }
    const invalid = findInvalidRows({
      chronology, facts,
      recordsReviewed: records, personsInteracted: persons,
    });
    if (invalid.length) {
      toast.error(
        `Please fix ${invalid.length} invalid row(s): ` +
        invalid.slice(0, 3).map(r => `${r.section} #${r.index} ("${r.text.slice(0, 20)}")`).join(', ') +
        (invalid.length > 3 ? '…' : '')
      );
      return;
    }
    const id = newInvestigationId();
    const t = toast.loading('Saving investigation...');
    let sopExcerpts: any[] = [];
    let photographs: Photograph[] = [];
    try {
      if (docs.length) sopExcerpts = await parseSopFiles(docs);
      if (photos.length) photographs = await Promise.all(photos.map(readImage));
    } catch (e) {
      console.warn(e);
    }
    const inv: HpgrdcInvestigation = {
      id, createdAt: new Date().toISOString(),
      incidentTitle: d.incidentTitle, classification: d.classification, numbers: d.numbers,
      injured: { company: +d.company || 0, contractor: +d.contractor || 0, visitors: +d.visitors || 0 },
      injuredName: d.injuredName, ageSex: d.ageSex, ticketDept: d.ticketDept,
      companyContractor: d.companyContractor, natureOfInjury: d.natureOfInjury, reportedBy: d.reportedBy,
      location: d.location, incidentNumber: d.incidentNumber,
      dateOfIncident: d.dateOfIncident, timeOfIncident: d.timeOfIncident,
      investigationInitiated: d.investigationInitiated, reportSubmission: d.reportSubmission,
      recordsReviewed: records.map(r => r.trim()).filter(Boolean),
      personsInteracted: persons.map(r => r.trim()).filter(Boolean),
      priorSimilar: { occurred: d.priorOccurred, notes: d.priorNotes },
      summary: d.summary,
      chronology: chronology.filter(c => c.event.trim()),
      facts: facts.map(f => f.trim()).filter(Boolean),
      sopExcerpts, photographs,
    };
    saveInvestigation(inv);
    toast.success('Investigation saved', { id: t });
    navigate(`/investigation/${id}`);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">New Incident Investigation</h1>
          <p className="text-sm text-muted-foreground">HPGRDC Incident Investigation Report — operator inputs</p>
        </div>
      </motion.div>

      <form onSubmit={submit} className="glass-card divide-y divide-border">
        {/* SECTION A */}
        <motion.section variants={item} initial="hidden" animate="show" className="p-6">
          <div className={sectionTitle}>Section A — Incident Header</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Incident Title *</label>
              <input className={fieldClass} placeholder="Enter incident title" value={d.incidentTitle} onChange={e=>upd('incidentTitle', e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Classification *</label>
              <select className={fieldClass} value={d.classification} onChange={e=>upd('classification', e.target.value)} required>
                <option value="">Select...</option>
                {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Numbers</label>
              <input className={fieldClass} value={d.numbers} onChange={e=>upd('numbers', e.target.value)} placeholder="Enter number or Not applicable" />
            </div>
            <div className="md:col-span-2 grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Company Employees</label>
                <input type="number" min={0} className={fieldClass} value={d.company} onChange={e=>upd('company', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Contractor Employees</label>
                <input type="number" min={0} className={fieldClass} value={d.contractor} onChange={e=>upd('contractor', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Visitors</label>
                <input type="number" min={0} className={fieldClass} value={d.visitors} onChange={e=>upd('visitors', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Name of Injured Person</label>
              <input className={fieldClass} placeholder="Enter name / designation" value={d.injuredName} onChange={e=>upd('injuredName', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Age / Sex of IP</label>
              <input className={fieldClass} placeholder="e.g. 32 / Male" value={d.ageSex} onChange={e=>upd('ageSex', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Ticket no. / Department</label>
              <input className={fieldClass} placeholder="Enter ticket no. / department" value={d.ticketDept} onChange={e=>upd('ticketDept', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Company / Contractor</label>
              <input className={fieldClass} placeholder="Enter company / contractor" value={d.companyContractor} onChange={e=>upd('companyContractor', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Nature of Injury</label>
              <input className={fieldClass} placeholder="Enter nature of injury / Not applicable" value={d.natureOfInjury} onChange={e=>upd('natureOfInjury', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Incident Reported by</label>
              <input className={fieldClass} placeholder="Enter name / designation" value={d.reportedBy} onChange={e=>upd('reportedBy', e.target.value)} />
            </div>
          </div>
        </motion.section>

        {/* SECTION B */}
        <motion.section variants={item} initial="hidden" animate="show" className="p-6">
          <div className={sectionTitle}>Section B — Incident Information</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Location of Incident *</label>
              <input className={fieldClass} placeholder="Enter location" value={d.location} onChange={e=>upd('location', e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Incident Number</label>
              <input className={fieldClass} placeholder="Enter incident number" value={d.incidentNumber} onChange={e=>upd('incidentNumber', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Date of Incident *</label>
              <input className={fieldClass} placeholder="dd-mm-yyyy" value={d.dateOfIncident} onChange={e=>upd('dateOfIncident', e.target.value)} required />
              <p className={helpClass}>Format: dd-mm-yyyy</p>
            </div>
            <div>
              <label className={labelClass}>Time of Incident</label>
              <input className={fieldClass} placeholder="hh:mm" value={d.timeOfIncident} onChange={e=>upd('timeOfIncident', e.target.value)} />
              <p className={helpClass}>Format: hh:mm (24h)</p>
            </div>
            <div>
              <label className={labelClass}>Investigation Initiated (Date / Time)</label>
              <input className={fieldClass} placeholder="dd-mm-yyyy hh:mm" value={d.investigationInitiated} onChange={e=>upd('investigationInitiated', e.target.value)} />
              <p className={helpClass}>Format: dd-mm-yyyy hh:mm</p>
            </div>
            <div>
              <label className={labelClass}>Report Submission Date</label>
              <input className={fieldClass} placeholder="dd-mm-yyyy" value={d.reportSubmission} onChange={e=>upd('reportSubmission', e.target.value)} />
              <p className={helpClass}>Enter report submission date (dd-mm-yyyy)</p>
            </div>
          </div>
        </motion.section>

        {/* SECTION C */}
        <motion.section variants={item} initial="hidden" animate="show" className="p-6 space-y-4">
          <div className={sectionTitle}>Section C — Investigation Information</div>
          <RepeatableList label="List of Records Reviewed" items={records} onChange={setRecords} placeholder="e.g. Process SOP, Operating manual" />
          <RepeatableList label="List of Persons Interacted" items={persons} onChange={setPersons} placeholder="e.g. Pradeep Pal Singh — PA" />
          <div className="grid gap-3 md:grid-cols-[auto_1fr] md:items-start">
            <label className="flex items-center gap-2 pt-1 text-sm">
              <input type="checkbox" checked={d.priorOccurred} onChange={e=>upd('priorOccurred', e.target.checked)} />
              Prior similar incident
            </label>
            <textarea className={fieldClass + ' min-h-[60px]'} placeholder="Notes on prior incident, if any" value={d.priorNotes} onChange={e=>upd('priorNotes', e.target.value)} />
          </div>
        </motion.section>

        {/* SECTION D */}
        <motion.section variants={item} initial="hidden" animate="show" className="p-6 space-y-4">
          <div className={sectionTitle}>Section D — Incident Narrative</div>
          <div>
            <label className={labelClass}>Summary of Incident *</label>
            <textarea className={fieldClass + ' min-h-[140px]'} required value={d.summary} onChange={e=>upd('summary', e.target.value)} placeholder="State facts only. Mark estimates/beliefs explicitly." />
          </div>
          <div>
            <label className={labelClass}>Chronology of Events</label>
            <div className="space-y-2">
              {chronology.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input placeholder="Time" className={fieldClass + ' w-32'} value={c.time} onChange={e => {
                    const n = [...chronology]; n[i] = {...n[i], time: e.target.value}; setChronology(n);
                  }} />
                  <input placeholder="Event" className={fieldClass + ' flex-1'} value={c.event} onChange={e => {
                    const n = [...chronology]; n[i] = {...n[i], event: e.target.value}; setChronology(n);
                  }} />
                  <button type="button" onClick={() => setChronology(chronology.filter((_,j)=>j!==i))} className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setChronology([...chronology, {time:'', event:''}])} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3"/> Add row</button>
            </div>
          </div>
          <RepeatableList label="List of Facts collected during Investigation" items={facts} onChange={setFacts} placeholder="e.g. Maximum design flow rate = 1200 LPH" />
        </motion.section>

        {/* SECTION E */}
        <motion.section variants={item} initial="hidden" animate="show" className="p-6 space-y-5">
          <div className={sectionTitle}>Section E — Supporting Attachments (optional, for AI grounding)</div>

          <div>
            <label className={labelClass}>SOPs / Operating Manuals / SMP / Checklist / Supporting Docs</label>
            <input ref={docRef} type="file" multiple accept=".pdf,.docx,.txt,.md" className="hidden" onChange={e=>{ if (e.target.files) addDocs(e.target.files); e.target.value=''; }}/>
            <div onClick={()=>docRef.current?.click()} className="cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/50 p-5 text-center hover:border-primary/50">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-1 text-xs text-muted-foreground">Click to attach PDF / DOCX / TXT (max 20 MB each)</p>
            </div>
            {docs.length > 0 && (
              <div className="mt-2 space-y-1">
                {docs.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded border border-border bg-muted/40 px-2 py-1 text-xs">
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-muted-foreground">{fmtSize(f.size)}</span>
                    <button type="button" onClick={()=>setDocs(docs.filter((_,j)=>j!==i))}><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Photographs (rendered in the downloaded report)</label>
            <input ref={photoRef} type="file" multiple accept="image/*" className="hidden" onChange={e=>{ if (e.target.files) addPhotos(e.target.files); e.target.value=''; }}/>
            <div onClick={()=>photoRef.current?.click()} className="cursor-pointer rounded-lg border-2 border-dashed border-border bg-muted/50 p-5 text-center hover:border-primary/50">
              <ImageIcon className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-1 text-xs text-muted-foreground">Click to attach photographs (max 5 MB each)</p>
            </div>
            {photos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((f, i) => (
                  <div key={i} className="relative overflow-hidden rounded border border-border bg-muted/40">
                    <img src={URL.createObjectURL(f)} alt={f.name} className="h-20 w-full object-cover" />
                    <button type="button" onClick={()=>setPhotos(photos.filter((_,j)=>j!==i))} className="absolute right-0 top-0 rounded-bl bg-background/80 p-0.5"><X className="h-3 w-3" /></button>
                    <div className="truncate p-1 text-[10px]">{f.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        <div className="flex items-center justify-end gap-3 p-6">
          <button type="button" onClick={()=>navigate('/')} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Save & Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function RepeatableList({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[])=>void; placeholder?: string }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input className={fieldClass + ' flex-1'} placeholder={placeholder} value={v} onChange={e => { const n=[...items]; n[i]=e.target.value; onChange(n); }} />
            <button type="button" onClick={()=>onChange(items.filter((_,j)=>j!==i))} className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button type="button" onClick={()=>onChange([...items, ''])} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3"/> Add row</button>
      </div>
    </div>
  );
}
