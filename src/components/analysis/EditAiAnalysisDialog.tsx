import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { SYSTEMS_TO_REINFORCE } from '@/types/investigation';
import type { HpgrdcAiReport } from '@/types/investigation';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

const fieldClass = "w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelClass = "block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1";
const sectionTitle = "text-xs font-bold uppercase tracking-[0.2em] text-primary border-b border-border pb-2 mb-3 mt-5";

function asLines(arr: string[] | undefined) { return (arr || []).join('\n'); }
function fromLines(s: string) { return s.split('\n').map(x => x.trim()).filter(Boolean); }

export default function EditAiAnalysisDialog({
  open, onOpenChange, report, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  report: HpgrdcAiReport;
  onSave: (next: HpgrdcAiReport) => void;
}) {
  // WHY tree
  const [effect, setEffect] = useState(report.whyTree.effect);
  const [causePrimary, setCausePrimary] = useState(report.whyTree.cause.primary);
  const [causeSecondary, setCauseSecondary] = useState(report.whyTree.cause.secondary || '');
  const [why, setWhy] = useState(asLines(report.whyTree.why));
  const [deeper, setDeeper] = useState(asLines(report.whyTree.deeper));
  const [rootWeakness, setRootWeakness] = useState(asLines(report.whyTree.rootWeakness));

  // Key factors
  const [kfSystem, setKfSystem] = useState(asLines(report.keyFactors.system));
  const [kfHuman, setKfHuman] = useState(asLines(report.keyFactors.human));
  const [kfPhysical, setKfPhysical] = useState(asLines(report.keyFactors.physical));

  // Systems to reinforce (deficiency keyed by system name)
  const initialDef: Record<string, string> = {};
  SYSTEMS_TO_REINFORCE.forEach(s => {
    const m = (report.systemsToReinforce || []).find(x => (x.system||'').trim().toLowerCase() === s.toLowerCase());
    initialDef[s] = m?.deficiency || '';
  });
  const [defs, setDefs] = useState(initialDef);

  // Recommendations
  const [recs, setRecs] = useState(
    (report.recommendations || []).map(r => ({ ...r }))
  );

  const addRec = () => setRecs([...recs, { recommendation: '', responsibility: '', targetDate: '', verifiedBy: '' }]);
  const updRec = (i: number, k: string, v: string) => {
    const n = [...recs]; (n[i] as any)[k] = v; setRecs(n);
  };
  const delRec = (i: number) => setRecs(recs.filter((_, j) => j !== i));

  const save = () => {
    if (!effect.trim() || !causePrimary.trim()) {
      toast.error('Effect and primary cause are required');
      return;
    }
    const next: HpgrdcAiReport = {
      ...report,
      whyTree: {
        effect: effect.trim(),
        cause: { primary: causePrimary.trim(), secondary: causeSecondary.trim() || undefined },
        why: fromLines(why),
        deeper: fromLines(deeper),
        rootWeakness: fromLines(rootWeakness),
      },
      keyFactors: {
        system: fromLines(kfSystem),
        human: fromLines(kfHuman),
        physical: fromLines(kfPhysical),
      },
      systemsToReinforce: SYSTEMS_TO_REINFORCE
        .map(s => ({ system: s, deficiency: (defs[s] || '').trim() }))
        .filter(x => x.deficiency),
      recommendations: recs
        .map(r => ({
          recommendation: r.recommendation.trim(),
          responsibility: (r.responsibility || '').trim(),
          targetDate: (r.targetDate || '').trim(),
          verifiedBy: (r.verifiedBy || '').trim(),
        }))
        .filter(r => r.recommendation),
    };
    onSave(next);
    onOpenChange(false);
    toast.success('AI analysis updated');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit AI Analysis</DialogTitle>
          <DialogDescription>
            Manually refine the four AI-generated sections. Saving updates the stored report and the downloaded HTML.
            No new AI call is made.
          </DialogDescription>
        </DialogHeader>

        <div className={sectionTitle}>WHY Tree</div>
        <div className="space-y-3">
          <div><label className={labelClass}>Effect</label><input className={fieldClass} value={effect} onChange={e=>setEffect(e.target.value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={labelClass}>Cause — Primary</label><input className={fieldClass} value={causePrimary} onChange={e=>setCausePrimary(e.target.value)} /></div>
            <div><label className={labelClass}>Cause — Secondary</label><input className={fieldClass} value={causeSecondary} onChange={e=>setCauseSecondary(e.target.value)} /></div>
          </div>
          <div><label className={labelClass}>Why (one per line)</label><textarea className={fieldClass + ' min-h-[70px]'} value={why} onChange={e=>setWhy(e.target.value)} /></div>
          <div><label className={labelClass}>Deeper Why (one per line)</label><textarea className={fieldClass + ' min-h-[70px]'} value={deeper} onChange={e=>setDeeper(e.target.value)} /></div>
          <div><label className={labelClass}>Root Weakness (one per line)</label><textarea className={fieldClass + ' min-h-[70px]'} value={rootWeakness} onChange={e=>setRootWeakness(e.target.value)} /></div>
        </div>

        <div className={sectionTitle}>Key Factors</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className={labelClass}>System (one per line)</label><textarea className={fieldClass + ' min-h-[100px]'} value={kfSystem} onChange={e=>setKfSystem(e.target.value)} /></div>
          <div><label className={labelClass}>Human (one per line)</label><textarea className={fieldClass + ' min-h-[100px]'} value={kfHuman} onChange={e=>setKfHuman(e.target.value)} /></div>
          <div><label className={labelClass}>Physical (one per line)</label><textarea className={fieldClass + ' min-h-[100px]'} value={kfPhysical} onChange={e=>setKfPhysical(e.target.value)} /></div>
        </div>

        <div className={sectionTitle}>Systems to be Reinforced — Deficiencies</div>
        <div className="space-y-2">
          {SYSTEMS_TO_REINFORCE.map((s, i) => (
            <div key={s} className="grid grid-cols-[28px_1fr_2fr] items-center gap-2 text-xs">
              <span className="text-center font-mono text-muted-foreground">{i+1}</span>
              <span className="font-medium">{s}</span>
              <input className={fieldClass} placeholder="Leave blank if no deficiency" value={defs[s] || ''}
                onChange={e=>setDefs({ ...defs, [s]: e.target.value })} />
            </div>
          ))}
        </div>

        <div className={sectionTitle}>Recommendations</div>
        <div className="space-y-2">
          {recs.map((r, i) => (
            <div key={i} className="grid grid-cols-[24px_2fr_1fr_1fr_1fr_24px] items-start gap-2 text-xs">
              <span className="pt-2 text-center font-mono text-muted-foreground">{i+1}</span>
              <textarea className={fieldClass + ' min-h-[44px]'} placeholder="Recommendation" value={r.recommendation} onChange={e=>updRec(i, 'recommendation', e.target.value)} />
              <input className={fieldClass} placeholder="Responsibility" value={r.responsibility} onChange={e=>updRec(i, 'responsibility', e.target.value)} />
              <input className={fieldClass} placeholder="Target Date" value={r.targetDate} onChange={e=>updRec(i, 'targetDate', e.target.value)} />
              <input className={fieldClass} placeholder="Verified by" value={r.verifiedBy} onChange={e=>updRec(i, 'verifiedBy', e.target.value)} />
              <button type="button" onClick={()=>delRec(i)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <button type="button" onClick={addRec} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3"/> Add recommendation</button>
        </div>

        <DialogFooter className="mt-4">
          <button type="button" onClick={()=>onOpenChange(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button type="button" onClick={save} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Save Changes</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}