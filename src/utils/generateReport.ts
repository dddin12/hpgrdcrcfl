import { Investigation } from '@/types/investigation';

const causeTree = [
  { label: 'HPLC Pump Failure & Solvent Leak', type: 'EFFECT' },
  { label: 'Pump seal cracked', type: 'IMMEDIATE CAUSE' },
  { label: 'Seal exceeded service life', type: 'CONTRIBUTING' },
  { label: 'PM schedule not followed (SOP-MAINT-005)', type: 'ROOT CAUSE' },
  { label: 'No CMMS automated alerts', type: 'ROOT CAUSE' },
];

const fiveWhys = [
  { q: 'Why did the HPLC pump fail?', a: 'The pump seal degraded and cracked, allowing solvent to leak.' },
  { q: 'Why did the pump seal degrade?', a: 'The seal exceeded its service life without replacement.' },
  { q: 'Why was the seal not replaced on schedule?', a: 'The preventive maintenance task was overdue by 3 weeks.' },
  { q: 'Why was preventive maintenance overdue?', a: 'The maintenance tracking system had no automated alerts configured.' },
  { q: 'Why were automated alerts not configured?', a: 'The CMMS implementation did not include alert setup for lab-specific equipment per SOP-MAINT-005.' },
];

const correctiveActions = [
  { id: 'CA-001', desc: 'Configure automated PM alerts in CMMS for all HPLC systems', priority: 'HIGH', assignee: 'Maintenance Lead', due: '2026-03-12' },
  { id: 'CA-002', desc: 'Replace pump seals on all Agilent 1260 units in Lab B', priority: 'HIGH', assignee: 'Service Engineer', due: '2026-03-13' },
  { id: 'CA-003', desc: 'Review and update batch pressure parameters', priority: 'MEDIUM', assignee: 'Dr. Sarah Chen', due: '2026-03-15' },
  { id: 'CA-004', desc: 'Conduct refresher training on HPLC pre-run inspection', priority: 'MEDIUM', assignee: 'Lab Manager', due: '2026-03-20' },
  { id: 'CA-005', desc: 'Stock critical spare parts in lab inventory', priority: 'LOW', assignee: 'Procurement', due: '2026-03-25' },
];

