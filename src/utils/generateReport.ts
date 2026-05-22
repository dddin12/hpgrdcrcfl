import { Investigation, RcfaReport } from '@/types/investigation';
import hpLogoUrl from '@/assets/hp-logo.png';
import rndLogoUrl from '@/assets/rnd-logo.png';

async function toBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderActions(actions: RcfaReport['correctiveActions']): string {
  if (!actions?.length) return '<p style="font-size:13px;color:#888;">None specified.</p>';
  return `<table>
    <thead><tr><th>#</th><th>Action</th><th>Priority</th><th>Owner</th><th>Due</th></tr></thead>
    <tbody>${actions.map((a, i) => `
      <tr>
        <td style="font-family:monospace;">${i + 1}</td>
        <td>${esc(a.description)}</td>
        <td>${a.priority ? `<span class="badge badge-${a.priority}">${a.priority.toUpperCase()}</span>` : '—'}</td>
        <td>${esc(a.owner || '—')}</td>
        <td>${esc(a.dueWindow || '—')}</td>
      </tr>`).join('')}
    </tbody></table>`;
}

function renderList(items: string[]): string {
  if (!items?.length) return '<p style="font-size:13px;color:#888;">None identified.</p>';
  return `<ul style="margin-left:18px;font-size:13px;">${items.map(i => `<li style="margin-bottom:4px;">${esc(i)}</li>`).join('')}</ul>`;
}

