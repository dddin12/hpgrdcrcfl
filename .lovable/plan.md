

## Fishbone Diagram Redesign

The current implementation is just a grid of category cards — it looks nothing like an Ishikawa fishbone diagram. Need to rebuild it as an actual fishbone shape with:

- A **horizontal central spine** (the "backbone") pointing to the effect/problem on the right
- **Diagonal bones** angling off the spine — 3 categories above, 3 below
- **Cause labels** along each diagonal bone as smaller branches
- SVG-based rendering for the lines/bones

### Layout Structure

```text
   Equipment      Process       People
     \   \          |   |        /   /
      \   \         |   |       /   /
───────\───\────────|───|──────/───/──── ▶ [EFFECT]
       /   /        |   |      \   \
      /   /         |   |       \   \
   Maintenance  Environment  Management
```

### Technical Approach

**File: `src/components/analysis/FishbonePanel.tsx`** — Full rewrite:
- Use SVG for the spine line and diagonal bone lines
- Position category labels at the ends of diagonal bones using absolute positioning or SVG text
- Cause items rendered as small text along each bone
- 3 categories on top (Equipment, Process, People), 3 on bottom (Maintenance, Environment, Management)
- The effect box sits at the right end of the spine (the "fish head")
- Use `framer-motion` for animated line drawing (`pathLength`) and staggered cause reveals
- Horizontally scrollable container with `min-width` for smaller screens

