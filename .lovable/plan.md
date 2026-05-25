## Goal

Operational fixes only. No theme/dashboard restyle, no report-template restyle, no validation-logic changes.

---

## 1. Back to Edit Investigation (round-trip without data loss)

`NewInvestigation.tsx` currently only creates a new investigation. Add edit mode:

- Route `/new?id=<id>` (or `/investigation/:id/edit`) pre-loads the investigation via `getInvestigation(id)` and seeds **all** local state: `d`, `records`, `persons`, `chronology`, `facts`, `acceptedRows`, plus already-attached `sopExcerpts` and `photographs`.
- Attachments round-trip: show existing SOP names + photo thumbnails as removable chips. Only re-parse SOPs when the user adds new files. Existing parsed `sopExcerpts` and `photographs` are kept verbatim unless removed.
- Save in edit mode **updates the same id** via `saveInvestigation`, preserving every AI-stage field: `aiQuestions`, `aiMissingChecks` (with `answer` / `status` / `response`), `recommendationCategories`, `aiReport`, `aiInputHash`, `questionsInputHash`, `aiHistory`, `acceptedInvalidRows`, `includeSupportNotesInReport`, `includePendingGapsInReport` (new flag, see §4).
- "Save Draft" button (next to Cancel) writes via `saveInvestigation` without navigating; toast confirms.
- Re-entering edit mode then returning to the AI workflow must show questions, answers, missing-check responses, categories, and any existing report exactly as left.

`InvestigationDetail.tsx` — persistent action bar at **both** the top header and after the last stage card, visible on every stage and after the report exists:

- `Back to Edit Investigation` → `navigate(/new?id=<inv.id>)` — no AI call, no uploads touched.
- `Save Draft` → `patchInvestigation(inv, {})` + toast.
- `Return to Dashboard` → `navigate('/')`.

---

## 2 & 3. Chronology — capture, render, downloaded-report fidelity

Type change in `src/types/investigation.ts`:

```ts
chronology: { date?: string; time?: string; event: string }[]
```

`NewInvestigation.tsx`:
- Three controls per row: optional date picker, optional time picker, mandatory event text.
- Stop dropping rows on submit beyond "event is non-empty" — keep every non-empty event row in order. No filter, merge, or dedupe.
- Add-row button unchanged.

Rendering in `HpgrdcReportView.tsx` and `src/utils/generateReport.ts`:
- Render every stored chronology row. Format: `${i+1}. ${prefix}${event}` where `prefix = [date, time].filter(Boolean).join(', ') + ' — '` if either is present, else empty.
- Update `formatChronologyLine` in `src/utils/validation.ts` to accept `(date?, time?, event)` and produce:
  - `10:05 am — Engine Test Cell-1 startup activity initiated.`
  - `22-05-2026, 10:05 am — Engine Test Cell-1 startup activity initiated.`
  - time-only when date blank; event-only when both blank.
- Convert stored 24h `HH:mm` → `h:mm am/pm` for display only. Internal store stays canonical.
- Never filter, merge, or summarize rows. Never overwrite chronology with AI output (already enforced — confirmed in current generate-rcfa).

Pre-download guard in `InvestigationDetail.download()`:
- Compute the row list the report will render (same code path the report uses). If `inv.chronology.length !== renderedList.length`, block download and `toast.error("Chronology row count mismatch. Please review report generation.")`.

---

## 4. Date and time pickers

Use shadcn Calendar + Popover (`src/components/ui/calendar.tsx`, `popover.tsx`). Add small wrappers under `src/components/form/`:

- `<DatePickerField value onChange/>` — stores `dd-mm-yyyy`, displays `dd-mm-yyyy`.
- `<TimeInput value onChange/>` — wraps native `<input type="time">`, shows `h:mm am/pm` label.

Applied to:
- Date of Incident, Report Submission — date picker only.
- Time of Incident — time picker only.
- Investigation Initiated — date picker + time picker side-by-side, stored as `dd-mm-yyyy HH:mm`.
- Each chronology row — optional date picker + optional time picker + event text.

Internal storage canonical: dates `dd-mm-yyyy`, times `HH:mm` (24h). Display in UI and report: dates `dd-mm-yyyy`, times `h:mm am/pm`.

---

## 5–8. SOP/manual-specific AI questions

`supabase/functions/generate-rcfa/index.ts` (questions mode), add a pre-pass before the model call:

1. Build a per-document SOP corpus from `sopExcerpts[i].pages` (text + page when present).
2. Heuristic-tag candidate controls by scanning lines for keywords (case-insensitive):
   - startup / shutdown / power-off / isolation / emergency stop
   - inspection / check / verify / record / logbook / checklist
   - pressure / temperature / flow / load / level / limit / minimum / maximum + nearby numeric+unit
   - leak / loose / tighten / spill / hazard / fire / static / vapour / overpressure / connection
   - valve / pump / MCB / switch / line / tank / FCU / HMI (only those literally present)
