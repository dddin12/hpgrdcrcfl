/**
 * Lightweight heuristic to flag likely gibberish / placeholder text
 * (e.g. "hggg", "bg7887u", "asdf", random key-mashes) in user-entered rows.
 *
 * Returns true when the string looks invalid. Empty strings are considered valid
 * here — callers filter those separately.
 */
export function isLikelyGibberish(s: string): boolean {
  const t = (s || '').trim();
  if (!t) return false;
  if (t.length < 4) return true;

  // Has whitespace AND at least one vowel — likely real text.
  const hasSpace = /\s/.test(t);
  const letters = t.replace(/[^a-zA-Z]/g, '');
  const vowels = (letters.match(/[aeiouAEIOU]/g) || []).length;

  if (hasSpace && vowels >= 2) return false;

  // Single-token (no spaces) — much stricter.
  if (!hasSpace) {
    if (t.length < 6) return true;
    if (letters.length === 0) return true;
    if (vowels / letters.length < 0.2) return true;
    // mixed letters+digits with no separator usually = junk
    if (/[a-zA-Z]/.test(t) && /\d/.test(t) && !/[\s\-_/.,:]/.test(t)) return true;
    // 3+ same letter in a row
    if (/(.)\1{2,}/.test(t)) return true;
  }

  return false;
}

export interface InvalidRow { section: string; index: number; text: string; }

export function findInvalidRows(input: {
  chronology: { time?: string; event: string }[];
  facts: string[];
  recordsReviewed: string[];
  personsInteracted: string[];
}): InvalidRow[] {
  const out: InvalidRow[] = [];
  input.chronology.forEach((c, i) => {
    if (isLikelyGibberish(c.event)) out.push({ section: 'Chronology', index: i + 1, text: c.event });
  });
  input.facts.forEach((f, i) => {
    if (isLikelyGibberish(f)) out.push({ section: 'Facts', index: i + 1, text: f });
  });
  input.recordsReviewed.forEach((r, i) => {
    if (isLikelyGibberish(r)) out.push({ section: 'Records Reviewed', index: i + 1, text: r });
  });
  input.personsInteracted.forEach((p, i) => {
    if (isLikelyGibberish(p)) out.push({ section: 'Persons Interacted', index: i + 1, text: p });
  });
  return out;
}

/** Merge chronology time + event into a natural sentence. */
export function formatChronologyLine(time: string | undefined, event: string): string {
  const ev = (event || '').trim();
  const tm = (time || '').trim();
  if (!ev) return tm;
  if (!tm) return ev;
  // If event already mentions the time, don't double it
  if (ev.toLowerCase().includes(tm.toLowerCase())) return ev;
  // If event starts with "At " already, keep as-is and prepend time differently
  if (/^at\s+/i.test(ev)) return ev;
  const first = ev.charAt(0);
  const rest = ev.slice(1);
  const lower = first.toLowerCase() + rest;
  return `At ${tm}, ${lower}`;
}