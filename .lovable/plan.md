## HPGRDC Report & Form Fixes

Targeted fixes to chronology rendering, classification layout, multi-line fields, WHY Tree visuals, AI editability, recommendation tone, logos, placeholders, and date formatting. No dashboard or backend logic changes.

### 1. Chronology — render all rows, no drops, no duplicates
`src/utils/generateReport.ts` + `HpgrdcReportView.tsx`:
- Iterate the full `inv.chronology` array; render each as a numbered `<li>`.
- Merge `time` into the sentence naturally: if `time` exists and event doesn't already start with/contain it, output `"At {time}, {event}"` (lowercase first letter of event when prepending); else just `{event}`. Strip leading "At " duplication.
- De-dupe: trim, skip entries where both time and event are empty.

**Validation (form-side, `NewInvestigation.tsx`)**:
- Add `isLikelyGibberish(s)` util in `src/utils/validation.ts`: flags strings <6 chars with no vowel, >50% digits mixed with letters randomly, or matching `/^[a-z0-9]{3,}$/i` without spaces and not in a small allow-list of legit short tokens.
- On "Generate Report" click, scan chronology + facts + records + persons; if any row trips the heuristic, show a blocking toast listing the offending rows. User must fix or remove.

### 2. Classification table — match PDF layout exactly
`generateReport.ts`:
- Header row: 7 separate `<th>` cells (FATAL, LWC, RWC, MTC, FAC, NM, PFE), equal width via `colgroup`.
- Selected cell: black background, white bold text. Others: empty.
- Directly under PFE column, render small italic `"Process incident"` label always (matches uploaded sample).
- Use a dedicated `<table class="cls">` separate from the title/numbers rows to prevent `colspan` collisions causing NM/PFE overlap.
- "Numbers" row prints `inv.numbers` literally (no fallback to blank — show "Not applicable" if user typed it).

Same fix in `HpgrdcReportView.tsx` (on-screen mirror).

### 3. Records Reviewed / Persons Interacted — preserve line breaks
- Already stored as `string[]`. Render each item as its own `<div>` (not joined with `<br/>` only — wrap each in a block so line-height is preserved and copy-paste keeps lines).
- On-screen view: same — each on its own row.

### 4. WHY Tree — bordered hierarchical layout
Redesign `whyTree` rendering in both view and download:
```
┌─────────── Effect ───────────┐
│         {effect text}        │
└──────────────┬───────────────┘
┌───── Cause: Primary ─────┬───── Secondary ─────┐
└──────────────┬──────────────────────┬──────────┘
┌───── Why (level 1) ─────┐  ...columns per item
┌───── Why (deeper) ─────┐
┌───── Root Weakness ─────┐
```
- Use labeled bordered tables with column headers `Effect | Cause | Why`.
- Each level draws a downward connector (simple bordered cell, no SVG).
- No JSON-looking output, no plain bullets.

### 5. AI prompt — practical wording
`supabase/functions/generate-rcfa/index.ts`:
- Strengthen the forbidden-terms list: `interlock`, `IoT`, `AI monitoring`, `digital twin`, `smart sensor`, `predictive analytics`, `expensive automation`.
- Allow `interlock` only when classification is FATAL/LWC OR when user-entered facts/narrative literally contain the word.
- Prefer phrasings: SOP update, checklist, operator counselling/training, visual indication, alternate analysis method, safeguard against backpressure, engineering control feasibility study.
- Add example phrasing in the system prompt: `"No safeguard available to protect Wet Gas Meter in case of back pressure."`

### 6. Edit AI Analysis (manual override, no re-call)
`InvestigationDetail.tsx`:
- Add "Edit AI Analysis" button next to "View Report" / "Download".
- Opens a new `EditAiAnalysisDialog.tsx` (modal) with four collapsible sections:
  - WHY Tree (text inputs for effect, primary/secondary cause; comma-or-newline lists for why/deeper/rootWeakness)
  - Key Factors (system / human / physical — each a textarea, one per line)
  - Systems to Reinforce (13 rows, deficiency input per row, blank allowed)
  - Recommendations (editable table: add/remove rows; columns recommendation/responsibility/targetDate/verifiedBy)
- On Save: writes back to `inv.aiReport` via store; does NOT touch `aiInputHash` (so "inputs changed" warning stays accurate); does NOT call the edge function.
- Downloaded HTML and on-screen view both read the edited values automatically.

### 7. Report aesthetics — logos & polish
- Add two header logos to downloaded report and on-screen report: `public/hpcl-logo.png` (left) and `public/hpgrdc-logo.png` (right), with title centered between them. Use existing `src/assets/hp-logo.png` and `src/assets/rnd-logo.png` if present; copy to `public/` for HTML download embedding via data-URL at generation time (so the downloaded standalone HTML still shows logos offline).
- Convert logos to base64 inside `generateReport.ts` (fetch from `import.meta.env.BASE_URL + 'hp-logo.png'`, read as data URL) before injecting into the HTML string.
- Tighten table CSS: fixed `table-layout: fixed`, `word-wrap: break-word`, consistent 5pt padding, no compressed columns. Add `colgroup` widths to every table.
- Pure B&W (no greys except header `#eee`), 1px solid black borders, A4 18mm margins.

### 8. Supporting Photographs
Already handled; verify: if `photographs` empty → render heading + empty bordered block. If present → grid with `Figure N: {caption||name}`. No code change unless QA reveals issue.

### 9–10. Placeholder cleanup
`NewInvestigation.tsx`: replace every `placeholder=` containing a real name/date/document with generic versions:
- Incident Title → `Enter incident title`
- Location → `Enter location`
- Reported by / Persons / Witnesses → `Enter name / designation`
- Records Reviewed inputs → `Enter reviewed document`
- Persons Interacted inputs → `Enter interacted person`
- Chronology event input → `Enter chronology event`
- Chronology time input → `dd-mm-yyyy hh:mm`
- Facts input → `Enter fact collected`
- Report Submission → `Enter report submission date`
- Numbers → `e.g. Not applicable`

Audit every `placeholder=` in the file and replace any containing names, dates, or specific incident text.

### 11. Date/time consistency
- All datetime fields use placeholder `dd-mm-yyyy hh:mm`; date-only use `dd-mm-yyyy`.
- Keep inputs as plain text (no `type="date"`) to match the format consistently and to allow approximate values.
- Add helper text under datetime fields: `Format: dd-mm-yyyy hh:mm`.

### 12. UI helper text
Below each multi-row section header, add muted small text:
- Records Reviewed → `Add one record per row`
- Persons Interacted → `Add one person per row`
- Chronology → `Add one chronology event per row`
- Facts → `Use factual observations only`

### 13. Preserve UI
No changes to dark theme, sidebar, dashboard logic, or section card styling. Only placeholder text, helper text, validation logic, report rendering, and new edit dialog are touched.

### Files touched
- **Edit**: `src/utils/generateReport.ts`, `src/components/analysis/HpgrdcReportView.tsx`, `src/pages/NewInvestigation.tsx`, `src/pages/InvestigationDetail.tsx`, `src/data/investigationStore.ts` (add `updateAiReport` setter), `supabase/functions/generate-rcfa/index.ts`
- **New**: `src/utils/validation.ts`, `src/components/analysis/EditAiAnalysisDialog.tsx`
- **Assets**: ensure `public/hp-logo.png` and `public/rnd-logo.png` exist (copy from `src/assets/` if needed)

### Out of scope
- Real PDF (still HTML print-ready)
- Backend persistence (still localStorage)
- Deep Review Mode UI toggle
- Dashboard changes