export async function generateInvestigationReport(investigation: Investigation): Promise<void> {
  // Build an HTML document for printing as PDF
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>RCFA Investigation Report — ${investigation.id}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; line-height: 1.6; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #d4a017; padding-bottom: 20px; margin-bottom: 30px; }
  .header-left { display: flex; align-items: center; gap: 16px; }
  .header img { height: 60px; }
  .header-divider { width: 1px; height: 50px; background: #ccc; }
  .header-title { text-align: right; }
  .header-title h1 { font-size: 22px; color: #1a1a2e; }
  .header-title p { font-size: 11px; color: #666; letter-spacing: 2px; text-transform: uppercase; }
  .section { margin-bottom: 28px; page-break-inside: avoid; }
  .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #d4a017; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; margin-bottom: 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field { background: #f8f8f8; border-radius: 6px; padding: 12px; }
  .field-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; font-weight: 600; }
  .field-value { font-size: 14px; margin-top: 4px; font-weight: 500; }
  .full-width { grid-column: 1 / -1; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #1a1a2e; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f8f8f8; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-high { background: #fee2e2; color: #dc2626; }
  .badge-medium { background: #fef3c7; color: #d97706; }
  .badge-low { background: #dbeafe; color: #2563eb; }
  .risk-box { background: #1a1a2e; color: #fff; border-radius: 8px; padding: 20px; text-align: center; }
  .risk-score { font-size: 48px; font-weight: 800; color: #ef4444; }
  .risk-label { font-size: 12px; color: #aaa; text-transform: uppercase; letter-spacing: 2px; }
  .why-item { display: flex; gap: 12px; margin-bottom: 12px; }
  .why-num { width: 28px; height: 28px; border-radius: 50%; background: #d4a017; color: #1a1a2e; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; }
  .why-content { flex: 1; }
  .why-q { font-weight: 600; font-size: 13px; }
  .why-a { font-size: 13px; color: #555; margin-top: 2px; }
  .cause-item { padding: 8px 12px; border-left: 3px solid #d4a017; background: #f8f8f8; margin-bottom: 8px; border-radius: 0 6px 6px 0; }
  .cause-type { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #888; }
  .cause-label { font-size: 13px; font-weight: 500; margin-top: 2px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e5e5; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #888; }
  .footer img { height: 30px; }
  @media print { body { padding: 20px; } .section { page-break-inside: avoid; } }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <img src="/images/hp-logo.png" alt="HP">
      <div class="header-divider"></div>
      <img src="/images/rnd-logo.png" alt="R&D">
    </div>
    <div class="header-title">
      <h1>Investigation Report</h1>
      <p>Root Cause Failure Analysis</p>
      <p style="font-size:14px; color:#1a1a2e; font-weight:600; letter-spacing:0; text-transform:none; margin-top:4px;">${investigation.id}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Incident Details</div>
    <div class="grid">
      <div class="field"><div class="field-label">Lab Name</div><div class="field-value">${investigation.labName}</div></div>
      <div class="field"><div class="field-label">Equipment</div><div class="field-value">${investigation.equipment}</div></div>
      <div class="field"><div class="field-label">Operator</div><div class="field-value">${investigation.operator}</div></div>
      <div class="field"><div class="field-label">Date & Time</div><div class="field-value">${new Date(investigation.dateTime).toLocaleString()}</div></div>
      <div class="field"><div class="field-label">Severity</div><div class="field-value" style="text-transform:uppercase;">${investigation.severity}</div></div>
      <div class="field"><div class="field-label">Status</div><div class="field-value" style="text-transform:uppercase;">${investigation.status}</div></div>
      <div class="field full-width"><div class="field-label">Description</div><div class="field-value">${investigation.description}</div></div>
      <div class="field full-width"><div class="field-label">Immediate Response</div><div class="field-value">${investigation.immediateResponse}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">5 Whys Analysis</div>
    ${fiveWhys.map((w, i) => `
      <div class="why-item">
        <div class="why-num">${i + 1}</div>
        <div class="why-content">
          <div class="why-q">${w.q}</div>
          <div class="why-a">${w.a}</div>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">Cause Hierarchy</div>
    ${causeTree.map(c => `
      <div class="cause-item">
        <div class="cause-type">${c.type}</div>
        <div class="cause-label">${c.label}</div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">Risk Assessment</div>
    <div style="display:flex;gap:20px;">
      <div class="risk-box" style="flex:1;">
        <div class="risk-label">Risk Score</div>
        <div class="risk-score">${investigation.riskScore ?? 16}</div>
        <div style="font-size:12px;color:#aaa;margin-top:4px;">Severity 4 × Likelihood 4</div>
      </div>
      <div class="risk-box" style="flex:1;">
        <div class="risk-label">Risk Level</div>
        <div style="font-size:20px;font-weight:700;color:#ef4444;margin-top:8px;">HIGH</div>
        <div style="font-size:12px;color:#aaa;margin-top:4px;">Immediate Action Required</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Corrective Actions</div>
    <table>
      <thead><tr><th>ID</th><th>Action</th><th>Priority</th><th>Assignee</th><th>Due Date</th></tr></thead>
      <tbody>
        ${correctiveActions.map(a => `
          <tr>
            <td style="font-family:monospace;">${a.id}</td>
            <td>${a.desc}</td>
            <td><span class="badge badge-${a.priority.toLowerCase()}">${a.priority}</span></td>
            <td>${a.assignee}</td>
            <td>${a.due}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div>
      <img src="/images/hp-logo.png" alt="HP">
    </div>
    <div style="text-align:center;">
      <p>CONFIDENTIAL — Hindustan Petroleum Corporation Limited</p>
      <p>HP Green R&D Centre — Root Cause Failure Analysis Report</p>
    </div>
    <div>
      <img src="/images/rnd-logo.png" alt="R&D">
    </div>
  </div>

  <div style="text-align:center;margin-top:20px;font-size:10px;color:#aaa;">
    Generated on ${new Date().toLocaleString()} | RCFA Investigation System
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}
