import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Upload, ArrowRight, X, FileText, Image as ImageIcon, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { parseSopFiles } from '@/utils/parseSop';
import { saveInvestigation, newInvestigationId, getInvestigation } from '@/data/investigationStore';
import { CLASSIFICATIONS, CLASSIFICATION_LEGEND } from '@/types/investigation';
import type { HpgrdcInvestigation, Classification, Photograph, SopExcerpt } from '@/types/investigation';
import { findInvalidRows } from '@/utils/validation';
import type { InvalidRow } from '@/utils/validation';

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
  const { editId } = useParams();
  const existing = editId ? getInvestigation(editId) : undefined;
  const isEdit = !!existing;
  const docRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<File[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [existingSops, setExistingSops] = useState<SopExcerpt[]>(existing?.sopExcerpts || []);
  const [existingPhotos, setExistingPhotos] = useState<Photograph[]>(existing?.photographs || []);

  const [d, setD] = useState({
    incidentTitle: existing?.incidentTitle || '',
    classification: (existing?.classification || '') as Classification | '',
    numbers: existing?.numbers || '',
    nm: existing?.nm && existing.nm !== 'Not Applicable' ? existing.nm : '',
    pfe: existing?.pfe && existing.pfe !== 'Not Applicable' ? existing.pfe : '',
    nmNA: existing?.nm === 'Not Applicable',
    pfeNA: existing?.pfe === 'Not Applicable',
    company: existing?.injured?.company || 0,
    contractor: existing?.injured?.contractor || 0,
    visitors: existing?.injured?.visitors || 0,
    injuredName: existing?.injuredName || '',
    ageSex: existing?.ageSex || '',
    ticketDept: existing?.ticketDept || '',
    companyContractor: existing?.companyContractor || '',
    natureOfInjury: existing?.natureOfInjury || '',
    reportedBy: existing?.reportedBy || '',
    labName: existing?.labName || '',
    suspectedCause: existing?.suspectedCause || '',
    correctiveActionTaken: existing?.correctiveActionTaken || '',
    location: existing?.location || '',
    incidentNumber: existing?.incidentNumber || '',
    dateOfIncident: existing?.dateOfIncident || '',
    timeOfIncident: existing?.timeOfIncident || '',
    investigationInitiated: existing?.investigationInitiated || '',
    reportSubmission: existing?.reportSubmission || '',
    priorOccurred: existing?.priorSimilar?.occurred || false,
    priorNotes: existing?.priorSimilar?.notes || '',
    summary: existing?.summary || '',
  });

  const [records, setRecords] = useState<string[]>(existing?.recordsReviewed?.length ? existing.recordsReviewed : ['']);
  const [persons, setPersons] = useState<string[]>(existing?.personsInteracted?.length ? existing.personsInteracted : ['']);
  const [chronology, setChronology] = useState<{date: string; time: string; event: string}[]>(
    existing?.chronology?.length
      ? existing.chronology.map(c => ({ date: c.date || '', time: c.time || '', event: c.event || '' }))
      : [{date:'', time:'', event:''}]
  );
  const [facts, setFacts] = useState<string[]>(existing?.facts?.length ? existing.facts : ['']);
  const [acceptedRows, setAcceptedRows] = useState<Record<string, true>>(
    Object.fromEntries((existing?.acceptedInvalidRows || []).map(k => [k, true as const]))
  );
  const [invalidPanel, setInvalidPanel] = useState<InvalidRow[]>([]);

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

  const buildInvestigation = async (): Promise<HpgrdcInvestigation> => {
    let sopExcerpts: SopExcerpt[] = [...existingSops];
    let photographs: Photograph[] = [...existingPhotos];
    try {
      if (docs.length) sopExcerpts = [...sopExcerpts, ...(await parseSopFiles(docs))];
      if (photos.length) photographs = [...photographs, ...(await Promise.all(photos.map(readImage)))];
    } catch (e) { console.warn(e); }
    const id = isEdit ? existing!.id : newInvestigationId();
    const base: HpgrdcInvestigation = {
      id, createdAt: existing?.createdAt || new Date().toISOString(),
      incidentTitle: d.incidentTitle, classification: d.classification, numbers: d.numbers,
      nm: d.nmNA ? 'Not Applicable' : d.nm.trim(),
      pfe: d.pfeNA ? 'Not Applicable' : d.pfe.trim(),
      injured: { company: +d.company || 0, contractor: +d.contractor || 0, visitors: +d.visitors || 0 },
      injuredName: d.injuredName, ageSex: d.ageSex, ticketDept: d.ticketDept,
      companyContractor: d.companyContractor, natureOfInjury: d.natureOfInjury, reportedBy: d.reportedBy,
      labName: d.labName.trim(),
      suspectedCause: d.suspectedCause.trim(),
      correctiveActionTaken: d.correctiveActionTaken.trim(),
      location: d.location, incidentNumber: d.incidentNumber,
      dateOfIncident: d.dateOfIncident, timeOfIncident: d.timeOfIncident,
      investigationInitiated: d.investigationInitiated, reportSubmission: d.reportSubmission,
      recordsReviewed: records.map(r => r.trim()).filter(Boolean),
      personsInteracted: persons.map(r => r.trim()).filter(Boolean),
      priorSimilar: { occurred: d.priorOccurred, notes: d.priorNotes },
      summary: d.summary,
      chronology: chronology
        .map(c => ({ date: c.date.trim(), time: c.time.trim(), event: c.event.trim() }))
        .filter(c => c.event),
      facts: facts.map(f => f.trim()).filter(Boolean),
      sopExcerpts, photographs,
      acceptedInvalidRows: Object.keys(acceptedRows),
    };
    if (isEdit && existing) {
      // Preserve all AI-stage state
      return {
        ...base,
        aiQuestions: existing.aiQuestions,
        aiMissingChecks: existing.aiMissingChecks,
        questionsInputHash: existing.questionsInputHash,
        recommendationCategories: existing.recommendationCategories,
        aiReport: existing.aiReport,
        aiInputHash: existing.aiInputHash,
        aiHistory: existing.aiHistory,
        includeSupportNotesInReport: existing.includeSupportNotesInReport,
        includePendingGapsInReport: existing.includePendingGapsInReport,
        preparedBy: existing.preparedBy,
        approvedBy: existing.approvedBy,
      };
    }
    return base;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.incidentTitle || !d.classification || !d.location || !d.dateOfIncident || !d.summary) {
      toast.error('Fill incident title, classification, location, date, and summary');
      return;
    }
    const allInvalid = findInvalidRows({
      chronology, facts,
      recordsReviewed: records, personsInteracted: persons,
    });
    const invalid = allInvalid.filter(r => !acceptedRows[r.key]);
    setInvalidPanel(invalid);
    if (invalid.length) {
      toast.error(
        `${invalid.length} row(s) flagged. Fix them or mark "Accept as valid technical input".`
      );
      return;
    }
    const t = toast.loading(isEdit ? 'Updating investigation...' : 'Saving investigation...');
    const inv = await buildInvestigation();
    saveInvestigation(inv);
    toast.success(isEdit ? 'Investigation updated' : 'Investigation saved', { id: t });
    navigate(`/investigation/${inv.id}`);
  };

  const saveDraft = async () => {
    const t = toast.loading('Saving draft...');
    try {
      const inv = await buildInvestigation();
      saveInvestigation(inv);
      toast.success('Draft saved', { id: t });
    } catch {
      toast.error('Failed to save draft', { id: t });
    }
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
                {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c === 'NA' ? 'Not Applicable' : c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Numbers</label>
              <input className={fieldClass} value={d.numbers} onChange={e=>upd('numbers', e.target.value)} placeholder="Enter number or Not applicable" />
            </div>
            <div>
              <label className={labelClass}>NM (Near Miss)</label>
              <div className="flex gap-2">
                <input className={fieldClass + ' flex-1 disabled:opacity-50'} value={d.nmNA ? 'Not Applicable' : d.nm} disabled={d.nmNA} onChange={e=>upd('nm', e.target.value)} placeholder="Enter Near Miss details" />
                <label className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"><input type="checkbox" checked={d.nmNA} onChange={e=>upd('nmNA', e.target.checked)} /> N/A</label>
              </div>
            </div>
            <div>
              <label className={labelClass}>PFE (Process / Property / Fire Event)</label>
              <div className="flex gap-2">
                <input className={fieldClass + ' flex-1 disabled:opacity-50'} value={d.pfeNA ? 'Not Applicable' : d.pfe} disabled={d.pfeNA} onChange={e=>upd('pfe', e.target.value)} placeholder="Process incident / Property damage / Equipment damage" />
                <label className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"><input type="checkbox" checked={d.pfeNA} onChange={e=>upd('pfeNA', e.target.checked)} /> N/A</label>
              </div>
            </div>
            <div className="md:col-span-2 rounded-md border border-border/60 bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Classification legend</p>
              <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground sm:grid-cols-2">
                {CLASSIFICATION_LEGEND.map(l => (
                  <div key={l.code}><span className="font-mono font-semibold text-foreground">{l.code}</span> — {l.meaning}</div>
                ))}
              </div>
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
            <div className="md:col-span-2">
              <label className={labelClass}>Lab Name</label>
              <input className={fieldClass} placeholder="Enter lab name" value={d.labName} onChange={e=>upd('labName', e.target.value)} />
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
              <input type="time" className={fieldClass} placeholder="hh:mm" value={d.timeOfIncident} onChange={e=>upd('timeOfIncident', e.target.value)} />
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
          <RepeatableList label="List of Records Reviewed" help="Add one record per row" items={records} onChange={setRecords} placeholder="Enter reviewed document" />
          <RepeatableList label="List of Persons Interacted" help="Add one person per row" items={persons} onChange={setPersons} placeholder="Enter interacted person" />
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
            <textarea className={fieldClass + ' min-h-[140px]'} required value={d.summary} onChange={e=>upd('summary', e.target.value)} placeholder="Enter factual summary of the incident" />
            <p className={helpClass}>Use factual observations only. Mark estimates explicitly.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Suspected Cause (investigator view, optional)</label>
              <textarea className={fieldClass + ' min-h-[80px]'} value={d.suspectedCause} onChange={e=>upd('suspectedCause', e.target.value)} placeholder="Enter suspected cause / Not Applicable" />
            </div>
            <div>
              <label className={labelClass}>Corrective Action Taken (immediate)</label>
              <textarea className={fieldClass + ' min-h-[80px]'} value={d.correctiveActionTaken} onChange={e=>upd('correctiveActionTaken', e.target.value)} placeholder="Enter immediate corrective action / Not Applicable" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Chronology of Events</label>
            <p className={helpClass + ' mb-2'}>Add one chronology event per row</p>
            <div className="space-y-2">
              {chronology.map((c, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <input placeholder="dd-mm-yyyy" className={fieldClass + ' w-36'} value={c.date} onChange={e => {
                    const n = [...chronology]; n[i] = {...n[i], date: e.target.value}; setChronology(n);
                  }} />
                  <input type="time" placeholder="hh:mm" className={fieldClass + ' w-32'} value={c.time} onChange={e => {
                    const n = [...chronology]; n[i] = {...n[i], time: e.target.value}; setChronology(n);
                  }} />
                  <input placeholder="Enter chronology event" className={fieldClass + ' flex-1 min-w-[200px]'} value={c.event} onChange={e => {
                    const n = [...chronology]; n[i] = {...n[i], event: e.target.value}; setChronology(n);
                  }} />
                  <button type="button" onClick={() => setChronology(chronology.filter((_,j)=>j!==i))} className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setChronology([...chronology, {date:'', time:'', event:''}])} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3"/> Add row</button>
            </div>
          </div>
          <RepeatableList label="List of Facts collected during Investigation" help="Use factual observations only" items={facts} onChange={setFacts} placeholder="Enter fact collected" />
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
            {existingSops.length > 0 && (
              <div className="mt-2 space-y-1">
                {existingSops.map((s, i) => (
                  <div key={`ex-${i}`} className="flex items-center gap-2 rounded border border-border bg-muted/40 px-2 py-1 text-xs">
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="flex-1 truncate">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground">already attached</span>
                    <button type="button" onClick={()=>setExistingSops(existingSops.filter((_,j)=>j!==i))}><X className="h-3 w-3" /></button>
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
            {existingPhotos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {existingPhotos.map((p, i) => (
                  <div key={`ex-${i}`} className="relative overflow-hidden rounded border border-border bg-muted/40">
                    <img src={p.dataUrl} alt={p.name} className="h-20 w-full object-cover" />
                    <button type="button" onClick={()=>setExistingPhotos(existingPhotos.filter((_,j)=>j!==i))} className="absolute right-0 top-0 rounded-bl bg-background/80 p-0.5"><X className="h-3 w-3" /></button>
                    <div className="truncate p-1 text-[10px]">{p.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {invalidPanel.length > 0 && (
          <div className="m-6 rounded-md border border-destructive/50 bg-destructive/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-destructive mb-2">
              {invalidPanel.length} flagged row(s)
            </p>
            <p className="text-[11px] text-muted-foreground mb-3">
              Fix the text below, or tick "Accept as valid technical input" if it is a real engineering fact.
            </p>
            <ul className="space-y-2">
              {invalidPanel.map(r => (
                <li key={r.key} className="rounded border border-border bg-background/60 p-2 text-xs">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold text-foreground">{r.section} #{r.index}</span>
                    <span className="text-muted-foreground italic">— {r.reason}</span>
                  </div>
                  <div className="mt-1 text-foreground">{r.text}</div>
                  <label className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary">
                    <input
                      type="checkbox"
                      checked={!!acceptedRows[r.key]}
                      onChange={e => setAcceptedRows(p => {
                        const n = { ...p };
                        if (e.target.checked) n[r.key] = true; else delete n[r.key];
                        return n;
                      })}
                    />
                    Accept as valid technical input
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 p-6">
          <button type="button" onClick={()=>navigate('/')} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button type="button" onClick={saveDraft} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium hover:bg-accent">
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            {isEdit ? 'Save & Return to Analysis' : 'Save & Continue'} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function RepeatableList({ label, items, onChange, placeholder, help }: { label: string; items: string[]; onChange: (v: string[])=>void; placeholder?: string; help?: string }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {help && <p className={helpClass + ' mb-2'}>{help}</p>}
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
