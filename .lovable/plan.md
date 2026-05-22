## HPGRDC Incident Investigation Report Generator — Final Consolidated Plan

Single consolidated plan covering classification redesign, verbatim user-input rendering, strict AI grounding/anti-hallucination, WHY-tree diagram, validation, multi-line preservation, recommendation controls, manual AI editing, report aesthetics, and placeholder cleanup. No dashboard/backend/auth changes.

---

### A. Classification input + legend

`src/types/investigation.ts`
- Narrow `Classification` to `'FATAL' | 'LWC' | 'RWC' | 'MTC' | 'FAC'`.
- Add fields to `HpgrdcInvestigation`: `nm: string`, `pfe: string`.

`src/pages/NewInvestigation.tsx`
- Dropdown lists only FATAL/LWC/RWC/MTC/FAC.
- Separate text inputs **NM** (placeholder `Not Applicable / Near Miss details`) and **PFE** (placeholder `Process incident / Property damage / Equipment damage`).
- Small muted legend block beside the section:
  - FATAL — Fatality · LWC — Lost Workday Case · RWC — Restricted Work Case · MTC — Medical Treatment Case · FAC — First Aid Case · NM — Near Miss · PFE — Process / Property / Fire Event.
- Numbers field kept separate (`e.g. Not applicable`).

`investigationStore.ts` `canonicalInputs`: include `nm`, `pfe`.

### B. Classification table rendering

`generateReport.ts` + `HpgrdcReportView.tsx`
- 7 fixed columns with `colgroup` (14.28% each): FATAL | LWC | RWC | MTC | FAC | NM | PFE.
- Header row: column names; selected category cell filled black.
- Value row: `inv.nm` under NM, `inv.pfe` under PFE, blank elsewhere — no collapsing.
- Numbers row prints `inv.numbers` verbatim (no fallback to blank).

### C. User inputs are source of truth (verbatim)

- Incident title, classification, injury details, records reviewed, persons interacted, summary, chronology, facts, records collected, photographs are read **only** from `inv.*` and rendered verbatim.
- Edge-function output schema stays restricted to the four AI sections; never returns rewritten user inputs.

### D. Validation — block gibberish before generation

`src/utils/validation.ts`
- Extend `isLikelyGibberish` with blocklist: `test`, `dummy`, `asdf`, `qwerty`, `hggg`, `xxxx`, `tbd`, `temp`, `lorem`, `abcd`, `1234`.
- Token rule: any whitespace token ≥5 chars with no vowel → gibberish.
- Keep existing mixed-alphanumeric heuristics.

`NewInvestigation.tsx`
- On Generate, scan chronology, facts, records reviewed, persons interacted.
- If any invalid: blocking toast *"Invalid investigation input detected. Please correct highlighted rows before report generation."* and mark offending inputs with `border-destructive`. Do not call the edge function.

### E. Chronology rendering

- Iterate full `inv.chronology` array, render numbered `<ol>` items.
- `formatChronologyLine(time, event)`:
  - Trim both. Skip if both empty.
  - If `event` already contains the time substring → output `event` unchanged.
  - Else if `time` present → `"At {time}, {event with first letter lowercased}"`.
  - Else → `event`.
- No de-duplication of distinct rows; no auto-merge.

### F. Multi-line field preservation

- Records Reviewed, Persons Interacted, Facts, Records Collected: render each item as its own `<div>` block (one row per item) in both HTML download and on-screen view. No `join`, no `<br/>` collapsing.

### G. WHY Tree — bordered hierarchical diagram

Both `generateReport.ts` and `HpgrdcReportView.tsx`:
- Single vertical bordered diagram, B&W, `table-layout: fixed`, `word-wrap: break-word`.
- Five labelled levels with downward connector cells:

```text
+-----------------+
| Effect          |
+--------+--------+
         |
+--------+--------+
| Cause           |
+--------+--------+
         |
+--------+--------+
| Why             |
+--------+--------+
         |
+--------+--------+
| Deeper Cause    |
+--------+--------+
         |
+--------+--------+
| Root Weakness   |
+-----------------+
```

- No JSON, no plain bullet list, no narrative paragraph.

### H. AI scope and grounding (`supabase/functions/generate-rcfa/index.ts`)

Model: `google/gemini-2.5-flash` (default). Output strictly limited to `{ whyTree, keyFactors, systemsToReinforce, recommendations }`.

**Grounded vocabulary preprocessing**
- Build `groundedTerms` (lowercased token set + exact phrases) from: `summary`, `chronology[].event`, `facts`, `recordsReviewed`, `personsInteracted`, `sopExcerpts`.
- Inject into prompt as `GROUNDED VOCABULARY: ...` for the model to self-check.

**System prompt rules**
- Absolute grounding: never invent names, dates, chemicals, operating values, equipment models, safeguards, procedural steps, or recommendations not supported by inputs.
- Forbidden concepts unless they literally occur in inputs/SOP excerpts: SCADA, MFC, syringe pump, sensor, interlock, IoT, smart sensor, predictive analytics, automation, digital twin, AI monitoring, predictive maintenance.
- No hypotheticals (alternate technical possibilities, undocumented deviations, control-system assumptions).
- When evidence missing → output literal `"No evidence available during investigation."`
- No false certainty — prefer *during investigation it was observed*, *based on available investigation inputs*, *appears associated with*, *likely contributed*.
- No blame language — never use *negligence*, *incompetence*, *careless*, *misconduct*, *operator fault*. Use neutral wording (`valve was not opened`, `step was missed`, `procedure deviation observed`).
- No operational/emergency/isolation/shutdown guidance unless grounded in SOP excerpts; otherwise `"No verified procedural guidance available in uploaded investigation records."`
- Recommendation authority limits: prefer SOP update, checklist reinforcement, operator counselling/training, engineering safeguard review, visual indication, procedural verification, equipment manual review, alternate analysis method, feasibility study. Avoid plant redesign, enterprise software, major CAPEX, AI/predictive systems.
- Never declare incident closed, root cause confirmed, action complete, or risk eliminated.
- Restrained PSU/committee tone — no consulting/motivational/SaaS language.

