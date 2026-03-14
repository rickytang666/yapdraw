# excalidraw-mcp: Research Notes — Why It Works So Well

> Study of `/excalidraw-mcp/` for techniques we can apply to YapDraw.

---

## TL;DR

excalidraw-mcp works brilliantly because it was designed around **how LLMs actually generate text** — left-to-right, token-by-token, in a stream. Every design decision flows from that constraint. It doesn't fight the model; it gives the model a language it can reason in.

---

## 1. The System Prompt: Teaching Principles, Not Syntax

Most prompts dump a spec at the LLM. The cheat sheet in `src/server.ts` (`RECALL_CHEAT_SHEET`) teaches the LLM **how to think about diagrams**.

### Structured Learning Progression
1. Color palettes (establish a shared visual language)
2. Element types with examples (syntax + intent)
3. When to use labeled shapes vs. standalone text
4. Progressive drawing order (the "GOOD vs BAD" rule)
5. Camera/viewport as a first-class concept
6. Checkpoint/delta workflow (incremental updates)
7. Worked examples at the end (photosynthesis, MCP sequence)

### The Progressive Drawing Order Rule
```
GOOD: shape1 → label1 → arrow1 → shape2 → label2 → arrow2
BAD:  all rectangles → all arrows → all labels
```
This matters because **morphdom diffs the live SVG**. Elements appear in stream order. The GOOD pattern creates a coherent visual narrative as the diagram draws itself. The BAD pattern makes all shapes appear blank, then labels teleport in.

### "GOOD vs BAD" Language
The prompt uses imperative, evaluative framing. "CRITICAL: Arrows MUST have a points array." "ALWAYS use one of these exact camera sizes." This language is more reliable than neutral descriptions.

---

## 2. The Camera System: The LLM Controls Attention

The most surprising feature: `cameraUpdate` is a pseudo-element inside the JSON array.

```json
{ "type": "cameraUpdate", "x": 100, "y": 50, "width": 800, "height": 600 }
```

- Fits naturally into the streaming JSON — no separate instruction language
- The LLM emits camera pans _interleaved_ with elements (e.g., reveal left side, draw shapes, pan right, draw more)
- The widget lerps to the target viewport with `LERP_SPEED = 0.03` — smooth camera movement from discrete LLM instructions
- Enforced 4:3 aspect ratio ("ALWAYS use one of these exact sizes") with a `fixViewBox4x3()` corrector as fallback

**What this teaches us for YapDraw:** We have `scrollToContent()` but no concept of the LLM controlling _where the user looks_ during generation. This is a major UX lever we're not using.

---

## 3. The Checkpoint System: Token-Efficient Incremental Updates

The core insight: **don't re-send the full diagram on every update.**

### How It Works
The LLM sends:
```json
[
  { "type": "restoreCheckpoint", "id": "abc123" },
  { "type": "delete", "ids": "old-node,old-arrow" },
  { "type": "rectangle", "id": "new-node", ... }
]
```

The server:
1. Loads the full element array from the checkpoint store (`FileCheckpointStore` / Redis / Memory)
2. Applies deletes (including `containerId` cleanup — removes bound text auto)
3. Merges new elements on top
4. Saves the resolved result as a _new_ checkpoint, returns its ID

The LLM only sees/sends diffs. The full diagram state lives on the server.

### Three-Tier Storage
| Env | Implementation | Notes |
|-----|---------------|-------|
| Local dev | `FileCheckpointStore` | `$TMPDIR/excalidraw-mcp-checkpoints/` |
| Vercel + Upstash | `RedisCheckpointStore` | `cp:${id}`, 30-day TTL |
| Vercel fallback | `MemoryCheckpointStore` | In-process Map, LRU eviction |

### `containerId` Delete Cascade
```typescript
base.filter(el => !deleteIds.has(el.id) && !deleteIds.has(el.containerId))
```
When you delete a labeled shape, its bound text element auto-deletes. The LLM never needs to track which text element belongs to which shape.

**What this teaches us for YapDraw:** Our `currentElements` approach re-sends the full array on every call. For large diagrams this wastes tokens and confuses the model. A checkpoint system (even just localStorage-keyed) would let the LLM send deltas.

---

## 4. The Rendering Pipeline: Built for Streaming

### Three Rendering Paths

**A. Partial/Streaming (`ontoolinputpartial`)**
- `parsePartialElements()`: tries `JSON.parse`, falls back to finding last `}` and appending `]`
- `excludeIncompleteLastItem()`: drops the last element (may be mid-stream)
- Only re-renders when element **count** changes (not every token)
- Randomizes `seed` values for hand-drawn animation variation
- Plays pencil audio per new element

**B. Final (`ontoolinput`)**
- Parses complete JSON (no partial handling needed)
- Loads checkpoint async, merges base + new elements
- Uses stable seeds (not jittered)
- Captures initial element state for user edit detection

**C. User-Edited (after fullscreen editor)**
- `exportToSvg()` with edited elements
- `morphdom` diff against existing DOM

### morphdom for Smooth Diffing
Instead of `innerHTML = svg.outerHTML`:
```typescript
const existing = wrapper.querySelector("svg");
if (existing) morphdom(existing, svg, { childrenOnly: false });
else wrapper.appendChild(svg);
```
`morphdom` patches the DOM in-place → only new nodes get CSS animations. Existing shapes stay still. Without it, all animations restart on every render.

### CSS Animation Stack
```css
/* Shapes fade in */
g, rect, ellipse { animation: svgFadeIn 0.5s ease-out; }

/* Lines/arrows draw on */
path, line { animation: strokeDraw 0.6s ease-out forwards; }
@keyframes strokeDraw {
  from { stroke-dashoffset: 1000; }
  to   { stroke-dashoffset: 0; }
}

/* Property transitions */
rect, path, text { transition: fill 0.4s, stroke 0.4s, opacity 0.4s; }
```

