import type { HpgrdcInvestigation, HpgrdcAiReport, AiQuestion, AiMissingCheck } from '@/types/investigation';

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

/** Quick non-cryptographic content fingerprint (fnv-1a-ish, 32-bit hex). */
function shortHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Canonical JSON of user-entered fields + attachment content hashes. */
function canonicalInputs(inv: HpgrdcInvestigation): string {
  const photos = (inv.photographs || [])
    .map(p => ({ name: p.name, hash: shortHash(p.dataUrl || '') }))
    .sort((a, b) => (a.name + a.hash).localeCompare(b.name + b.hash));
  const sops = (inv.sopExcerpts || [])
    .map(s => ({ name: s.name, hash: shortHash(JSON.stringify(s.pages || [])) }))
    .sort((a, b) => (a.name + a.hash).localeCompare(b.name + b.hash));
  const o = {
    incidentTitle: inv.incidentTitle, classification: inv.classification, numbers: inv.numbers,
    nm: inv.nm, pfe: inv.pfe,
    injured: inv.injured, injuredName: inv.injuredName, ageSex: inv.ageSex,
    ticketDept: inv.ticketDept, companyContractor: inv.companyContractor,
    natureOfInjury: inv.natureOfInjury, reportedBy: inv.reportedBy,
    labName: inv.labName || '', suspectedCause: inv.suspectedCause || '',
    correctiveActionTaken: inv.correctiveActionTaken || '',
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

async function sha1(txt: string): Promise<string> {
  const enc = new TextEncoder().encode(txt);
  const buf = await crypto.subtle.digest('SHA-1', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Stage 1+2 cache key — inputs + SOPs + photos only. */
export async function computeQuestionsHash(inv: HpgrdcInvestigation): Promise<string> {
  return sha1(canonicalInputs(inv));
}

/** Stage 4 cache key — inputs + answers + missing-check responses + categories. */
export async function computeInputHash(inv: HpgrdcInvestigation): Promise<string> {
  const answers = (inv.aiQuestions || []).map(q => ({ id: q.id, a: q.answer || '', s: q.status || '' }));
  const checks = (inv.aiMissingChecks || []).map(m => ({ id: m.id, s: m.status || '', r: m.response || '' }));
  const cats = [...(inv.recommendationCategories || [])].sort();
  return sha1(canonicalInputs(inv) + '|' + JSON.stringify({ answers, checks, cats }));
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

export function storeAiQuestions(
  inv: HpgrdcInvestigation,
  questions: AiQuestion[],
  missingChecks: AiMissingCheck[],
  hash: string,
): HpgrdcInvestigation {
  // Preserve previous answers/statuses where IDs match
  const prevQ = new Map((inv.aiQuestions || []).map(q => [q.id, q]));
  const prevM = new Map((inv.aiMissingChecks || []).map(m => [m.id, m]));
  const mergedQ = questions.map(q => ({ ...q, answer: prevQ.get(q.id)?.answer, status: prevQ.get(q.id)?.status }));
  const mergedM = missingChecks.map(m => ({ ...m, status: prevM.get(m.id)?.status, response: prevM.get(m.id)?.response }));
  const next: HpgrdcInvestigation = {
    ...inv, aiQuestions: mergedQ, aiMissingChecks: mergedM, questionsInputHash: hash,
  };
  saveInvestigation(next);
  return next;
}

export function patchInvestigation(inv: HpgrdcInvestigation, patch: Partial<HpgrdcInvestigation>): HpgrdcInvestigation {
  const next = { ...inv, ...patch };
  saveInvestigation(next);
  return next;
}

/**
 * Persist a manually edited AI report. Does NOT update aiInputHash,
 * so the "inputs changed — regenerate" warning continues to reflect
 * whether the underlying investigation inputs (not the edits) changed.
 */
export function updateAiReport(inv: HpgrdcInvestigation, report: HpgrdcAiReport): HpgrdcInvestigation {
  const next: HpgrdcInvestigation = { ...inv, aiReport: { ...report } };
  saveInvestigation(next);
  return next;
}