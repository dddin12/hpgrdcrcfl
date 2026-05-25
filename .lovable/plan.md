
# Fix: Pending AI Questions must not block final report

Scope is UI + small client-logic only. AI flow, validation, report styling, dashboard theme — unchanged. The edge function already filters to `status === 'answered'` and emits `pendingGaps`; nothing on the backend needs to change.

## 1. `src/components/analysis/AiQuestionsPanel.tsx`

- Add a shared `isPending(q)` helper: pending iff status is missing, `not_checked`, `not_available`, or `answered` with blank answer. **`na` is NOT pending.**
- Every card gets `id={`aiq-${q.id}`}` and `data-pending` when `isPending(q)`.
- Pending card styling: amber left border + faint amber background using existing tokens (`border-amber-500/50 bg-amber-500/5`).
- Under the header of a pending card, one-line hint:
  *"Response pending — select Answered / N.A. / Not checked / Evidence not available."*
- Replace top "{n} pending" with a button **"{n} questions need status"** that smooth-scrolls to the first `[data-pending]` card. Hidden when `n === 0`.
- Above the cards (only when `n > 0`), render a **Pending AI Questions** list with `Question #{index}: {truncated text}` and a **Jump to question** link per row.
- Status buttons unchanged. Typing an answer still auto-sets `answered`; clearing reverts to `not_checked`. **No code path silently flips a pending question to `answered` or `na`.**

## 2. `src/pages/InvestigationDetail.tsx`

- Compute `pendingUnanswered` with the same `isPending` rule (N/A excluded; Not checked / Evidence not available / blank counted).
- Remove the `window.confirm` block in `confirmFinalIfPending`. Final Report is always reachable.
- When `pendingUnanswered > 0`, the primary CTA becomes **"Continue with Pending Questions"** and opens an AlertDialog:
  - Title: *"Continue with pending AI questions?"*
  - Body: *"Some AI-suggested investigation questions are unanswered. These will not be used as facts or conclusions. They will be treated only as pending investigation gaps."*
  - Actions: **Go Back and Answer** (cancel) / **Continue Anyway** → calls `runGenerateFinal` directly.
- **Safeguard**: `runGenerateFinal` must not mutate `inv.aiQuestions`. The existing split already sends only `status === 'answered' && answer.trim()` rows as `answers`; everything else (including N/A) is partitioned as before. Re-verify and add an inline comment so future edits don't regress.
  - Refinement: exclude `na` from `pendingGaps` payload too, so N/A questions are simply dropped from the final-mode body (not treated as pending, not treated as facts).
- Keep the existing **"Include pending investigation gaps in appendix"** checkbox (default off). Remove the misleading sub-line "these will remain as visible investigation gaps" since gaps are now opt-in.
- `pendingUnanswered === 0` → CTA stays **Generate Final Report**, no extra confirm.

## 3. Answered-only guarantee (verify, no edit expected)

`supabase/functions/generate-rcfa/index.ts` already treats only `status === 'answered'` as facts; WHY Tree / Key Factors / Recommendations consume `answers`. `HpgrdcReportView` + `generateReport` already gate the gaps appendix on `includePendingGapsInReport`. Spot-check during build mode.

## Files touched

- `src/components/analysis/AiQuestionsPanel.tsx`
- `src/pages/InvestigationDetail.tsx`

## Out of scope (unchanged)

- `supabase/functions/generate-rcfa/index.ts`
- Report templates, dashboard, validation logic, theme.