**Server-side post-filter (after model response, before returning)**
1. Walk every string in `whyTree`, `keyFactors.*`, `systemsToReinforce[].deficiency`, `recommendations[].recommendation`.
2. If a forbidden term appears AND is not in `groundedTerms`:
   - Array items (why/deeper/rootWeakness, keyFactors): replace with `"No evidence available during investigation."`
   - Recommendations: drop the item.
   - System deficiency: clear to empty.
3. Blame regex (`negligence|incompetence|careless(ly)?|misconduct|operator fault|at fault`) → strip clause / replace with neutral phrasing.
4. Certainty markers (`confirmed root cause`, `definitively`, `proves that`, `clearly caused`) → `appears associated with` / `likely contributed to`.
5. Recommendations containing `interlock|IoT|smart sensor|predictive|automation|digital twin` when classification ∉ {FATAL, LWC} → replace term with neutral equivalent (`interlock` → `engineering safeguard`, others → `periodic verification check`).
6. Strip `responsibility`/`targetDate`/`verifiedBy` from any recommendation where the value isn't present in inputs.

### I. Key Factors style

- Each bullet is one short factual line.
- Empty list rendered as `Nil`.
- Prompt enforces "no consulting tone, no generic safety jargon, no speculation."

### J. Systems to be Reinforced

- Renderer always emits all 13 fixed rows in fixed order. AI fills `deficiency` only; blanks allowed.
- Prompt forbids filling Contractor Management / Safety Leadership / MOC unless inputs mention them.

### K. Recommendation control

Covered in H (prompt + post-filter). Leave `responsibility/targetDate/verifiedBy` blank unless inputs contain them.

### L. Edit AI Analysis

Already implemented (`EditAiAnalysisDialog.tsx` + `updateAiReport`). Confirm:
- Writes back to `inv.aiReport` only.
- Does not call edge function.
- Does not modify `aiInputHash` (stale-warning still reflects real input changes).
- Downloaded HTML reads the edited values.

### M. Report aesthetics

- HPCL logo (left) + HP Green R&D Centre logo (right), centered title:

```text
Incident Investigation Report
HPGRDC.
```

- Logos embedded as base64 data URLs at generation time (offline-safe).
- B&W only; `table-layout: fixed`; `word-wrap: break-word`; 5pt cell padding; 1px solid black borders; A4 18mm margins.
- No cards, gradients, shadows, SaaS chrome.

### N. Supporting Photographs

- Heading `Supporting Photographs:` always rendered.
- If photos present: grid with `Figure N: {caption||name}`.
- If absent: blank bordered placeholder block.

### O. Placeholder + helper text cleanup

`NewInvestigation.tsx`: audit every placeholder. Replace any names/dates/products (Pradeep Pal Singh, Madan Kumar, Sarah, HPLC, Wet Gas Meter, 04 Sep 2020, etc.) with generic versions:
- Incident Title → `Enter incident title`
- Location → `Enter location`
- Reported by / Persons / Witnesses → `Enter name / designation`
- Records Reviewed → `Enter reviewed document`
- Persons Interacted → `Enter interacted person`
- Chronology event → `Enter chronology event`
- Chronology time → `dd-mm-yyyy hh:mm`
- Facts → `Enter fact collected`
- Records Collected → `Enter record collected`
- Report Submission → `dd-mm-yyyy`
- Numbers → `e.g. Not applicable`

Helper text under multi-row section headers:
- Records Reviewed → `Add one record per row`
- Persons Interacted → `Add one person per row`
- Chronology → `Add one chronology event per row`
- Facts → `Use factual observations only`

### P. Date/time format

- Date fields → plain text, placeholder `dd-mm-yyyy`.
- DateTime fields → plain text, placeholder `dd-mm-yyyy hh:mm`.
- Time fields → `hh:mm am/pm`.
- No native `type="date"`.

### Q. Cache / cost control (already in place — verify)

- AI runs only on Generate click.
- Cached by SHA-1 input hash on `inv`.
- Manual edits via dialog do not invalidate cache or trigger AI.
- Download uses stored report.

### R. AI is assistive only

- Prompt forbids declaring closure/confirmation/completion/risk-eliminated.
- UI keeps investigator-driven flow; no auto-closure actions.

---

### Files touched

- **Edit**: `src/types/investigation.ts`, `src/pages/NewInvestigation.tsx`, `src/utils/validation.ts`, `src/utils/generateReport.ts`, `src/components/analysis/HpgrdcReportView.tsx`, `src/data/investigationStore.ts`, `supabase/functions/generate-rcfa/index.ts`
- **No new files.**

### Out of scope

- Real PDF export (remains print-ready HTML).
- Backend persistence (remains localStorage).
- Dashboard / sidebar / auth.
- Deep Review Mode UI toggle.
