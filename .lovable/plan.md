## Goal
Replace the placeholder "Generate Analysis Summary" with a real, single-shot AI-generated 11-section RCFA report. Keep the dark industrial UI. Stay cost-tight: one AI call, on demand only, cached for both display and download.

## Cost discipline (enforced in code)
- Model: `google/gemini-2.5-flash` (Lovable AI Gateway, non-streaming).
- Exactly ONE call per "Generate RCFA Report" click. No auto-run on mount.
- Download Report reuses the cached `RcfaReport` — never re-calls AI.
- "Regenerate" shows an `AlertDialog` confirmation ("This uses another AI call. Continue?").
- SOP parsing capped: first 15 pages, max 8000 chars per file, max 3 files passed to the model.
- No streaming, no vector DB, no LangChain, no multi-step orchestration.

## Architecture

### Edge function — `supabase/functions/generate-rcfa/index.ts`
- Input: `{ investigation, sopExcerpts?: { name: string; text: string }[] }`
- Validates body with Zod.
- One POST to `https://ai.gateway.lovable.dev/v1/chat/completions` with:
  - `model: "google/gemini-2.5-flash"`
  - System prompt = senior oil & gas R&D safety investigator persona + strict rules (no fiction, no generic advice, mark gaps in assumptions, ground procedural-deviation findings in supplied SOP text only).
  - User message = compact JSON of investigation fields + tagged SOP excerpts.
  - `tools` + `tool_choice` forcing a single function call `emit_rcfa_report` whose JSON-schema parameters are the 11-section `RcfaReport` shape — guarantees structured output without parsing free text.
- Returns the parsed tool-call arguments as JSON.
- Surfaces 429 / 402 / other errors with explicit status + message so the client can fall back.

### Client fallback
If the edge function errors (network, 429, 402, schema mismatch), build a deterministic `RcfaReport` from existing investigation fields and show a banner: "AI generation unavailable; draft report generated using structured template."

### SOP parsing — `src/utils/parseSop.ts`
- Dynamic-imports `pdfjs-dist` (PDF), `mammoth` (DOCX), reads TXT directly.
- Per file: first 15 pages, truncate combined text to 8000 chars, strip control chars.
- Returns `{ name, text }[]`; unknown types silently skipped.
- Used in `NewInvestigation.tsx` when the user attaches files, and surfaced into the investigation record so the detail page can forward them.

### Types — `src/types/investigation.ts`
Add `RcfaReport` interface with all 11 sections (plus optional `assumptions`), matching the edge-function tool schema 1:1.

### Detail page — `src/pages/InvestigationDetail.tsx`
- Remove the existing "Generate Analysis Summary" panel + `buildAnalysisSummary`.
- Add a new "RCFA Report" card with:
  - Primary CTA **Generate RCFA Report** (only triggers AI).
  - Tiny helper text: "AI is triggered only when Generate RCFA Report is clicked."
  - Loading + 429/402 toast handling.
  - After success: expandable section cards for all 11 sections using existing `Collapsible`:
    - Incident Summary — paragraph
    - Chronology — vertical timeline
    - Immediate Cause — callout card
    - 5 Whys — numbered ladder
    - Fishbone (6M) — responsive 6-cell grid
    - Key Factors — 4-column grouped list
    - Barrier Analysis — 3-column table (Existing / Failed / Missing)
    - Risk Assessment — severity / likelihood / escalation tiles
    - Corrective Actions — action table
    - Preventive Actions — action table
    - Lessons Learned — bullet list
    - Assumptions — shown only if present
  - **Download Report** button: enabled once a report is cached, passes the cached `RcfaReport` directly to the generator. Disabled until generated.
  - **Regenerate** button: opens `AlertDialog` confirming a new AI call before re-running.
- Cache the `RcfaReport` in component state (single source of truth for display + download).

### Downloadable report — `src/utils/generateReport.ts`
- Signature changes to `generateInvestigationReport(investigation, report: RcfaReport)`.
- Drops the hardcoded `causeTree` / `fiveWhys` / `correctiveActions` constants.
- Renders the cached `RcfaReport` into the existing branded HTML shell (HP + RnD logos kept), section order matching the 11 sections + optional assumptions appendix.
- No AI calls.

### New investigation page — `src/pages/NewInvestigation.tsx`
- On submit, run `parseSop` on attachments (best-effort, non-blocking on failure) and store the resulting excerpts on the created investigation so the detail page can forward them to the edge function.

## Files
New
- `supabase/functions/generate-rcfa/index.ts`
- `src/utils/parseSop.ts`

Modified
- `src/types/investigation.ts` — add `RcfaReport`, optional `sopExcerpts`
- `src/pages/InvestigationDetail.tsx` — new RCFA panel, single-call flow, regenerate confirm, cached download
- `src/utils/generateReport.ts` — render cached `RcfaReport`
- `src/pages/NewInvestigation.tsx` — parse SOPs on submit

Dependencies (only loaded when SOPs are actually parsed)
- `pdfjs-dist`
- `mammoth`

## Prereq
- Enable Lovable Cloud (provisions `LOVABLE_API_KEY` for the AI Gateway).

## Out of scope
- Persisting reports to a database.
- Streaming.
- Any second AI call (including "improve section" features).
