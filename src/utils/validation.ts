/**
 * Lightweight heuristic to flag likely gibberish / placeholder text
 * (e.g. "hggg", "bg7887u", "asdf", random key-mashes) in user-entered rows.
 *
 * Returns true when the string looks invalid. Empty strings are considered valid
 * here — callers filter those separately.
 */
// Only unambiguous placeholders. Whole-string match only (not per-token),
// so real engineering words like "test", "bar", "temp" remain valid in context.
const BLOCKLIST = new Set([
  'dummy','asdf','qwerty','hggg','xxxx','xxx','tbd','lorem','abcd','1234','12345','aaaa','zzzz',
]);

// Technical acronyms / units that are allowed even without vowels.
const TECH_ALLOWLIST = new Set([
  'SOP','SMP','MOC','PSSR','HPGRDC','HPCL','RND','ETC','FCU','FCS','CCU','CAHU','AHU',
  'HMI','ICS','VFD','SPARC','STARS','MCB','EBP','BAR','KG','RPM','KW','LPH','SLPH',
  'ON','OFF','DEGC','NA','NM','PFE','LWC','RWC','MTC','FAC','PPE','HSE','LOTO',
]);

const MEASUREMENT_RE = /\b\d+(?:\.\d+)?\s*(?:bar|kg|kw|rpm|lph|slph|deg\s?c|°c)\b/i;
const SOP_PHRASE_RE = /^(sop requires|manual states|equipment manual|as per sop|as per checklist|as per manual)\b/i;

function normalizeToken(tok: string): string {
  let s = tok.toUpperCase();
  // R&D -> RND before stripping non-alphanumerics
  s = s.replace(/R\s*&\s*D/g, 'RND');
  s = s.replace(/&/g, '');
  s = s.replace(/[^A-Z0-9]/g, '');
  s = s.replace(/\d+$/g, ''); // strip trailing digits (ETC-1 -> ETC)
  return s;
}

export interface GibberishResult { invalid: boolean; reason?: string; }

export function checkGibberish(s: string): GibberishResult {
  const t = (s || '').trim();
  if (!t) return { invalid: false };

  // Whole-string placeholder check
  if (BLOCKLIST.has(t.toLowerCase())) {
    return { invalid: true, reason: `Placeholder word "${t}"` };
  }

  if (t.length < 4) return { invalid: true, reason: 'Too short' };

  // Multi-word / measurement / SOP-phrase fast paths
  const tokens = t.split(/\s+/);
  const allLetters = t.replace(/[^a-zA-Z]/g, '');
  const vowels = (allLetters.match(/[aeiouAEIOU]/g) || []).length;

  if (MEASUREMENT_RE.test(t)) return { invalid: false };
  if (SOP_PHRASE_RE.test(t)) return { invalid: false };
  if (tokens.length >= 3 && vowels >= 1) return { invalid: false };

  // Token-level vowel-less rule, with allowlist + numeric bypass.
  for (const tok of tokens) {
    const norm = normalizeToken(tok);
    if (!norm) continue;                  // pure-numeric or punctuation token
    if (TECH_ALLOWLIST.has(norm)) continue;
    const letters = tok.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 6) {
      const v = (letters.match(/[aeiouAEIOU]/g) || []).length;
      if (v === 0) return { invalid: true, reason: `Random key-mash (no vowels) in "${tok}"` };
    }
  }

  const hasSpace = /\s/.test(t);
  if (hasSpace && vowels >= 1) return { invalid: false };

  // Single-token strict rules
  if (!hasSpace) {
    const norm = normalizeToken(t);
    if (TECH_ALLOWLIST.has(norm)) return { invalid: false };
    if (t.length < 6) return { invalid: true, reason: 'Too short' };
    if (allLetters.length === 0) return { invalid: true, reason: 'No letters' };
    if (vowels / allLetters.length < 0.2) return { invalid: true, reason: 'Too few vowels' };
    if (/(.)\1{2,}/.test(t)) return { invalid: true, reason: 'Repeated characters' };
  }

  return { invalid: false };
}

export function isLikelyGibberish(s: string): boolean {
  return checkGibberish(s).invalid;
}

export interface InvalidRow { section: string; index: number; text: string; reason: string; key: string; }

export function findInvalidRows(input: {
  chronology: { time?: string; event: string }[];
  facts: string[];
  recordsReviewed: string[];
  personsInteracted: string[];
}): InvalidRow[] {
  const out: InvalidRow[] = [];
  const push = (section: string, i: number, text: string) => {
    const r = checkGibberish(text);
    if (r.invalid) out.push({ section, index: i + 1, text, reason: r.reason || 'Invalid', key: `${section}:${i}:${text}` });
  };
  input.chronology.forEach((c, i) => push('Chronology', i, c.event));
  input.facts.forEach((f, i) => push('Facts', i, f));
  input.recordsReviewed.forEach((r, i) => push('Records Reviewed', i, r));
  input.personsInteracted.forEach((p, i) => push('Persons Interacted', i, p));
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