import type { HpgrdcInvestigation, HpgrdcAiReport } from '@/types/investigation';

const KEY = 'hpgrdc.investigations.v2';

function readAll(): HpgrdcInvestigation[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: HpgrdcInvestigation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('investigationStore write failed', e);
  }
}

export function saveInvestigation(inv: HpgrdcInvestigation): HpgrdcInvestigation {
  const items = readAll();
  const idx = items.findIndex(i => i.id === inv.id);
  if (idx >= 0) items[idx] = inv;
  else items.unshift(inv);
  writeAll(items);
  return inv;
}

export function getInvestigation(id: string | undefined): HpgrdcInvestigation | undefined {
  if (!id) return undefined;
  const items = readAll();
  return items.find(i => i.id === id);
}

export function listInvestigations(): HpgrdcInvestigation[] {
  return readAll();
}

export function newInvestigationId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `HPGRDC-${year}-${rand}`;
}

/** Canonical JSON of user-entered fields + attachment names for cache hash. */
function canonicalInputs(inv: HpgrdcInvestigation): string {
  const photos = (inv.photographs || []).map(p => p.name).sort();
  const sops = (inv.sopExcerpts || []).map(s => s.name).sort();
  const o = {
    incidentTitle: inv.incidentTitle, classification: inv.classification, numbers: inv.numbers,
    injured: inv.injured, injuredName: inv.injuredName, ageSex: inv.ageSex,
    ticketDept: inv.ticketDept, companyContractor: inv.companyContractor,
    natureOfInjury: inv.natureOfInjury, reportedBy: inv.reportedBy,
    location: inv.location, incidentNumber: inv.incidentNumber,
    dateOfIncident: inv.dateOfIncident, timeOfIncident: inv.timeOfIncident,
    investigationInitiated: inv.investigationInitiated, reportSubmission: inv.reportSubmission,
    recordsReviewed: inv.recordsReviewed, personsInteracted: inv.personsInteracted,
    priorSimilar: inv.priorSimilar,
    summary: inv.summary, chronology: inv.chronology, facts: inv.facts,
    photos, sops,
  };
  return JSON.stringify(o);
}

export async function computeInputHash(inv: HpgrdcInvestigation): Promise<string> {
  const txt = canonicalInputs(inv);
  const enc = new TextEncoder().encode(txt);
  const buf = await crypto.subtle.digest('SHA-1', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function storeAiReport(inv: HpgrdcInvestigation, report: HpgrdcAiReport): HpgrdcInvestigation {
  const history = inv.aiHistory || [];
  if (inv.aiReport) history.unshift(inv.aiReport);
  const next: HpgrdcInvestigation = {
    ...inv, aiReport: report, aiInputHash: report.inputHash,
    aiHistory: history.slice(0, 10),
  };
  saveInvestigation(next);
  return next;
}