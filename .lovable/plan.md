# AI-Assisted Investigation Workflow (Final)

Shift from "AI guesses WHY Tree" to "AI asks → investigator confirms → AI formats". Layer on top of existing flow without breaking what works. AI calls are cached and gated by an input hash.

## 1. Four-stage guided flow on Investigation Detail

```text
Stage 1: AI Investigation Questions
Stage 2: Missing Checks + User Responses
Stage 3: Recommendation Categories
Stage 4: Generate Final Report
```

Buttons present throughout: Back to Edit, Save Draft, Continue Later.

- Stages 1 & 2 share a single AI call (`mode: 'questions'`) and are **cached** against `questionsInputHash` (inputs + SOPs + photos). Reopening the page never re-calls AI; only changed inputs invalidate the cache.
- Stage 3 is pure UI — no AI call.
- Stage 4 calls `mode: 'final'`, cached against `aiInputHash` (inputs + answers + missing-check responses + categories).
- "Generate with unanswered questions" requires confirming a warning: *"Unanswered investigation questions may reduce RCFA quality."* Unanswered questions persist as visible pending gaps in the working screen.

Model selection:
- `mode: 'questions'` → `google/gemini-3-flash-preview` (cheap).
- `mode: 'final'` → `google/gemini-2.5-pro` (stronger reasoning).
- No AI is invoked for dashboard, downloads, form rendering, or viewing a saved report.

## 2. Edge function `generate-rcfa` extended with `mode`

- `mode: 'questions'` → returns `{ questions: [{id, question, why, evidenceSource}], missingChecks: [{id, text}] }`.
- `mode: 'final'` → accepts `answers`, `missingCheckResponses`, `recommendationCategories`; returns existing `HpgrdcAiReport`.

**Question-quality rules in system prompt:**
- Questions must reference specific SOP step, manual limit, photo detail, or chronology fact. Forbid generic questions like "Was SOP followed?". Require form: *"Which specific SOP step X requires verification, and is evidence available that it was completed?"*
- `evidenceSource` must be exactly one of: `User input`, `SOP/manual`, `Photo`, `Missing evidence`.
- Cite page numbers **only if** the parser captured them (`SopExcerpt.pages[i].page` is a real number); otherwise omit.
- Existing grounding/post-filter (no SCADA/MFC/IoT/interlock unless in inputs) stays.

Recommendation post-filter for `final`:
- Allow verbs: include, verify, inspect, maintain, update, display, mark, train, record, check, brief, provide.
- Strip banned verbs: improve, enhance, optimize, consider, explore + existing IoT/SCADA/predictive blocklist.
- `responsibility`, `targetDate`, `verifiedBy` stay blank unless user typed values via Edit dialog.

## 3. Data model (`src/types/investigation.ts`)

Add to `HpgrdcInvestigation`:
```ts
labName?: string;
suspectedCause?: string;
correctiveActionTaken?: string;
aiQuestions?: { id; question; why; evidenceSource; answer?; status?: 'answered'|'na'|'not_checked'|'not_available' }[];
aiMissingChecks?: { id; text; status?: 'accept'|'ignore'|'na'; response? }[];
questionsInputHash?: string;        // cache key for stages 1+2
recommendationCategories?: string[];
includeSupportNotesInReport?: boolean; // default false
```

Update `Classification` to `'NA' | 'FATAL' | 'LWC' | 'RWC' | 'MTC' | 'FAC'`. NM/PFE remain free text; add an N/A toggle that locks the field and stores literal `"Not Applicable"`.

Update `canonicalInputs` in `investigationStore.ts`:
- `questionsInputHash` covers: inputs + SOP names + photo names + suspectedCause + correctiveActionTaken.
- `aiInputHash` (final) extends that with answers + missing-check responses + categories.

## 4. New UI components

- `src/components/analysis/AiQuestionsPanel.tsx` — question cards with Why / Source / Answer / Status. Pending unanswered count displayed.
- `src/components/analysis/MissingChecksPanel.tsx` — Accept / Ignore / N/A + optional response.
- `src/components/analysis/RecommendationCategoriesPanel.tsx` — checkbox grid of **12 categories**:
  SOP revision, Checklist update, Operator briefing/training, Equipment inspection, Visual label/marking, Verification record, Maintenance check, Engineering safeguard review, Manual limit display, Housekeeping, **Spill / leak control**, Emergency stop awareness.
- `InvestigationDetail.tsx` orchestrates the four stages, the cache hashes, and the regeneration warning *"Inputs have changed. Regeneration will consume one AI call and create a new report version."*

## 5. NewInvestigation form

- Add `labName`, `suspectedCause`, `correctiveActionTaken`.
- Classification dropdown first option: `Not Applicable`.
- NM/PFE: N/A toggle.
- Strict placeholder allow-list (Enter incident title / lab name / location / reported by / chronology event / fact / reviewed document / interacted person / record collected / `dd-mm-yyyy` / `hh:mm am/pm` / Not Applicable).
- No demo data, no prefilled WHY Tree or recommendations anywhere.

## 6. Dashboard

Columns: **Date | Lab Name | Incident Title | Location | Classification | Reported By | Action**.
Drop visible ID column. Action menu: Open / Edit Draft / Download Report (download disabled until `aiReport` exists).

## 7. Classification rendering (form + report)

If `classification === 'NA'`:
- Do not highlight any of FATAL/LWC/RWC/MTC/FAC in the 7-column table.
- Render NM/PFE cells with the user-entered text.
- If NM/PFE are also N/A, show literal `Not Applicable` in those cells.

## 8. Final HPGRDC report cleanliness

`generateReport.ts` + `HpgrdcReportView.tsx`:
- Default report stays clean HPGRDC-style — **no AI questions, missing checks, or categories rendered**.
- A new checkbox on the detail page: *"Include investigation support notes in appendix."* When ticked, append an "Investigation Support Notes" section with: confirmed answers, accepted/ignored missing checks, selected recommendation categories.
- `EditAiAnalysisDialog` continues to bypass AI for manual edits.

## 9. Regeneration guard

`InvestigationDetail` shows Regenerate only when the relevant hash differs. Otherwise shows View / Download / Edit AI Analysis only. Stage 1 has its own "Regenerate Questions" with the same guard.

## Files changed
- `src/types/investigation.ts`
- `src/data/investigationStore.ts`
- `src/pages/NewInvestigation.tsx`
- `src/pages/InvestigationDetail.tsx`
- `src/pages/Dashboard.tsx`
- `src/utils/generateReport.ts`
- `src/components/analysis/HpgrdcReportView.tsx`
- `supabase/functions/generate-rcfa/index.ts`
- `src/components/analysis/AiQuestionsPanel.tsx` (new)
- `src/components/analysis/MissingChecksPanel.tsx` (new)
- `src/components/analysis/RecommendationCategoriesPanel.tsx` (new)

No DB migrations; storage stays in localStorage.

## Out of scope
Auth, backend persistence, dashboard analytics logic, visual restyling.
