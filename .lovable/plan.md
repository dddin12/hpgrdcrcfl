

## Issues Found

1. **Document upload is non-functional** — The "Upload Document" button and drag-drop zone are purely decorative with no file input or state management. No files can actually be uploaded.

2. **Report download blocked** — The report uses `window.open('', '_blank')` which is blocked by popup blockers (especially in the Lovable preview iframe). Users see nothing happen when clicking "Download Report".

## Plan

### 1. Make Document Upload Functional
**File: `src/pages/Documents.tsx`**
- Add a hidden `<input type="file">` that accepts PDF, DOCX, TXT files
- Wire the "Upload Document" button and drag-drop zone to trigger file selection
- Add drag-and-drop event handlers (`onDragOver`, `onDrop`) to the drop zone
- Store uploaded documents in React state (merged with existing mock documents)
- Show upload progress animation and success toast
- Parse file metadata (name, size, type) and add to the documents list
- Add ability to delete/remove uploaded documents

### 2. Fix Report Download
**File: `src/utils/generateReport.ts`**
- Replace `window.open` + `print()` approach with generating an HTML Blob and triggering a direct file download as an `.html` file (universally works, no popup blocker issues)
- Alternative: use the Blob approach to create a downloadable file that users can open and print to PDF from their browser
- Add a toast notification confirming the download started

### 3. Add Toast for Feedback
**File: `src/pages/InvestigationDetail.tsx`**
- Import and use `sonner` toast to confirm report download success
- Show toast on document upload success in Documents page

### Files to Modify
- `src/pages/Documents.tsx` — full upload functionality with file input, drag-drop, state management
- `src/utils/generateReport.ts` — replace popup approach with Blob download
- `src/pages/InvestigationDetail.tsx` — add toast feedback on export
- `src/types/investigation.ts` — add `file` field to `UploadedDocument` type if needed

