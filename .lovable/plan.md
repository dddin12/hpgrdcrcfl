## Goal

Make the app behave exactly like the HPGRDC Incident Investigation format. Operator fills all incident facts; AI only produces WHY Tree, Key Factors, Systems-to-Reinforce deficiencies, and Recommendations. Downloaded report visually matches the uploaded HPGRDC PDF (bordered tables, black-and-white, compact engineering style). AI runs only on explicit Generate, and the result is cached.

---

## 1. New investigation form (replaces current NewInvestigation.tsx)

Restructure into exact HPGRDC sections. All fields user-only — AI never overwrites these.

**Section A — Incident Header**
- Incident Title
- Classification (single-select: FATAL, LWC, RWC, MTC, FAC, NM, PFE)
- Numbers (free text)
- Details of Injured: Company Employees, Contractor Employees, Visitors (numeric)
- Name of Injured Person, Age / Sex of IP, Ticket no. / Department, Company / Contractor, Nature of Injury, Incident Reported by

**Section B — Incident Information**
- Location, Incident Number, Date, Time, Investigation Initiated (date/time), Report Submission (date)

**Section C — Investigation Information**
- Records Reviewed (multi-line), Persons Interacted (multi-line), Prior similar incident (yes/no + notes)

**Section D — Incident Narrative**
- Summary, Chronology of Events (repeatable: time + event), Facts collected (repeatable)

**Section E — Supporting Attachments (optional, AI grounding only)**
- SOP, Operating manual, SMP, Checklist, **Photographs**, Supporting docs
- Photographs flagged separately (image MIME) so the report can render them.
- Reuse parseSop pipeline for text docs; pass attachment text as AI grounding.

Saves to local store; routes to `/investigation/:id`.

---

## 2. Type model rewrite (`src/types/investigation.ts`)

```
HpgrdcInvestigation {
  id, createdAt,
  incidentTitle, classification: 'FATAL'|'LWC'|'RWC'|'MTC'|'FAC'|'NM'|'PFE',
  numbers,
  injured: { company, contractor, visitors },
  injuredName, ageSex, ticketDept, companyContractor, natureOfInjury, reportedBy,
  location, incidentNumber, dateOfIncident, timeOfIncident,
  investigationInitiated, reportSubmission,
  recordsReviewed: string[], personsInteracted: string[],
  priorSimilar: { occurred: boolean, notes: string },
  summary, chronology: { time?, event }[], facts: string[],
  sopExcerpts?: SopExcerpt[],
  photographs?: { name: string, dataUrl: string, caption?: string }[],
  aiReport?: HpgrdcAiReport,
  aiInputHash?: string,
  aiHistory?: HpgrdcAiReport[],
}

HpgrdcAiReport {
  whyTree: { effect, cause:{primary,secondary?}, why:string[], deeper:string[], rootWeakness:string[] },
  keyFactors: { system:string[], human:string[], physical:string[] },
  systemsToReinforce: { system, deficiency }[], // exact 13 names
  recommendations: { recommendation, responsibility, targetDate, verifiedBy }[],
  generatedAt, inputHash, model: 'flash'|'pro',
}
```

Keep `SYSTEMS_TO_REINFORCE` constant.

---

## 3. AI generation (`supabase/functions/generate-rcfa/index.ts`)

Rewrite system prompt + tool-calling schema to produce only the four AI sections. Rules:
- Ground strictly in user inputs + attachment text; never invent names, dates, chemicals, equipment, events.
- WHY tree: concise engineering style. Each node = 1 short sentence.
- Key Factors: short factual bullets, incident-specific, no generic safety language.
- Systems to Reinforce: deficiency only if grounded; blank otherwise; exact 13 names.
- Recommendations: practical, low-complexity HPGRDC committee actions (SOP updates, retraining, supervision, poka-yoke, checklists, visual indicators, verification, maintenance). Forbid IoT/AI monitoring/digital twins/predictive analytics/smart sensors/interlocks/expensive instrumentation unless severity is FATAL/LWC and clearly demanded.

