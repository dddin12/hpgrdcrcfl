## Root cause of the "dummy output" problem

1. `NewInvestigation.tsx` builds `formData` but on submit does `const target = mockInvestigations[0]` and navigates to that — your input is discarded.
2. `InvestigationDetail.tsx` looks up the investigation from the same static `mockInvestigations` array, so it always shows HPLC / Dr. Sarah.
3. The AI edge function `generate-rcfa` is wired correctly, but it receives that dummy investigation, so the AI output is technically correct... about HPLC.
4. The 5 Whys / Fishbone / Cause Tree / Risk / Corrective Actions tabs render hardcoded sample arrays from `mockData.ts` regardless of the current investigation.

The AI pipeline itself is fine. We need to feed it real data and make the panels reflect it.

## Changes

### 1. New in-memory + localStorage store — `src/data/investigationStore.ts`
- `saveInvestigation(inv)`, `getInvestigation(id)`, `listInvestigations()`.
- Persists to `localStorage` so refresh keeps the record; merges with `mockInvestigations` for the list views.

### 2. `src/pages/NewInvestigation.tsx`
- On submit, build a **real** `Investigation` object from `formData`:
  - `id`: `INV-<yyyy>-<rand>`
  - `createdAt`, `status: 'in-progress'`, `riskScore` derived from severity (low=4, medium=9, high=16, critical=25).
  - Carry `sopExcerpts` from parsed attachments onto the saved investigation.
- Validate required fields, save via store, then navigate to `/investigation/<newId>`.
- Remove all references to `mockInvestigations[0]`.

### 3. `src/pages/InvestigationDetail.tsx`
- Resolve investigation via `getInvestigation(id)` first, fall back to mock list only if not found.
- Pass the resolved `report` (when present) into the analysis tabs so they reflect real AI output. Add an empty state on each tab telling the user to click "Generate RCFA Report" when no report is cached.

### 4. Analysis panels — make them data-driven
- `FiveWhysPanel`, `FishbonePanel`, `CauseTreePanel`, `RiskAssessmentPanel`, `CorrectiveActionsPanel`:
  - Accept an optional `report?: RcfaReport` prop.
  - If `report` is provided, render from `report.fiveWhys`, `report.fishbone`, `report.correctiveActions`, `report.riskAssessment`, and a cause-tree built from `keyFactors` + `fiveWhys`.
  - If no report yet, render a clean empty state ("Generate the RCFA report to populate this view") — no Dr. Sarah / HPLC dummy content.
- Keep the existing colorful/responsive visual styling; only swap the data source.

### 5. `src/pages/Investigations.tsx` and `src/pages/Dashboard.tsx`
- Use `listInvestigations()` (user-created + mock) so newly created cases appear and the dashboard stats reflect real input. Mock items stay as historical examples.

### 6. Edge function `generate-rcfa` — small hardening
- Pass `contributingCauses`, `rootCause`, `immeditateCause`, and `correctiveActions[]` through to the prompt when present so AI grounds on every field the user gave.
- Tighten the system prompt: "Ground every section strictly in the supplied investigation fields and SOP excerpts. Never invent equipment models, personnel names, timestamps, or chemicals not present in the input. If a field is empty, mark it explicitly under assumptions."
- Bump default model to `google/gemini-2.5-pro` for higher-quality, less generic output (single call, still cheap on this flow).

### 7. `src/utils/generateReport.ts`
- Already renders from the cached `RcfaReport`. Verify the header pulls live investigation fields (lab name, equipment, operator, date) from the argument — no hardcoded HPLC/Sarah strings remain.

## Files

- New: `src/data/investigationStore.ts`
- Modified: `src/pages/NewInvestigation.tsx`, `src/pages/InvestigationDetail.tsx`, `src/pages/Investigations.tsx`, `src/pages/Dashboard.tsx`, `src/components/analysis/FiveWhysPanel.tsx`, `src/components/analysis/FishbonePanel.tsx`, `src/components/analysis/CauseTreePanel.tsx`, `src/components/analysis/RiskAssessmentPanel.tsx`, `src/components/analysis/CorrectiveActionsPanel.tsx`, `src/utils/generateReport.ts`, `supabase/functions/generate-rcfa/index.ts`

## Out of scope

- Database persistence (localStorage is enough for this internal tool).
- Auth / multi-user.
- Editing investigations after creation.
