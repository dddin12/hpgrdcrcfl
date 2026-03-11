

## Changes Overview

Four files to modify across four concerns.

### 1. Update Mock Data — Engine Lab Context + "Dinesh Deva"
**File: `src/data/mockData.ts`**
- Replace INV-2026-001: Keep HPLC as is (it's the detailed one with full analysis)
- Replace INV-2026-002: "Materials Testing Lab" → "Engine Performance Lab", "Universal Testing Machine — Instron 5985" → "Transient Engine Dynamometer — AVL PUMA Open", operator → "Dinesh Deva", description about engine dyno anomaly during transient emissions test
- Replace INV-2026-003: "Polymer Research Lab" → "Vehicle Dynamics Lab", "Extruder — Brabender TSE 20/40" → "Chassis Dynamometer — Horiba VULCAN II", description about overheating during coast-down simulation, operator → "Dinesh Deva"
- Update matching documents (DOC-005 → Transient Dyno SOP)

### 2. Responsive & Colorful Fishbone
**File: `src/components/analysis/FishbonePanel.tsx`** — Full rewrite
- Switch from fixed-pixel SVG (900x440 viewBox) to a **responsive flexbox/CSS layout** that works at any width
- Use a horizontal central spine via a CSS border/line
- Each category gets a **distinct color**: Equipment=red, Process=blue, People=green, Maintenance=orange, Environment=teal, Management=purple
- Category cards with colored borders and backgrounds
- Cause items as colored pills/tags along each bone
- Use `useRef` + resize observer or just percentage-based layout
- Mobile: stack categories vertically with the spine running down the center

### 3. Interactive Cause Tree — Expand/Collapse Nodes
**File: `src/components/analysis/CauseTreePanel.tsx`**
- Add `collapsed` state tracking which nodes are collapsed (by label or index)
- Click on any node with children to toggle expand/collapse
- Show a chevron indicator on nodes with children
- Animate expand/collapse with framer-motion
- Update mock data to use engine-lab relevant cause tree

### 4. 5 Whys — User Input Option + AI Progression
**File: `src/components/analysis/FiveWhysPanel.tsx`**
- After AI suggests a "Why" answer, show two options:
  1. **"Accept & Continue"** — accepts the AI answer and reveals next why
  2. **"I know the answer"** — shows a text input where user types their own answer, which then replaces the AI suggestion
- Store the whys in state (not from const) so user edits persist
- After user provides custom input, the next AI-suggested "Why" question adapts (show it based on their answer)
- Add an "Edit" button on already-revealed answers so user can correct any step
- Update sample data to be engine-dyno relevant

### Files
- `src/data/mockData.ts` — engine lab data, Dinesh Deva
- `src/components/analysis/FishbonePanel.tsx` — responsive colorful redesign
- `src/components/analysis/CauseTreePanel.tsx` — interactive expand/collapse + engine data
- `src/components/analysis/FiveWhysPanel.tsx` — user input option + engine data