export async function generateInvestigationReport(investigation: Investigation, report: RcfaReport): Promise<void> {
  const [hpLogo, rndLogo] = await Promise.all([toBase64(hpLogoUrl), toBase64(rndLogoUrl)]);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>RCFA Investigation Report — ${esc(investigation.id)}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;padding:40px;line-height:1.6}
  .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #d4a017;padding-bottom:20px;margin-bottom:30px}
  .header-left{display:flex;align-items:center;gap:16px}
  .header-logo{height:48px;width:auto}
  .header-right{display:flex;align-items:center;gap:16px}
  .section{margin-bottom:28px;page-break-inside:avoid}
  .section-title{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#d4a017;border-bottom:1px solid #e5e5e5;padding-bottom:6px;margin-bottom:14px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .field{background:#f8f8f8;border-radius:6px;padding:12px}
  .field-label{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#888;font-weight:600}
  .field-value{font-size:14px;margin-top:4px;font-weight:500}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#1a1a2e;color:#fff;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px}
  td{padding:10px 12px;border-bottom:1px solid #eee;vertical-align:top}
  tr:nth-child(even){background:#f8f8f8}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600}
  .badge-high{background:#fee2e2;color:#dc2626}
  .badge-medium{background:#fef3c7;color:#d97706}
  .badge-low{background:#dbeafe;color:#2563eb}
  .risk-box{background:#1a1a2e;color:#fff;border-radius:8px;padding:20px}
  .risk-label{font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:2px}
  .risk-value{font-size:15px;color:#fff;margin-top:8px;font-weight:600;line-height:1.4}
  .why-item{display:flex;gap:12px;margin-bottom:12px}
  .why-num{width:28px;height:28px;border-radius:50%;background:#d4a017;color:#1a1a2e;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0}
  .why-q{font-weight:600;font-size:13px}
  .why-a{font-size:13px;color:#555;margin-top:2px}
  .fish-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .fish-cell{background:#f8f8f8;border-left:3px solid #d4a017;padding:10px 12px;border-radius:0 6px 6px 0}
  .fish-name{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#1a1a2e;margin-bottom:4px}
  .fish-list{font-size:12px;color:#444;margin-left:14px}
  .barrier-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .barrier-cell{padding:10px 12px;border-radius:6px}
  .barrier-existing{background:#ecfdf5;border:1px solid #a7f3d0}
  .barrier-failed{background:#fef2f2;border:1px solid #fecaca}
  .barrier-missing{background:#fffbeb;border:1px solid #fde68a}
  .timeline-item{padding:8px 12px;border-left:2px solid #d4a017;margin-bottom:6px;background:#f8f8f8}
  .timeline-time{font-size:11px;font-weight:600;color:#d4a017}
  .footer{margin-top:40px;padding-top:20px;border-top:2px solid #e5e5e5;display:flex;align-items:center;justify-content:space-between}
  .footer-logos{display:flex;align-items:center;gap:12px}
  .footer-logos img{height:24px;width:auto;opacity:.6}
  .footer-text{text-align:right;font-size:11px;color:#888}
  @media print{body{padding:20px}.section{page-break-inside:avoid}}
</style></head><body>
<div class="header">
  <div class="header-left">
    <img src="${hpLogo}" alt="HP Logo" class="header-logo"/>
    <div>
      <h1 style="font-size:22px;color:#1a1a2e;">RCFA Investigation Report</h1>
      <p style="font-size:11px;color:#666;letter-spacing:2px;text-transform:uppercase;">Root Cause Failure Analysis${report.generatedBy === 'template' ? ' — Template Draft' : ''}</p>
    </div>
  </div>
  <div class="header-right">
    <div style="text-align:right;">
      <p style="font-size:14px;color:#1a1a2e;font-weight:600;">${esc(investigation.id)}</p>
      <p style="font-size:11px;color:#666;">Generated ${new Date().toLocaleDateString()}</p>
    </div>
    <img src="${rndLogo}" alt="RnD Logo" class="header-logo"/>
  </div>
</div>

<div class="section">
  <div class="section-title">Incident Details</div>
  <div class="grid">
    <div class="field"><div class="field-label">Lab Name</div><div class="field-value">${esc(investigation.labName)}</div></div>
    <div class="field"><div class="field-label">Equipment</div><div class="field-value">${esc(investigation.equipment)}</div></div>
    <div class="field"><div class="field-label">Operator</div><div class="field-value">${esc(investigation.operator)}</div></div>
    <div class="field"><div class="field-label">Date & Time</div><div class="field-value">${new Date(investigation.dateTime).toLocaleString()}</div></div>
    <div class="field"><div class="field-label">Severity</div><div class="field-value" style="text-transform:uppercase;">${esc(investigation.severity)}</div></div>
    <div class="field"><div class="field-label">Status</div><div class="field-value" style="text-transform:uppercase;">${esc(investigation.status)}</div></div>
  </div>
</div>

<div class="section"><div class="section-title">1. Incident Summary</div><p style="font-size:13px;">${esc(report.incidentSummary)}</p></div>

<div class="section"><div class="section-title">2. Chronology of Events</div>
${report.chronology.map(c => `<div class="timeline-item">${c.time ? `<div class="timeline-time">${esc(c.time)}</div>` : ''}<div style="font-size:13px;">${esc(c.event)}</div></div>`).join('')}
</div>

<div class="section"><div class="section-title">3. Immediate Cause</div>
<p style="font-size:13px;background:#fef3c7;padding:12px;border-left:3px solid #d97706;border-radius:0 6px 6px 0;">${esc(report.immediateCause)}</p>
</div>

<div class="section"><div class="section-title">4. 5 Whys Analysis</div>
${report.fiveWhys.map((w, i) => `<div class="why-item"><div class="why-num">${i + 1}</div><div><div class="why-q">${esc(w.why)}</div><div class="why-a">${esc(w.because)}</div></div></div>`).join('')}
</div>

<div class="section"><div class="section-title">5. Fishbone Analysis (6M)</div>
<div class="fish-grid">
${(['man','machine','method','material','measurement','environment'] as const).map(k => `<div class="fish-cell"><div class="fish-name">${k}</div><ul class="fish-list">${(report.fishbone[k] || []).map(x => `<li>${esc(x)}</li>`).join('') || '<li style="color:#888;">—</li>'}</ul></div>`).join('')}
</div></div>

<div class="section"><div class="section-title">6. Key Factors Identified</div>
<div class="grid">
${(['human','system','physical','organizational'] as const).map(k => `<div class="field"><div class="field-label">${k} factors</div>${renderList(report.keyFactors[k] || [])}</div>`).join('')}
</div></div>

<div class="section"><div class="section-title">7. Barrier Failure Analysis</div>
<div class="barrier-grid">
  <div class="barrier-cell barrier-existing"><div class="field-label" style="color:#047857;">Existing</div>${renderList(report.barriers.existing)}</div>
  <div class="barrier-cell barrier-failed"><div class="field-label" style="color:#b91c1c;">Failed</div>${renderList(report.barriers.failed)}</div>
  <div class="barrier-cell barrier-missing"><div class="field-label" style="color:#b45309;">Missing</div>${renderList(report.barriers.missing)}</div>
</div></div>

<div class="section"><div class="section-title">8. Risk Assessment</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
  <div class="risk-box"><div class="risk-label">Severity</div><div class="risk-value">${esc(report.riskAssessment.severity)}</div></div>
  <div class="risk-box"><div class="risk-label">Likelihood</div><div class="risk-value">${esc(report.riskAssessment.likelihood)}</div></div>
  <div class="risk-box"><div class="risk-label">Escalation Potential</div><div class="risk-value">${esc(report.riskAssessment.escalation)}</div></div>
</div></div>

<div class="section"><div class="section-title">9. Corrective Actions</div>${renderActions(report.correctiveActions)}</div>
<div class="section"><div class="section-title">10. Preventive Actions</div>${renderActions(report.preventiveActions)}</div>
<div class="section"><div class="section-title">11. Lessons Learned</div>${renderList(report.lessonsLearned)}</div>

${report.assumptions?.length ? `<div class="section"><div class="section-title">Assumptions / Information Gaps</div>${renderList(report.assumptions)}</div>` : ''}

<div class="footer">
  <div class="footer-logos"><img src="${hpLogo}" alt="HP"/><img src="${rndLogo}" alt="RnD"/></div>
  <div class="footer-text"><p>CONFIDENTIAL — Root Cause Failure Analysis Report</p><p>Generated on ${new Date().toLocaleString()} | RCFA Investigation System</p></div>
</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `RCFA-Report-${investigation.id}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}