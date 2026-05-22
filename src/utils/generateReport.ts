import { SYSTEMS_TO_REINFORCE } from '@/types/investigation';
import type { HpgrdcInvestigation, HpgrdcAiReport } from '@/types/investigation';

const esc = (s: unknown) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const nl2br = (s: string) => esc(s).replace(/\n/g, '<br/>');

export async function generateInvestigationReport(inv: HpgrdcInvestigation, report: HpgrdcAiReport): Promise<void> {
  const classCells = ['FATAL','LWC','RWC','MTC','FAC','NM','PFE'].map(c =>
    `<td class="cls ${inv.classification===c?'sel':''}">${c}</td>`).join('');

  const sysRows = SYSTEMS_TO_REINFORCE.map((sys, i) => {
    const m = (report.systemsToReinforce||[]).find(s => (s.system||'').trim().toLowerCase() === sys.toLowerCase());
    const def = (m?.deficiency || '').trim();
    return `<tr><td class="num">${i+1}</td><td>${esc(sys)}</td><td>${esc(def)}</td></tr>`;
  }).join('');

  const recRows = (report.recommendations||[]).map((r, i) =>
    `<tr><td class="num">${i+1}</td><td>${esc(r.recommendation)}</td><td>${esc(r.responsibility||'')}</td><td>${esc(r.targetDate||'')}</td><td>${esc(r.verifiedBy||'')}</td></tr>`).join('')
    || `<tr><td colspan="5" style="text-align:center;color:#666;">No recommendations.</td></tr>`;

  const chronologyRows = inv.chronology.length
    ? `<ol>${inv.chronology.map(c => `<li>${c.time?`<b>${esc(c.time)}</b> — `:''}${esc(c.event)}</li>`).join('')}</ol>`
    : '<p style="color:#666;">—</p>';

  const factRows = inv.facts.length
    ? `<ol>${inv.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ol>`
    : '<p style="color:#666;">—</p>';

  const whyTree = `
    <table class="why">
      <tr><th>Effect</th></tr>
      <tr><td>${esc(report.whyTree.effect)}</td></tr>
    </table>
    <table class="why">
      <tr><th colspan="2">Cause</th></tr>
      <tr><td>${esc(report.whyTree.cause.primary)}</td><td>${esc(report.whyTree.cause.secondary||'')}</td></tr>
    </table>
    <table class="why">
      <tr><th colspan="${Math.max(report.whyTree.why.length,1)}">Why</th></tr>
      <tr>${(report.whyTree.why.length?report.whyTree.why:['']).map(x => `<td>${esc(x)}</td>`).join('')}</tr>
    </table>
    ${report.whyTree.deeper.length ? `<table class="why"><tr>${report.whyTree.deeper.map(x => `<td>${esc(x)}</td>`).join('')}</tr></table>` : ''}
    ${report.whyTree.rootWeakness.length ? `<table class="why"><tr>${report.whyTree.rootWeakness.map(x => `<td>${esc(x)}</td>`).join('')}</tr></table>` : ''}
  `;

  const kfBlock = (label: string, items: string[]) => `
    <table class="kf">
      <tr><th>${label}</th></tr>
      <tr><td>${items?.length ? items.map(esc).join('<br/>') : 'Nil'}</td></tr>
    </table>
  `;

  const photoBlock = (inv.photographs||[]).length
    ? (inv.photographs||[]).map((p, i) => `
        <figure class="photo">
          <img src="${p.dataUrl}" alt="${esc(p.name)}"/>
          <figcaption>Figure ${i+1}: ${esc(p.caption || p.name)}</figcaption>
        </figure>`).join('')
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Incident Investigation Report — ${esc(inv.id)}</title>
<style>
  @page{size:A4;margin:18mm}
  *{box-sizing:border-box}
  body{font-family:'Times New Roman',Georgia,serif;color:#000;background:#fff;font-size:11pt;line-height:1.45;margin:0;padding:24px}
  h1.title{text-align:center;font-size:18pt;margin:0 0 4px 0;font-weight:700;letter-spacing:.5px}
  .sub{text-align:center;font-size:12pt;font-weight:700;margin:0 0 18px 0}
  h2{font-size:11pt;font-weight:700;margin:18px 0 6px 0;text-transform:uppercase;letter-spacing:.5px}
  table{width:100%;border-collapse:collapse;margin-bottom:6px}
  th,td{border:1px solid #000;padding:5px 7px;vertical-align:top;font-size:10.5pt;text-align:left}
  th{background:#eee;font-weight:700}
  td.num{width:42px;text-align:center;font-family:monospace}
  td.cls{text-align:center;padding:4px 2px;border:1px solid #000;font-weight:600;width:14%}
  td.cls.sel{background:#000;color:#fff}
  ol{margin:0 0 6px 22px;padding:0}
  ol li{margin-bottom:3px}
  .why td,.why th{text-align:center}
  .why th{background:#ddd}
  .kf{margin-bottom:4px}
  .completion{display:grid;grid-template-columns:1fr 1fr;border:1px solid #000}
  .completion>div{border-right:1px solid #000;padding:24px 12px}
  .completion>div:last-child{border-right:none}
  .photos{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:8px}
  .photo{border:1px solid #000;padding:8px;text-align:center;page-break-inside:avoid}
  .photo img{max-width:100%;max-height:320px;object-fit:contain}
  .photo figcaption{margin-top:6px;font-style:italic;font-size:10pt}
  .empty-photos{border:1px solid #000;min-height:160px;padding:8px;color:#666;font-style:italic}
  p{margin:0 0 6px 0}
  .narrative{border:1px solid #000;padding:8px;white-space:pre-wrap}
  @media print{ body{padding:0} }
</style></head><body>

<h1 class="title">Incident Investigation Report</h1>
<p class="sub">HPGRDC.</p>

<table>
  <tr><th style="width:30%">Incident Title</th><td colspan="6">${esc(inv.incidentTitle)}</td></tr>
  <tr><th>Classification</th>${classCells}</tr>
  <tr><th>Numbers</th><td colspan="6">${esc(inv.numbers)}</td></tr>
  <tr><th>Details of Injured</th>
    <td colspan="2" style="text-align:center;font-weight:600">Company Employees</td>
    <td colspan="2" style="text-align:center;font-weight:600">Contractor Employees</td>
    <td colspan="2" style="text-align:center;font-weight:600">Visitors</td></tr>
  <tr><th>Numbers</th>
    <td colspan="2" style="text-align:center">${inv.injured.company}</td>
    <td colspan="2" style="text-align:center">${inv.injured.contractor}</td>
    <td colspan="2" style="text-align:center">${inv.injured.visitors}</td></tr>
</table>

<table>
  <tr><th style="width:30%">Name of Injured Person</th><td>${esc(inv.injuredName)}</td><th style="width:18%">Age / Sex of IP</th><td>${esc(inv.ageSex)}</td></tr>
  <tr><th>Ticket no. / Department</th><td>${esc(inv.ticketDept)}</td><th>Company / Contractor</th><td>${esc(inv.companyContractor)}</td></tr>
  <tr><th>Nature of Injury</th><td colspan="3">${esc(inv.natureOfInjury)}</td></tr>
  <tr><th>Incident Reported by</th><td colspan="3">${esc(inv.reportedBy)}</td></tr>
</table>

<table>
  <tr><th style="width:30%">Location of Incident</th><td>${esc(inv.location)}</td><th style="width:18%">Incident Number</th><td>${esc(inv.incidentNumber)}</td></tr>
  <tr><th>Date of Incident</th><td>${esc(inv.dateOfIncident)}</td><th>Time of Incident</th><td>${esc(inv.timeOfIncident)}</td></tr>
  <tr><th>Incident Investigation Initiated</th><td>${esc(inv.investigationInitiated)}</td><th>Report Submission</th><td>${esc(inv.reportSubmission)}</td></tr>
  <tr><th>List of Records Reviewed</th><td>${(inv.recordsReviewed||[]).map(esc).join('<br/>')}</td>
      <th>List of Persons Interacted</th><td>${(inv.personsInteracted||[]).map(esc).join('<br/>')}</td></tr>
</table>

<p><b>Any incident reported earlier in similar situation:</b> ${inv.priorSimilar.occurred ? 'Yes — ' + esc(inv.priorSimilar.notes) : 'No'}</p>

<h2>Summary of Incident</h2>
<div class="narrative">${nl2br(inv.summary)}</div>

<h2>Chronology of Events</h2>
${chronologyRows}

<h2>List of Facts collected during Investigation</h2>
${factRows}

<h2>WHY Tree Analysis</h2>
${whyTree}

<h2>Key Factors Identified</h2>
${kfBlock('SYSTEM FACTORS', report.keyFactors.system)}
${kfBlock('HUMAN FACTORS', report.keyFactors.human)}
${kfBlock('PHYSICAL FACTORS', report.keyFactors.physical)}

<h2>Systems that needs to be Reinforced</h2>
<table>
  <tr><th style="width:42px">Sr No.</th><th>System</th><th>Deficiency</th></tr>
  ${sysRows}
</table>

<h2>Recommendations</h2>
<table>
  <tr><th style="width:42px">Sr No.</th><th>Recommendation</th><th style="width:18%">Responsibility</th><th style="width:14%">Target Date</th><th style="width:20%">Implementation to be Verified by</th></tr>
  ${recRows}
</table>

<h2>Incident Investigation Completion</h2>
<div class="completion">
  <div>Prepared by: ${esc(inv.preparedBy || '')}</div>
  <div>Reviewed &amp; Approved by: ${esc(inv.approvedBy || '')}</div>
</div>

<h2>Supporting Photographs:</h2>
${(inv.photographs||[]).length ? `<div class="photos">${photoBlock}</div>` : `<div class="empty-photos"></div>`}

</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Incident-Investigation-Report-${inv.id}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
