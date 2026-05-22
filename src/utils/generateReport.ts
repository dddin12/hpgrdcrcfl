import { SYSTEMS_TO_REINFORCE } from '@/types/investigation';
import type { HpgrdcInvestigation, HpgrdcAiReport } from '@/types/investigation';
import { formatChronologyLine } from '@/utils/validation';
import hpLogoUrl from '@/assets/hp-logo.png';
import rndLogoUrl from '@/assets/rnd-logo.png';

const esc = (s: unknown) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const nl2br = (s: string) => esc(s).replace(/\n/g, '<br/>');

async function toDataUrl(url: string): Promise<string> {
  try {
    const r = await fetch(url);
    const b = await r.blob();
    return await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = rej;
      fr.readAsDataURL(b);
    });
  } catch { return ''; }
}

function listBlock(items: string[] | undefined): string {
  const arr = (items || []).map(s => (s || '').trim()).filter(Boolean);
  if (!arr.length) return '';
  return arr.map(x => `<div class="row-line">${esc(x)}</div>`).join('');
}

export async function generateInvestigationReport(inv: HpgrdcInvestigation, report: HpgrdcAiReport): Promise<void> {
  const CLASSES = ['FATAL','LWC','RWC','MTC','FAC','NM','PFE'] as const;
  const classHeader = CLASSES.map(c =>
    `<th class="cls ${inv.classification===c?'sel':''}">${c}</th>`).join('');
  const classValueRow = CLASSES.map(c => {
    let val = '';
    if (c === 'NM') val = inv.nm || '';
    else if (c === 'PFE') val = inv.pfe || '';
    const selCls = inv.classification === c ? 'sel' : '';
    return `<td class="cls-sub ${selCls}">${esc(val)}</td>`;
  }).join('');

  const hpLogo = await toDataUrl(hpLogoUrl);
  const rndLogo = await toDataUrl(rndLogoUrl);

  const sysRows = SYSTEMS_TO_REINFORCE.map((sys, i) => {
    const m = (report.systemsToReinforce||[]).find(s => (s.system||'').trim().toLowerCase() === sys.toLowerCase());
    const def = (m?.deficiency || '').trim();
    return `<tr><td class="num">${i+1}</td><td>${esc(sys)}</td><td>${esc(def)}</td></tr>`;
  }).join('');

  const recRows = (report.recommendations||[]).map((r, i) =>
    `<tr><td class="num">${i+1}</td><td>${esc(r.recommendation)}</td><td>${esc(r.responsibility||'')}</td><td>${esc(r.targetDate||'')}</td><td>${esc(r.verifiedBy||'')}</td></tr>`).join('')
    || `<tr><td colspan="5" style="text-align:center;color:#666;">No recommendations.</td></tr>`;

  const chronList = (inv.chronology || [])
    .map(c => ({ time: (c.time || '').trim(), event: (c.event || '').trim() }))
    .filter(c => c.event || c.time);
  const chronologyRows = chronList.length
    ? `<ol class="chron">${chronList.map(c => `<li>${esc(formatChronologyLine(c.time, c.event))}</li>`).join('')}</ol>`
    : '<p style="color:#666;">—</p>';

  const factRows = inv.facts.length
    ? `<ol>${inv.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ol>`
    : '<p style="color:#666;">—</p>';

  const causeItems = [report.whyTree.cause.primary, report.whyTree.cause.secondary || ''].filter(Boolean);
  const whyLevel = (label: string, items: string[]) => {
    if (!items?.length) return '';
    const content = items.map(x => `<div class="why-item">${esc(x)}</div>`).join('');
    return `
      <div class="why-node">
        <div class="why-node-label">${label}</div>
        <div class="why-node-body">${content}</div>
      </div>
      <div class="why-connector"></div>`;
  };
  const whyTree = `
    <div class="why-tree">
      ${whyLevel('Effect', [report.whyTree.effect])}
      ${whyLevel('Cause', causeItems)}
      ${whyLevel('Why', report.whyTree.why || [])}
      ${whyLevel('Deeper Cause', report.whyTree.deeper || [])}
      ${whyLevel('Root Weakness', report.whyTree.rootWeakness || [])}
    </div>`.replace(/<div class="why-connector"><\/div>\s*<\/div>/, '</div>');

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
  .report-head{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:14px;gap:12px}
  .report-head img{height:54px;width:auto;object-fit:contain}
  .report-head .title-wrap{text-align:center;flex:1}
  h1.title{font-size:17pt;margin:0;font-weight:700;letter-spacing:.5px}
  .sub{font-size:12pt;font-weight:700;margin:2px 0 0 0}
  h2{font-size:11pt;font-weight:700;margin:18px 0 6px 0;text-transform:uppercase;letter-spacing:.5px}
  table{width:100%;border-collapse:collapse;margin-bottom:6px;table-layout:fixed}
  th,td{border:1px solid #000;padding:5px 7px;vertical-align:top;font-size:10.5pt;text-align:left;word-wrap:break-word;overflow-wrap:break-word}
  th{background:#eee;font-weight:700}
  td.num{width:42px;text-align:center;font-family:monospace}
  table.classification{table-layout:fixed}
  table.classification th.cls,table.classification td.cls-sub{text-align:center;padding:4px 2px;font-weight:700;width:14.28%;font-size:10pt}
  table.classification th.cls.sel{background:#000;color:#fff}
  table.classification td.cls-sub{background:#fff;font-weight:400;font-size:9.5pt;color:#000;min-height:18px;height:22px}
  table.classification td.cls-sub.sel{background:#000;color:#fff;font-weight:600}
  ol{margin:0 0 6px 22px;padding:0}
  ol li{margin-bottom:3px}
  ol.chron li{margin-bottom:4px;line-height:1.45}
  .row-line{padding:1px 0}
  .row-line + .row-line{border-top:1px dotted #999;margin-top:2px;padding-top:2px}
  .why-tree{display:flex;flex-direction:column;align-items:stretch;margin:4px 0 10px 0}
  .why-node{border:1px solid #000;background:#fff}
  .why-node-label{background:#000;color:#fff;text-align:center;font-size:9.5pt;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:3px 6px;border-bottom:1px solid #000}
  .why-node-body{padding:6px 8px;font-size:10pt;text-align:center}
  .why-item + .why-item{border-top:1px dotted #666;margin-top:4px;padding-top:4px}
  .why-connector{width:2px;height:14px;background:#000;margin:0 auto}
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

<div class="report-head">
  ${hpLogo ? `<img src="${hpLogo}" alt="HPCL"/>` : '<div style="width:54px"></div>'}
  <div class="title-wrap">
    <h1 class="title">Incident Investigation Report</h1>
    <p class="sub">HPGRDC.</p>
  </div>
  ${rndLogo ? `<img src="${rndLogo}" alt="HP Green R&amp;D Centre"/>` : '<div style="width:54px"></div>'}
</div>

<table>
  <tr><th style="width:30%">Incident Title</th><td colspan="6">${esc(inv.incidentTitle)}</td></tr>
  <tr><th>Numbers</th><td colspan="6">${esc(inv.numbers)}</td></tr>
  <tr><th>Details of Injured</th>
    <td colspan="2" style="text-align:center;font-weight:600">Company Employees</td>
    <td colspan="2" style="text-align:center;font-weight:600">Contractor Employees</td>
    <td colspan="2" style="text-align:center;font-weight:600">Visitors</td></tr>
  <tr><th>Persons</th>
    <td colspan="2" style="text-align:center">${inv.injured.company}</td>
    <td colspan="2" style="text-align:center">${inv.injured.contractor}</td>
    <td colspan="2" style="text-align:center">${inv.injured.visitors}</td></tr>
</table>

<table class="classification">
  <colgroup>${CLASSES.map(() => '<col style="width:14.28%"/>').join('')}</colgroup>
  <tr>${classHeader}</tr>
  <tr>${classValueRow}</tr>
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
  <tr><th>List of Records Reviewed</th><td>${listBlock(inv.recordsReviewed)}</td>
      <th>List of Persons Interacted</th><td>${listBlock(inv.personsInteracted)}</td></tr>
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
