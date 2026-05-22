import type { Investigation, SopExcerpt } from '@/types/investigation';
import { mockInvestigations } from './mockData';

const KEY = 'rcfa.investigations.v1';

type StoredInvestigation = Investigation & { sopExcerpts?: SopExcerpt[] };

function readAll(): StoredInvestigation[] {
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

function writeAll(items: StoredInvestigation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('investigationStore write failed', e);
  }
}

export function saveInvestigation(inv: StoredInvestigation): StoredInvestigation {
  const items = readAll();
  const idx = items.findIndex(i => i.id === inv.id);
  if (idx >= 0) items[idx] = inv;
  else items.unshift(inv);
  writeAll(items);
  return inv;
}

export function getInvestigation(id: string | undefined): StoredInvestigation | undefined {
  if (!id) return undefined;
  const items = readAll();
  return items.find(i => i.id === id) || (mockInvestigations as StoredInvestigation[]).find(i => i.id === id);
}

export function listInvestigations(): StoredInvestigation[] {
  const stored = readAll();
  const mockOnly = (mockInvestigations as StoredInvestigation[]).filter(m => !stored.some(s => s.id === m.id));
  return [...stored, ...mockOnly];
}

export function newInvestigationId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${year}-${rand}`;
}

export function riskScoreFromSeverity(sev: Investigation['severity']): number {
  switch (sev) {
    case 'low': return 4;
    case 'medium': return 9;
    case 'high': return 16;
    case 'critical': return 25;
    default: return 0;
  }
}