3. Emit a `controls: { document, page?, text, tag }[]` list (≤40 entries, each ≤200 chars). Inject as `SOP/MANUAL EXTRACTED CONTROLS` in the user prompt alongside the existing grounded vocabulary.

`QUESTIONS_SYSTEM_PROMPT` updates:
- Each question must reference a specific extracted SOP control, manual limit, photo name, or user fact — never generic. Add explicit bad-vs-good examples.
- Per-question shape unchanged: `question`, `why`, `evidenceSource`. Add optional `sopRef` (document name + page only if both came from the control list — never invent pages).
- Missing checks framed as "To verify: …" (concrete physical/procedural items: missing logbook record, missing inspection evidence, missing pressure reading, missing shutdown confirmation, missing maintenance history, missing leak photo, missing witness interaction).

Filtering layer (post-AI), extend `genericRe` to also drop: `^was\s+(equipment|the\s+equipment)\s+inspected`, `^was\s+training\s+given`, `^did\s+the\s+operator\s+follow`.

Type/UI: add `AiQuestion.sopRef?: string`; render it as a small caption under each question in `AiQuestionsPanel.tsx`.

---

## 9. Final report uses only confirmed answers

In `InvestigationDetail.runGenerateFinal()`, filter `answers` to those with `status === 'answered'` AND non-empty `answer`. Send the remaining as a separate `pendingGaps` array.

`SYSTEM_PROMPT` (final mode) is tightened: WHY Tree, key factors, and recommendations must only use confirmed answers + user facts + SOP controls + accepted missing checks + selected categories. `pendingGaps` are listed only as pending investigation gaps in the appendix; never as facts or conclusions.

---

## 10. Sharper recommendations when SOP/manual/photos present

Final-mode system prompt addition: if `sopExcerpts.length > 0` or `photographs.length > 0`, each recommendation MUST tie to one of: missed SOP step (cite document), absent checklist item, missing record/logbook, missing visual verification, equipment manual limit, visible photo issue, repeated prior incident, follow-up to corrective action taken.

Extend forbidden phrases in `generate-rcfa/index.ts` with a new `FORBIDDEN_PHRASES` regex list: "improve safety", "enhance awareness", "optimize process", "consider advanced solutions". Apply inside `cleanString`. Drop any recommendation whose only content matches the ban list; for partial matches, strip the phrase.

---

## 11. Editing must not block AI questions

In `InvestigationDetail.tsx` Stage 1, when `isQuestionsStale` is true, show: `"Inputs changed. Existing AI questions may be outdated."` with two actions:
- `Keep existing questions` — dismisses the note for this session (component state only).
- `Regenerate questions` — existing confirm dialog; AI call only on confirm.

---

## 12. Officer-friendly stage labels

Relabel stage cards in `InvestigationDetail.tsx`:

1. Step 1 — Review Inputs (Back to Edit, Save Draft, Generate AI Questions).
2. Step 2 — AI Suggested Questions / Missing Checks (Answer / N.A. / Not Checked / Not Available).
3. Step 3 — Generate Final Report.

Move `RecommendationCategoriesPanel` into a `<Collapsible>` titled `Advanced: Guide Recommendation Type`, default closed (`src/components/ui/collapsible.tsx`). Not mandatory.

---

## 13. No dummy data

Audit: no prefilled examples exist in `NewInvestigation`, `AiQuestionsPanel`, `MissingChecksPanel`, `RecommendationCategoriesPanel`, or `Dashboard`. Confirm during implementation; no code change expected.

---

## NEW SAFEGUARDS

### A. Stale-report download protection

In `InvestigationDetail.tsx`, when `inv.aiReport` exists and `isStale` is true (`inv.aiInputHash !== currentHash` from `computeInputHash`):

- Display a red banner: `Report may be outdated. Inputs changed since last generation.`
- Disable the `Download Report` button by default while stale.
- Offer two unlock actions next to the banner:
  - `Regenerate AI Report` — runs `runGenerateFinal()` (existing path).
  - `Download existing report without regeneration` — sets a one-shot session flag that re-enables the Download button for the next click only; toast confirms `Downloading previous report — note: inputs have changed.` Flag clears immediately after download (or on stage change / regenerate).
- Old `aiReport` is never deleted on input edit (already preserved via `aiHistory`).

### B. SOP cache uses content hash, not filename

Update `computeQuestionsHash` (and `canonicalInputs`) in `src/data/investigationStore.ts`:

