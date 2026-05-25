## Root cause

`src/utils/validation.ts` flags valid technical sentences because `BLOCKLIST` is checked **per token** and contains real engineering words (`test`, `bar`, `temp`). Token-level rules also reject legitimate acronyms (`HPGRDC`, `SPARC`, `PSSR`).

## Fix — only touches `src/utils/validation.ts` and `src/pages/NewInvestigation.tsx`. No AI flow, report, dashboard, or styling changes.

### 1. `src/utils/validation.ts`

- Trim `BLOCKLIST` to unambiguous placeholders only: `dummy, asdf, qwerty, hggg, xxxx, xxx, tbd, lorem, abcd, 1234, 12345, aaaa, zzzz`. **Remove `test`, `bar`, `temp`, `foo`, `baz`.**
- Apply BLOCKLIST **only when the entire trimmed string equals a blocklist word** (placeholder rows). Drop the per-token blocklist check.
- Add `TECH_ALLOWLIST` (uppercase) with: `SOP, SMP, MOC, PSSR, HPGRDC, HPCL, RND, ETC, FCU, FCS, CCU, CAHU, AHU, HMI, ICS, VFD, SPARC, STARS, MCB, EBP, BAR, KG, RPM, KW, LPH, SLPH, ON, OFF, DEGC`.
- Add `normalizeToken(tok)`:
  - uppercase
  - replace `&` with empty (so `R&D` → `RD`) **and** map literal `R&D` → `RND` before stripping
  - strip all non-alphanumerics, then strip trailing digits (`ETC-1` → `ETC`, `0.7` → empty)
  - return normalized string
- Tokens whose normalized form is in `TECH_ALLOWLIST` bypass the vowel-less rule. Pure-numeric/empty normalized tokens (e.g. `0.7`) also bypass.
- Multi-word fast path — return `false` (valid) if any of:
  - 3+ tokens AND at least one vowel anywhere
  - measurement regex matches: `/\b\d+(?:\.\d+)?\s*(?:bar|kg|kw|rpm|lph|slph|deg\s?c|°c)\b/i` (case-insensitive)
  - row starts with (case-insensitive): `SOP requires`, `Manual states`, `Equipment manual`, `As per SOP`, `As per checklist`, `As per manual`
- Keep strict single-token rules (length < 6, no vowel, 3+ repeated letter) so `hggg`/`xxxx`/key-mashes still fail.
- Change `InvalidRow` to `{ section, index, text, reason }` and have `findInvalidRows` return a specific reason (`Placeholder word "dummy"`, `Random key-mash (no vowels)`, `Too short`, etc.).

### 2. `src/pages/NewInvestigation.tsx`

- Add `acceptedRows: Record<string, true>` to form state, keyed by `${section}:${index}:${text}`. Persist it on the draft `HpgrdcInvestigation` as `acceptedInvalidRows?: string[]` (also add the optional field to `HpgrdcInvestigation` in `src/types/investigation.ts`) so re-opening a draft keeps the override.
- On submit, filter `findInvalidRows` results through `acceptedRows` before blocking.
- Render an inline panel above the submit button listing each remaining invalid row: `Field • Row # • full text • reason` with a per-row **"Accept as valid technical input"** checkbox that updates `acceptedRows`.
- Keep a concise toast: `Facts #3 — placeholder word "dummy". Fix or mark "Accept as valid technical input".`

### 3. Tiny type addition (`src/types/investigation.ts`)

Add `acceptedInvalidRows?: string[]` to `HpgrdcInvestigation`. No other model changes.

## Acceptance

- ETC-1 fuel-leakage facts ("Engine Test Cell startup", "Fuel Conditioning Unit…", "SOP requires…", "0.7 bar before FCU pump startup", "No fire, injury, or equipment damage") all pass without override.
- `R&D`, `ETC-1`, `HPGRDC`, `SPARC`, `STARS`, `PSSR`, `FCU`, `0.7 bar`, `Bar`, `BAR`, `KG`, `kW`, `deg C`, `°C` all pass.
- `asdf`, `hggg`, `dummy` still blocked, with the exact reason shown.
- Marking a row "Accept as valid technical input" persists with the draft and is not re-flagged on reopen.