**Model selection (cost-controlled):**
- Default: `google/gemini-2.5-flash`.
- Optional future "Deep Review Mode": client passes `{ deepReview: true }` → function uses `google/gemini-2.5-pro`. Flag plumbed now; UI toggle deferred.

---

## 4. Caching / cost control (`src/data/investigationStore.ts`)

- Add `aiReport`, `aiInputHash`, `aiHistory`, `photographs`.
- `computeInputHash(inv)` over canonical JSON of user-entered fields + sorted attachment/photo names (SubtleCrypto SHA-1).
- Generate button disabled when `aiReport` exists and hash matches. Becomes "Regenerate" only after inputs change.
- On regenerate, push previous `aiReport` into `aiHistory[]`.
- Bump localStorage key `rcfa.investigations.v1` → `v2`; ignore old entries.

---

## 5. Investigation detail page (`src/pages/InvestigationDetail.tsx`)

- Top: read-only HPGRDC-style display of Sections A–E.
- Action bar: **Generate Report** / **Regenerate** (stale), **View Report**, **Download HTML**.
- Below: `HpgrdcReportView` once `aiReport` exists.
- Remove unrelated panels (Fishbone, FiveWhys, CauseTree, RiskAssessment, CorrectiveActions, EmptyAnalysisState).
- No "RCFA", "Fishbone", "5 Why", "Risk Matrix" wording anywhere user-facing — use HPGRDC terminology only.

---

## 6. Report view + download (`src/components/analysis/HpgrdcReportView.tsx`, `src/utils/generateReport.ts`)

Title block at top of every report (on-screen and downloaded):
- Line 1: **Incident Investigation Report**
- Line 2: **HPGRDC.**

Sections in order (mirror sample PDF):
1. Header table (Title; Classification row with all 7 columns, selected highlighted; Numbers; Details-of-Injured; Injured-person sub-table; Reported-by)
2. Incident info table (location/number/date/time/init/submission)
3. Records reviewed / persons interacted table
4. "Any incident reported earlier..." line
5. Summary of Incident
6. Chronology of Events (numbered)
7. List of Facts (numbered)
8. **WHY Tree Analysis** (cascading bordered tables: Effect → Cause → Why → deeper → root weakness)
9. **Key Factors Identified** (System / Human / Physical)
10. **Systems that needs to be Reinforced** (fixed 13-row 3-col table; blank deficiency = blank `<td>` in download, muted "—" on screen)
11. **Recommendations** (5-col table: Sr No. | Recommendation | Responsibility | Target Date | Implementation to be Verified by)
12. Incident Investigation Completion (Prepared by / Reviewed & Approved by)
13. **Supporting Photographs:** — always present.
    - If `photographs[]` non-empty: render each `<img>` with caption ("Figure N: <caption or filename>"), page-break friendly.
    - If empty: render the heading with a blank area below (no placeholder text).

Style: black text on white, 1px borders, compact, no shadows/gradients. Print-ready A4. Downloaded as HTML Blob in new tab. Photographs embedded as data URLs so the downloaded file is self-contained.

---

## 7. Dashboard (`src/pages/Dashboard.tsx`)

Card: Incident Title, Classification badge, Date, Location, status (Generated / Draft). Keep "New Investigation" button. No risk matrix, no documents page.

---

## 8. Cleanup

Delete: `FishbonePanel.tsx`, `FiveWhysPanel.tsx`, `CauseTreePanel.tsx`, `RiskAssessmentPanel.tsx`, `CorrectiveActionsPanel.tsx`, `EmptyAnalysisState.tsx`, `RcfaReportView.tsx`, `fallbackReport.ts`. Remove any "RCFA"/"Fishbone"/"5 Why"/"Risk Matrix" strings from remaining user-facing UI.

---

## Technical notes

- Photographs read in browser via FileReader → dataURL; stored in localStorage (cap total ~5 MB; warn on exceed).
- Hashing: `crypto.subtle.digest('SHA-1', ...)` over canonical JSON.
- Edge function uses tool-calling for structured output; default model `google/gemini-2.5-flash`; `deepReview` → `google/gemini-2.5-pro` (no UI yet).
- Out of scope: real PDF generation (HTML print is enough), e-signatures, backend persistence, Deep Review UI toggle.

