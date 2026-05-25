import { SYSTEMS_TO_REINFORCE } from '@/types/investigation';
import type { HpgrdcInvestigation, HpgrdcAiReport } from '@/types/investigation';
import { formatChronologyLine } from '@/utils/validation';
import hpLogo from '@/assets/hp-logo.png';
import rndLogo from '@/assets/rnd-logo.png';

/**
 * On-screen HPGRDC report — same structure as the downloaded HTML, but in dark theme.
 * Title block: "Incident Investigation Report" / "HPGRDC."
 */
export default function HpgrdcReportView({ inv, report }: { inv: HpgrdcInvestigation; report: HpgrdcAiReport }) {
  const causeItems = [report.whyTree.cause.primary, report.whyTree.cause.secondary || ''].filter(Boolean);
  const chronList = (inv.chronology || [])
    .map(c => ({ date: (c.date || '').trim(), time: (c.time || '').trim(), event: (c.event || '').trim() }))
    .filter(c => c.event || c.time || c.date);
  const isNA = inv.classification === 'NA' || inv.classification === '';
  const nmText = (inv.nm || '').trim() || (isNA ? 'Not Applicable' : '');
  const pfeText = (inv.pfe || '').trim() || (isNA ? 'Not Applicable' : '');
  const includeAppendix = !!inv.includeSupportNotesInReport;
  const includePending = !!inv.includePendingGapsInReport;
  const confirmedQs = (inv.aiQuestions || []).filter(q => (q.answer || '').trim() || (q.status && q.status !== 'not_checked'));
  const pendingGapQs = (inv.aiQuestions || []).filter(q => !(q.status === 'answered' && (q.answer || '').trim()));
  const acceptedChecks = (inv.aiMissingChecks || []).filter(m => m.status && m.status !== 'ignore');
  const cats = inv.recommendationCategories || [];
  return (
    <div className="rounded-lg border border-border bg-background p-6 text-sm">
      <header className="mb-6 flex items-center justify-between gap-3 border-b border-border pb-4">
        <img src={hpLogo} alt="HPCL" className="h-12 w-auto object-contain" />
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold tracking-wide">Incident Investigation Report</h1>
          <p className="text-sm font-semibold text-muted-foreground">HPGRDC.</p>
        </div>
        <img src={rndLogo} alt="HP Green R&D Centre" className="h-12 w-auto object-contain" />
      </header>

      <H>Header</H>
      <table className="w-full border-collapse text-xs">
        <tbody>
          <Row label="Incident Title" value={inv.incidentTitle} />
          <Row label="Numbers" value={inv.numbers} />
          <tr>
            <th className="border border-border bg-muted/40 p-2 text-left font-semibold">Details of Injured</th>
            <td className="border border-border p-2">Company: {inv.injured.company} &nbsp; • &nbsp; Contractor: {inv.injured.contractor} &nbsp; • &nbsp; Visitors: {inv.injured.visitors}</td>
          </tr>
          <Row label="Name of Injured Person" value={inv.injuredName || '—'} />
          <Row label="Age / Sex of IP" value={inv.ageSex || '—'} />
          <Row label="Ticket no. / Department" value={inv.ticketDept || '—'} />
          <Row label="Company / Contractor" value={inv.companyContractor || '—'} />
          <Row label="Nature of Injury" value={inv.natureOfInjury || '—'} />
          <Row label="Incident Reported by" value={inv.reportedBy || '—'} />
        </tbody>
      </table>

      <H>Classification</H>
      <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            {['FATAL','LWC','RWC','MTC','FAC','NM','PFE'].map(c => (
              <th key={c} className={`border border-border p-2 text-center text-[11px] font-bold ${!isNA && inv.classification===c?'bg-primary text-primary-foreground':'bg-muted/40'}`}>{c}</th>
            ))}
          </tr>
          <tr>
            {['FATAL','LWC','RWC','MTC','FAC','NM','PFE'].map(c => {
              const val = c === 'NM' ? nmText : c === 'PFE' ? pfeText : '';
              return (
                <td key={c} className={`border border-border p-1 text-center text-[10px] ${!isNA && inv.classification===c?'bg-primary/20 text-primary':''}`} style={{wordBreak:'break-word'}}>
                  {val}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      {isNA && <p className="mt-1 text-[10px] italic text-muted-foreground">Classification: Not Applicable</p>}

      <H>Incident Information</H>
      <table className="w-full border-collapse text-xs">
        <tbody>
          <Row label="Location of Incident" value={inv.location} />
          <Row label="Incident Number" value={inv.incidentNumber || '—'} />
          <Row label="Date of Incident" value={inv.dateOfIncident} />
          <Row label="Time of Incident" value={inv.timeOfIncident || '—'} />
          <Row label="Investigation Initiated" value={inv.investigationInitiated || '—'} />
          <Row label="Report Submission" value={inv.reportSubmission || '—'} />
        </tbody>
      </table>

      <H>Investigation Information</H>
      <table className="w-full border-collapse text-xs">
        <tbody>
          <tr>
            <th className="w-48 border border-border bg-muted/40 p-2 text-left font-semibold">Records Reviewed</th>
            <td className="border border-border p-2">
              {(inv.recordsReviewed||[]).filter(Boolean).length
                ? (inv.recordsReviewed||[]).filter(Boolean).map((r,i)=><div key={i}>{r}</div>)
                : '—'}
            </td>
          </tr>
          <tr>
            <th className="w-48 border border-border bg-muted/40 p-2 text-left font-semibold">Persons Interacted</th>
            <td className="border border-border p-2">
              {(inv.personsInteracted||[]).filter(Boolean).length
                ? (inv.personsInteracted||[]).filter(Boolean).map((p,i)=><div key={i}>{p}</div>)
                : '—'}
            </td>
          </tr>
          <Row label="Prior similar incident" value={inv.priorSimilar.occurred ? `Yes — ${inv.priorSimilar.notes||''}` : 'No'} />
        </tbody>
      </table>

      <H>Summary of Incident</H>
      <p className="whitespace-pre-wrap border border-border p-3 text-xs leading-relaxed">{inv.summary}</p>

      {chronList.length > 0 && (<>
        <H>Chronology of Events</H>
        <ol className="list-decimal space-y-1 border border-border p-3 pl-8 text-xs">
          {chronList.map((c, i) => <li key={i}>{formatChronologyLine(c.date, c.time, c.event)}</li>)}
        </ol>
      </>)}

      {inv.facts.length > 0 && (<>
        <H>List of Facts collected during Investigation</H>
        <ol className="list-decimal space-y-1 border border-border p-3 pl-8 text-xs">
          {inv.facts.map((f, i) => <li key={i}>{f}</li>)}
        </ol>
      </>)}

      <H>WHY Tree Analysis</H>
      <div className="flex flex-col items-stretch">
        <WhyLevel label="Effect" items={[report.whyTree.effect]} />
        {causeItems.length ? <><WhyConnector /><WhyLevel label="Cause" items={causeItems} /></> : null}
        {report.whyTree.why?.length ? <><WhyConnector /><WhyLevel label="Why" items={report.whyTree.why} /></> : null}
        {report.whyTree.deeper?.length ? <><WhyConnector /><WhyLevel label="Deeper Cause" items={report.whyTree.deeper} /></> : null}
        {report.whyTree.rootWeakness?.length ? <><WhyConnector /><WhyLevel label="Root Weakness" items={report.whyTree.rootWeakness} /></> : null}
      </div>

      <H>Key Factors Identified</H>
      <div className="space-y-2 text-xs">
        <KF label="SYSTEM FACTORS" items={report.keyFactors.system} />
        <KF label="HUMAN FACTORS" items={report.keyFactors.human} />
        <KF label="PHYSICAL FACTORS" items={report.keyFactors.physical} />
      </div>

      <H>Systems that needs to be Reinforced</H>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-14 border border-border bg-muted/40 p-2">Sr No.</th>
            <th className="border border-border bg-muted/40 p-2 text-left">System</th>
            <th className="border border-border bg-muted/40 p-2 text-left">Deficiency</th>
          </tr>
        </thead>
        <tbody>
          {SYSTEMS_TO_REINFORCE.map((sys, i) => {
            const m = (report.systemsToReinforce||[]).find(s => (s.system||'').trim().toLowerCase() === sys.toLowerCase());
            const def = m?.deficiency?.trim();
            return (
              <tr key={sys}>
                <td className="border border-border p-2 text-center font-mono">{i+1}</td>
                <td className="border border-border p-2 font-medium">{sys}</td>
                <td className="border border-border p-2">{def ? def : <span className="italic text-muted-foreground">—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <H>Recommendations</H>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-12 border border-border bg-muted/40 p-2">Sr No.</th>
            <th className="border border-border bg-muted/40 p-2 text-left">Recommendation</th>
            <th className="w-36 border border-border bg-muted/40 p-2 text-left">Responsibility</th>
            <th className="w-28 border border-border bg-muted/40 p-2 text-left">Target Date</th>
            <th className="w-40 border border-border bg-muted/40 p-2 text-left">Verified by</th>
          </tr>
        </thead>
        <tbody>
          {(report.recommendations||[]).map((r, i) => (
            <tr key={i}>
              <td className="border border-border p-2 text-center font-mono">{i+1}</td>
              <td className="border border-border p-2">{r.recommendation}</td>
              <td className="border border-border p-2">{r.responsibility || ''}</td>
              <td className="border border-border p-2">{r.targetDate || ''}</td>
              <td className="border border-border p-2">{r.verifiedBy || ''}</td>
            </tr>
          ))}
          {!report.recommendations?.length && <tr><td colSpan={5} className="border border-border p-3 text-center text-muted-foreground">No recommendations generated.</td></tr>}
        </tbody>
      </table>

      <H>Incident Investigation Completion</H>
      <div className="grid grid-cols-2 gap-px bg-border text-xs">
        <div className="bg-background p-3">Prepared by: {inv.preparedBy || '___________________'}</div>
        <div className="bg-background p-3">Reviewed &amp; Approved by: {inv.approvedBy || '___________________'}</div>
      </div>

      <H>Supporting Photographs</H>
      {(inv.photographs||[]).length === 0 ? (
        <div className="min-h-[120px] border border-border p-3 text-xs text-muted-foreground">No photographs attached.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {inv.photographs!.map((p, i) => (
            <figure key={i} className="border border-border p-2">
              <img src={p.dataUrl} alt={p.name} className="mx-auto max-h-64 object-contain" />
              <figcaption className="mt-2 text-center text-xs italic text-muted-foreground">Figure {i+1}: {p.caption || p.name}</figcaption>
            </figure>
          ))}
        </div>
      )}

      {includeAppendix && (confirmedQs.length || acceptedChecks.length || cats.length) > 0 && (
        <>
          <H>Appendix — Investigation Support Notes</H>
          {confirmedQs.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider">Confirmed Investigation Answers</p>
              <ol className="list-decimal space-y-1 border border-border p-3 pl-8 text-xs">
                {confirmedQs.map(q => (
                  <li key={q.id}><b>{q.question}</b><br/><span className="text-muted-foreground">{q.answer || `(${q.status})`}</span></li>
                ))}
              </ol>
            </div>
          )}
          {acceptedChecks.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider">Missing-Evidence Checks</p>
              <ul className="list-disc space-y-1 border border-border p-3 pl-8 text-xs">
                {acceptedChecks.map(m => (
                  <li key={m.id}>{m.text} <span className="text-muted-foreground">— {m.status}{m.response ? `: ${m.response}` : ''}</span></li>
                ))}
              </ul>
            </div>
          )}
          {cats.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider">Recommendation Categories</p>
              <p className="border border-border p-3 text-xs">{cats.join(' • ')}</p>
            </div>
          )}
        </>
      )}

      {includePending && pendingGapQs.length > 0 && (
        <>
          <H>Appendix — Pending Investigation Gaps</H>
          <ul className="list-disc space-y-1 border border-border p-3 pl-8 text-xs">
            {pendingGapQs.map(q => (
              <li key={q.id}>{q.question} <span className="text-muted-foreground">— {q.status || 'not checked'}</span></li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function H({ children }: { children: any }) {
  return <h2 className="mb-2 mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary">{children}</h2>;
}
function Row({ label, value }: { label: string; value: any }) {
  return (
    <tr>
      <th className="w-48 border border-border bg-muted/40 p-2 text-left font-semibold">{label}</th>
      <td className="border border-border p-2">{value || ''}</td>
    </tr>
  );
}
function WhyLevel({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="overflow-hidden rounded border border-border">
      <div className="bg-foreground/90 px-3 py-1 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-background">{label}</div>
      <div className="divide-y divide-border">
        {items.map((x, i) => <div key={i} className="bg-background p-2 text-center text-xs leading-relaxed">{x}</div>)}
      </div>
    </div>
  );
}
function WhyConnector() {
  return <div className="mx-auto my-1 h-3 w-0.5 bg-foreground/60" />;
}
function KF({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="border border-border">
      <div className="border-b border-border bg-muted/40 p-2 font-bold">{label}</div>
      <div className="p-2">
        {items?.length ? (
          <ul className="list-disc space-y-1 pl-5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
        ) : <span className="italic text-muted-foreground">Nil</span>}
      </div>
    </div>
  );
}