### Pencil Audio
Each new element plays a randomized pencil stroke sample:
- Random playback rate (0.85–1.2) for pitch variation
- Per-type gain (shapes louder, text quieter, arrows in between)
- Random offset + duration within the sample
- Result: no two strokes sound identical, human hand illusion

---

## 5. Validation & Normalization

### Element Conversion Pipeline
```typescript
function convertRawElements(els: any[]): any[] {
  const pseudoTypes = new Set(["cameraUpdate", "delete", "restoreCheckpoint"]);
  const real = els.filter(el => !pseudoTypes.has(el.type));

  // Add default label alignment
  const withDefaults = real.map(el =>
    el.label ? { ...el, label: { textAlign: "center", verticalAlign: "middle", ...el.label } } : el
  );

  // Expand labels → bound text elements
  const converted = convertToExcalidrawElements(withDefaults, { regenerateIds: false })
    .map(el => el.type === "text" ? { ...el, fontFamily: FONT_FAMILY.Excalifont } : el);

  return [...converted, ...pseudos];
}
```

Steps:
1. Separate pseudo-elements from real elements
2. Add `textAlign: "center", verticalAlign: "middle"` to all labels
3. `convertToExcalidrawElements` expands labels → separate bound text elements
4. Force all text to Excalifont
5. Re-attach pseudo-elements at the end

### `regenerateIds: false`
Critical everywhere. If IDs change, `startBinding`/`endBinding` references break, checkpoints can't be restored.

### Opacity-Based Delete (not array delete)
For streaming renders, deleted elements are set to `opacity: 1` (Excalidraw's "unset") rather than removed. This preserves SVG group order so morphdom matches correctly without cascading re-animations.

---

## 6. User Edit Detection & Diff Feedback Loop

### How Edits Are Detected
```typescript
// Snapshot: "id1:version1,id2:version2,..."
const currentSnapshot = JSON.stringify(elements.map(el => el.id + ":" + (el.version ?? 0)));
if (currentSnapshot === initialSnapshot) return; // bail early
```

### Diff Format
After 2s debounce:
```
User edited diagram (checkpoint: abc123).
Added: rectangle "New Node" at (300,200).
Removed: old-arrow.
Moved/resized: r1 → (150,200) 250x100
```

This is sent to the model via `updateModelContext()` so on the next turn the LLM knows exactly what changed without a screenshot.

### Why This Matters
The LLM gets a **text diff** of what the user changed. It can then decide to accept the edit (send restoreCheckpoint with the new ID) or override it (send restoreCheckpoint with previous ID + new elements). The model has real agency over the diagram state.

---

## 7. Two-Coordinate-Space Design

The LLM thinks in **scene coordinates** (absolute `x`, `y`). The system handles:
- Bounds computation (min x/y across all elements + arrow points)
- Export padding (+20px)
- ViewBox adjustment

```typescript
// Scene → SVG export offset
{ x: vp.x - sceneMinX + EXPORT_PADDING, y: vp.y - sceneMinY + EXPORT_PADDING }
```

The LLM never needs to think about "what are my bounds" or "how much padding". It places elements with absolute coordinates and the system adapts.

---

## 8. What YapDraw Should Steal

Ranked by impact vs. effort:

### High Impact, Low Effort
1. **Lower temperature** (0.7 → 0.2) — done ✓
2. **Strip internal Excalidraw fields** before sending currentElements — done ✓
3. **Filter invalid pseudo-types** in mergeElements — done ✓
4. **Don't preserve arrow positions** during merge — done ✓
5. **Fix prompt examples** (remove cameraUpdate, restoreCheckpoint from output format) — done ✓

### High Impact, Medium Effort
6. **Progressive drawing order instruction** — add to our system prompt: "emit each shape followed immediately by its arrows, not all shapes then all arrows"
7. **`textAlign: "center", verticalAlign: "middle"` defaults** — add to our `normalizeLinearElement` or the API route response handler
8. **Arrow label defaults** — ensure arrows get `strokeColor`, `strokeWidth`, `endArrowhead` defaults if missing

### High Impact, High Effort
9. **Checkpoint system** — replace "send full currentElements" with checkpoint ID + delta approach
10. **User edit diffing** — detect manual canvas changes, send text diff to LLM as context
11. **morphdom diffing** — for smoother streaming renders instead of full scene updates

### Low Priority (YapDraw-specific reasons)
- Camera/viewport system: YapDraw uses `scrollToContent()` which is sufficient for voice-driven flow
- Pencil audio: nice polish but Sprint 3 material
- Fullscreen editor integration: already provided by Excalidraw embed

---

## 9. Key Code References

| Technique | File | Lines |
|-----------|------|-------|
| RECALL_CHEAT_SHEET | `src/server.ts` | 22–395 |
| Progressive drawing order | `src/server.ts` | 116–120 |
| Camera pseudo-element | `src/server.ts` | 102–170 |
| Checkpoint store | `src/checkpoint-store.ts` | whole file |
| Checkpoint merge logic | `src/server.ts` | 453–481 |
| `convertRawElements` | `src/mcp-app.tsx` | 23–106 |
| Partial JSON parsing | `src/mcp-app.tsx` | 23–29 |
| Streaming render | `src/mcp-app.tsx` | 474–530 |
| morphdom diffing | `src/mcp-app.tsx` | 375–380 |
| CSS animations | `src/mcp-app.tsx` | (inline styles) |
| User edit detection + diff | `src/edit-context.ts` | 34–123 |
| `fixViewBox4x3` | `src/mcp-app.tsx` | ~280 |
| Pencil audio | `src/pencil-audio.ts` | 47–96 |
