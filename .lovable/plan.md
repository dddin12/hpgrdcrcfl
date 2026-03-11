

## Issues Identified

1. **Settings page missing** — Sidebar links to `/settings` but no route/page exists, causing a 404/NotFound error.
2. **Excessive logo usage** — Logos appear redundantly on Dashboard hero, Investigation Detail branding bar, New Investigation header, Documents header, Risk Matrix header, Investigations header, and the top header bar. Need to reduce to only sidebar + top header + report PDF.
3. **Report uses `window.open` + `print()`** — Not a real downloadable PDF. Need to generate an actual PDF file using reportlab via a script, or use a proper client-side PDF library approach. Given the constraints, will use the browser print approach but improve it to feel more professional with a proper "Download PDF" flow.
4. **Hardcoded fake stats** — Dashboard shows "2 Open, 1 In Progress, 1 Under Review, 12 Closed" as static numbers. Need to compute stats dynamically from the mock data (or make them consistent with actual data).

## Plan

### 1. Create Settings Page
- Create `src/pages/Settings.tsx` with basic app settings (notification preferences, report defaults, theme).
- Add route in `App.tsx`.

### 2. Reduce Logo Overuse
- **Keep logos in**: Sidebar header, PDF report header/footer only.
- **Remove logos from**: Dashboard hero, Investigation Detail branding bar, New Investigation header, Documents header, Risk Matrix header, Investigations header, AppLayout top header.
- Replace with text-based headers where needed.

### 3. Fix Dashboard Stats to Be Dynamic
- Compute stats from `mockInvestigations` array dynamically instead of hardcoded "2", "1", "1", "12".
- Remove the fake "12 Closed" — only show actual counts from data.

### 4. Improve Report Download
- Keep the HTML-based print approach (it works and produces PDF via browser print dialog) but improve UX: show a toast notification, better button feedback.
- The report already has logos in the HTML — that stays.

### 5. Remove Fake AI Analysis
- Replace the setTimeout-based "AI analysis" with a more honest "Generate Analysis Summary" that builds structured output from the investigation data rather than pretending to be AI.

### Files to Create
- `src/pages/Settings.tsx`

### Files to Modify
- `src/App.tsx` — add Settings route
- `src/pages/Dashboard.tsx` — remove logo images, compute stats dynamically
- `src/pages/InvestigationDetail.tsx` — remove branding bar, keep report export
- `src/pages/NewInvestigation.tsx` — remove logo images from header
- `src/pages/Documents.tsx` — remove logo image
- `src/pages/RiskMatrix.tsx` — remove logo image
- `src/pages/Investigations.tsx` — remove logo image
- `src/components/layout/AppLayout.tsx` — remove logo from top header

