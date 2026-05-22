## Goal

Make this a practical lab tool, not a demo. Three concrete changes:

1. Kill all dummy/mock content end-to-end.
2. Reduce navigation to **Dashboard** and **New Investigation** only. Dashboard lists every real investigation with "View Report" and "New Investigation" actions.
3. When SOPs/manuals are attached, the AI must cite them by **document name + page number** (e.g. "SOP-LAB-12, p.4: pre-start checklist not followed") wherever a deviation, gap, or negligence is identified.

## Changes

### 1. Remove dummy data and unused pages
- Delete `src/data/mockData.ts` usage everywhere. Replace `mockInvestigations` references with the real store.
- Remove routes and files: `Documents.tsx`, `RiskMatrix.tsx`, `Investigations.tsx` (dashboard now serves the list). Drop their entries from `App.tsx` and `AppSidebar.tsx`.
- Sidebar nav becomes: **Dashboard**, **New Investigation**, **Settings** only.
- `RiskAssessmentPanel`, `CauseTreePanel`, etc. stop importing mock data; if no `report`, they render the existing `EmptyAnalysisState`.
- `getInvestigation` / `listInvestigations` no longer merge mock items — only user-created investigations from localStorage.

### 2. Dashboard becomes the single hub
- Header: title + two buttons → **New Investigation**, and (when an investigation is selected) **Download Report**.
- Body: one table/list of every saved investigation with columns: ID, Date, Equipment, Lab, Severity, Status, Actions (View, Download Report if report cached).
- Empty state when no investigations exist: a clear "Start your first investigation" CTA.
- Remove the "Risk Distribution" and "Quick Actions" side cards (they were demo filler).

### 3. SOP / manual page-level citations
- Update `src/utils/parseSop.ts` to keep **per-page text** instead of one flat blob:
  - PDF: store `{ name, pages: [{ page: 1, text: "..." }, ...] }`, up to 15 pages, ~600 chars/page.
  - DOCX/TXT: chunk by ~1500 chars and label as `section 1`, `section 2`, … (DOCX has no real pages from mammoth).
- Update `src/types/investigation.ts` `SopExcerpt` to `{ name: string; pages: { page: number | string; text: string }[] }`.
- Update edge function `supabase/functions/generate-rcfa/index.ts`:
  - Send the per-page chunks to the model with explicit labels: `"[SOP: <name>] Page <n>: <text>"`.
  - Tighten the system prompt: *"Whenever a deviation, procedural gap, missed step, or negligence is identified, you MUST cite the exact source as `<document name>, p.<page>` (or `section <n>` if no page). Never invent page numbers. If no SOP supports a finding, say `No SOP reference available` instead of guessing."*
  - Extend the JSON schema with a `references: { source: string; page: string; quote: string; relevance: string }[]` field, plus an optional `sopCitation` string on each finding in `keyFactors`, `correctiveActions`, and `procedureGaps`.
- `RcfaReportView.tsx` + the printable `generateReport.ts`: render the citation inline next to the finding (small monospace badge), and add a "Document References" section listing every cited page.

### 4. Investigation detail page
- Keep AI generation flow (one-shot Gemini 2.5 Pro) and caching. Tabs stay, but all panels are already report-driven after the previous change.
- "Download Report" stays. "Regenerate" stays behind a confirm dialog.
- Remove any leftover sample/demo tab content.

## Files

- **Delete**: `src/data/mockData.ts`, `src/pages/Documents.tsx`, `src/pages/RiskMatrix.tsx`, `src/pages/Investigations.tsx`
- **Modify**: `src/App.tsx`, `src/components/layout/AppSidebar.tsx`, `src/pages/Dashboard.tsx`, `src/pages/NewInvestigation.tsx`, `src/pages/InvestigationDetail.tsx`, `src/data/investigationStore.ts`, `src/types/investigation.ts`, `src/utils/parseSop.ts`, `src/utils/generateReport.ts`, `src/utils/fallbackReport.ts`, `src/components/analysis/RcfaReportView.tsx`, all `src/components/analysis/*Panel.tsx` (drop mock imports)
- **Modify**: `supabase/functions/generate-rcfa/index.ts` (per-page prompt + citation requirement + schema)

## Out of scope

- Cross-device persistence (still localStorage — this is an internal pilot).
- OCR for scanned PDFs (text-layer PDFs only, same as today).
- Editing investigations after creation.