- Replace `(inv.photographs || []).map(p => p.name).sort()` with `{ name, hash }` where `hash = sha1(dataUrl)`.
- Replace `(inv.sopExcerpts || []).map(s => s.name).sort()` with `{ name, hash }` where `hash = sha1(JSON.stringify(s.pages))` (so any text-extraction change flips the hash).
- Keep all existing investigation-input fields in the canonical JSON so editing facts/chronology/etc. still invalidates the questions cache.
- `computeInputHash` (final-report cache) inherits the same canonicalInputs upgrade automatically.

Result: re-uploading a different SOP with the same filename, or any SOP text/photo change, invalidates cached questions and the final report.

### C. Back to Edit preserves all AI-stage state

Covered by §1 above; the edit save path explicitly carries over `aiQuestions`, `aiMissingChecks` (and per-row `answer`/`status`/`response`), `recommendationCategories`, `aiReport`, `aiInputHash`, `questionsInputHash`, `aiHistory`, `acceptedInvalidRows`, `includeSupportNotesInReport`, and the new `includePendingGapsInReport`. Edit mode never resets any of these.

### D. Pending gaps off by default in the downloaded report

- Add `includePendingGapsInReport?: boolean` to `HpgrdcInvestigation`.
- New checkbox under Stage 3 in `InvestigationDetail.tsx`: `Include pending investigation gaps in appendix.` Default unchecked.
- `HpgrdcReportView.tsx` and `src/utils/generateReport.ts` render the pending-gaps list inside the existing Appendix block only when this flag is true. Confirmed answers and recommendation categories continue to honor the existing `includeSupportNotesInReport` flag.
- Default downloaded report stays clean HPGRDC layout.

### E. Dashboard lab-name + reporter columns

Verify current `Dashboard.tsx` columns. If the visible ID column and large status badge are still present:

- Replace the ID column with **Lab Name** (`inv.labName || '—'`); keep ID accessible on hover/tooltip only.
- Replace the large status badge column with **Incident Reported By** (`inv.reportedBy || '—'`); status moves to a small inline pill.
- No theme or layout restyle — only the field shown in those two columns.

If both changes are already in place, skip this section.

---

## Acceptance checklist

1. Back-to-edit round-trips all inputs, SOPs, photos, AI questions, answers, missing-check responses, categories, and report state.
2. Chronology rows (date + time + event) all appear in the report; count-mismatch blocks download.
3. Chronology rendered as `time — event` (or `date, time — event`).
4. Calendar + time picker controls on every date/time field.
5. AI questions cite specific SOP controls (+ page when known) or photo names; generic templates filtered out.
6. Missing checks framed as "To verify: …".
7. Final report ignores unanswered questions for conclusions; lists them only as pending gaps.
8. Recommendations grounded in SOP/photo evidence; banned phrases dropped.
9. Recommendation categories collapsed under "Advanced".
10. Stale report cannot be downloaded silently — banner + explicit override required.
11. Questions cache invalidates on any SOP / photo / input content change, even if filename is identical.
12. Pending gaps appear in downloaded report only when the new checkbox is on.
13. Dashboard shows Lab Name + Reported By (if not already).
14. No dummy data anywhere.

## Files to change

- `src/types/investigation.ts` — chronology row `{date?, time?, event}`, `AiQuestion.sopRef?`, `HpgrdcInvestigation.includePendingGapsInReport?`
- `src/utils/validation.ts` — `formatChronologyLine(date?, time?, event)`
- `src/data/investigationStore.ts` — content-hashed photos + sopExcerpts in `canonicalInputs`
- `src/pages/NewInvestigation.tsx` — edit-mode load, date/time pickers, chronology row, save-draft, keep all chronology rows, attachment round-trip
- `src/pages/InvestigationDetail.tsx` — persistent action bar (top + bottom), stale-questions note, stale-report banner + override, stage relabel, collapsible categories, answered-only filter for final, chronology-count guard, pending-gaps checkbox
- `src/components/analysis/AiQuestionsPanel.tsx` — render `sopRef`
- `src/components/analysis/HpgrdcReportView.tsx` — new chronology renderer + conditional pending-gaps appendix
- `src/utils/generateReport.ts` — new chronology renderer + conditional pending-gaps appendix
- `src/pages/Dashboard.tsx` — Lab Name + Reported By columns (only if not already)
- `supabase/functions/generate-rcfa/index.ts` — SOP control extraction, stronger questions prompt + generic-question filter, answered-only handling + pendingGaps in final mode, extended forbidden-phrase filter
- (new) `src/components/form/DatePickerField.tsx`, `src/components/form/TimeInput.tsx`

No theme, dashboard layout, report template styling, or validation-logic changes.
