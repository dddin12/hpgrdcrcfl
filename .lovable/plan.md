## Goal

Match the HPGRDC Incident Investigation Report format. Render the same 13 fixed systems in fixed order under "Systems to be Reinforced"; AI only fills the Deficiency column. Section placed BEFORE "Recommendations" in both the on-screen view and the downloaded HTML report.

## Fixed 13 systems (constant order — never reorder/rename/add/remove)

1. Communication and Training
2. Management of Change
3. Incident Investigation/Communication
4. Observations and Audits
5. Planning & Emergency Response
6. Contractors Management
7. Quality Assurance
8. Mechanical Integrity
9. Pre-Start Up Safety Inspection
10. Process Technology
11. Risk Analysis
12. Safe Work Practices, SOP, SMP
13. Safety Leadership

System list is a frontend constant. AI only returns deficiencies keyed by exact system name.

## Display rules

- On-screen: blank deficiency → muted "No specific deficiency identified."
- Downloaded HTML report: blank deficiency cell stays blank (matches HPGRDC PDF exactly).
- Placement: BEFORE the Recommendations / Corrective Actions section in the downloaded report, matching HPGRDC flow.

## Changes

### 1. `src/types/investigation.ts`
- Add `systemsToReinforce?: { system: string; deficiency: string }[]` to `RcfaReport`.
- Export `SYSTEMS_TO_REINFORCE: string[]` constant (the 13 names, in order).

### 2. `supabase/functions/generate-rcfa/index.ts`
- Add a "SYSTEMS TO BE REINFORCED" block to the system prompt listing all 13 names verbatim. Instruct the model to return `systemsToReinforce` containing ONLY systems with a real, concrete, lab-actionable deficiency grounded in the incident, using the exact system name strings. Omit systems with no deficiency. No placeholders/N/A text.
- Add `systemsToReinforce` to `REPORT_SCHEMA` (array of `{ system, deficiency }`, both required). Not added to top-level `required`.

### 3. `src/components/analysis/RcfaReportView.tsx`
- New `Section` "Systems to be Reinforced" with 3-column table (Sr No. | System | Deficiency).
- Iterate over the 13-system constant; case/whitespace-insensitive lookup into `report.systemsToReinforce`. Empty → muted "No specific deficiency identified."
- Placed BEFORE Corrective Actions (section 9) so on-screen order mirrors the HPGRDC report flow.

### 4. `src/utils/generateReport.ts`
- Add the same 3-column table to the downloaded HTML, placed BEFORE the Recommendations / Corrective Actions section.
- Blank deficiency → empty `<td></td>` (no placeholder text).
- Renumber subsequent sections accordingly in the downloaded report.

### 5. `src/utils/fallbackReport.ts`
- Initialize `systemsToReinforce: []` on the template fallback.

## Out of scope
- Runtime editing of the 13-system list
- Letting the AI add custom systems
- Other report sections, dashboard, upload flow
