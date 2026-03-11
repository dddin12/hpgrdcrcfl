

## Three Issues to Fix

### 1. Functional File Upload in New Investigation
The attachments drop zone (lines 114-128 of `NewInvestigation.tsx`) is purely decorative -- no `<input type="file">`, no drag-drop handlers, no state for attached files.

**Changes to `src/pages/NewInvestigation.tsx`:**
- Add `attachments` state as `File[]`
- Add hidden `<input type="file" multiple>` with ref
- Wire the drop zone with `onClick` to trigger file input, `onDragOver`/`onDrop` handlers
- Display attached file names with remove buttons below the drop zone
- Import `toast` from sonner for feedback

### 2. Cause Tree -- Real Tree Layout
Currently `CauseTreePanel.tsx` renders nodes vertically stacked with left indentation (`ml-6 border-l-2`). It looks like a flat list, not a tree.

**Changes to `src/components/analysis/CauseTreePanel.tsx`:**
- Redesign to a **top-down tree layout** using CSS flexbox
- Root node at top center, children spread horizontally below with connecting lines using CSS `::before`/`::after` pseudo-elements (or inline SVG lines)
- Each level fans out horizontally: Effect → Immediate → Contributing → Root Causes
- Add animated SVG connector lines between parent and child nodes
- Use `framer-motion` for staggered reveal of each tree level

### 3. Logos in Downloaded Report
The report HTML in `generateReport.ts` has no logos -- just text headers.

**Changes to `src/utils/generateReport.ts`:**
- Convert the logo PNGs to base64 data URIs at build time (import them)
- To embed in HTML report: create a helper that reads the logos as base64 using a canvas approach at runtime, or import them as URLs and use `fetch` + `FileReader` to convert to data URIs before building the HTML
- Add both logos to the report header (HP logo left, RnD logo right) and a smaller version in the footer

### Files to Modify
- `src/pages/NewInvestigation.tsx` -- functional file upload
- `src/components/analysis/CauseTreePanel.tsx` -- horizontal tree layout
- `src/utils/generateReport.ts` -- embed logos as base64 in report HTML

