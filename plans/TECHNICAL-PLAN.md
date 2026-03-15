# YapDraw — Technical Plan

## Prize Track Strategy

| Track                                       | Effort                                            | Verdict                       |
| ------------------------------------------- | ------------------------------------------------- | ----------------------------- |
| **Main prize**                              | —                                                 | Primary goal                  |
| **Bitdeer — Production-Ready AI Tool**      | Near zero — just build well and deploy            | Yes, target this              |
| **IBM — Best AI Hack using IBM Technology** | ~2 hrs Sprint 3 — swap LLM call to watsonx.ai     | Yes, if one person volunteers |
| **Moorcheh — Efficient Memory**             | ~4 hrs, requires Python service alongside Next.js | Skip                          |

---

## Tech Stack

| Layer             | Choice                                     | Reason                                                                                          |
| ----------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Framework         | Next.js 14 (App Router)                    | Vercel-native, API routes built in                                                              |
| Language          | TypeScript                                 | Catches schema mismatches on Excalidraw types early                                             |
| Diagramming       | `@excalidraw/excalidraw`                   | Real Excalidraw embed with `updateScene` API                                                    |
| Speech (primary)  | Deepgram real-time STT via `@deepgram/sdk` | Accurate on technical vocab, handles noisy rooms, WebSocket streaming                           |
| Speech (fallback) | Web Speech API                             | Zero-setup backup if Deepgram integration stalls                                                |
| LLM (primary)     | OpenAI `gpt-4o` via `openai` SDK           | Best at producing valid native Excalidraw JSON reliably; use `gpt-4o-mini` if cost is a concern |
| LLM (IBM track)   | IBM watsonx.ai                             | Swap-in for IBM prize track only; keep OpenAI as fallback                                       |
| Styling           | Tailwind CSS                               | Fast layout iteration                                                                           |
| Deployment        | Vercel                                     | Zero-config Next.js deploy — required for Bitdeer "production-ready" judging                    |

### Browser Requirement

Any modern browser. Deepgram works everywhere (WebSocket). Web Speech API fallback is Chrome/Edge only — document this.

---

## Data Storage

No database. All state is ephemeral and lives in the browser.

| Data                | Where it lives                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Excalidraw elements | React state (`useState`) + Excalidraw's internal scene                                    |
| Transcript text     | React state                                                                               |
| Interim speech      | React state (wiped after each transcript update)                                          |
| LLM loading state   | React state                                                                               |
| Session continuity  | `localStorage` — save element JSON + transcript on every update, restore on page load     |
| Diagram export      | Client-side blob via `exportToBlob` / `exportToSvg` — downloaded directly, never uploaded |

`localStorage` gives "resume last session" for free with no backend.

---

## LLM Element Format — Native Excalidraw JSON (inspired by excalidraw-mcp)

**The LLM generates native Excalidraw JSON directly.** There is no intermediate schema, no abstract `type` system, no color mapping code. The LLM decides shapes, colors, layout, and connections for whatever diagram the user describes. This makes YapDraw work for any diagram — not just architecture.

The system prompt gives the LLM a **cheat sheet** (see `lib/prompts.ts`) covering:

### Available shapes

```jsonc
// Rectangle (use for most boxes)
{ "type": "rectangle", "id": "web-app", "x": 100, "y": 100, "width": 160, "height": 60,
  "strokeColor": "#1971c2", "backgroundColor": "#a5d8ff",
  "label": { "text": "Web App", "fontSize": 16 } }

// Rounded rectangle (processes, services)
{ "type": "rectangle", "id": "api", "x": 320, "y": 100, "width": 160, "height": 60,
  "roundness": { "type": 3 },
  "strokeColor": "#2f9e44", "backgroundColor": "#b2f2bb",
  "label": { "text": "API", "fontSize": 16 } }

// Diamond (decisions)
{ "type": "diamond", "id": "is-valid", "x": 200, "y": 220, "width": 160, "height": 80,
  "strokeColor": "#e67700", "backgroundColor": "#ffd8a8",
  "label": { "text": "Valid?", "fontSize": 14 } }

// Ellipse (start/end in flowcharts)
{ "type": "ellipse", "id": "start", "x": 200, "y": 40, "width": 120, "height": 50,
  "strokeColor": "#2f9e44", "backgroundColor": "#b2f2bb",
  "label": { "text": "Start", "fontSize": 14 } }

// Arrow (connection between elements)
{ "type": "arrow", "id": "web-to-api",
  "startBinding": { "elementId": "web-app", "fixedPoint": [1, 0.5] },
  "endBinding":   { "elementId": "api",     "fixedPoint": [0, 0.5] },
  "label": { "text": "REST", "fontSize": 12 } }

// Text (standalone label, use sparingly — prefer shape labels)
{ "type": "text", "id": "note-1", "x": 100, "y": 300,
  "text": "Deployed on AWS", "fontSize": 13, "strokeColor": "#868e96" }
```

### Arrow `fixedPoint` reference

| Side   | fixedPoint |
| ------ | ---------- |
| right  | `[1, 0.5]` |
| left   | `[0, 0.5]` |
| top    | `[0.5, 0]` |
| bottom | `[0.5, 1]` |

### Color palette (LLM chooses, no code mapping)

| Use               | Stroke    | Fill      |
| ----------------- | --------- | --------- |
| Primary / blue    | `#1971c2` | `#a5d8ff` |
| Green / success   | `#2f9e44` | `#b2f2bb` |
| Orange / warning  | `#e67700` | `#ffd8a8` |
| Purple / external | `#6741d9` | `#e5dbff` |
| Red / danger      | `#c92a2a` | `#ffc9c9` |
| Grey / neutral    | `#495057` | `#f1f3f5` |

### Stable element IDs (agreed in Sprint 0, never changed)

Element IDs must be stable across LLM calls so positions are preserved when the diagram updates.

**Rule:** ID = `kebab-case` of the element's label. Examples: `"Web App"` → `web-app`, `"Valid?"` → `valid`, `"Send Email"` → `send-email`.

- LLM is instructed to always use this format
- On re-render, existing elements matching by ID keep their `x`/`y` positions
- This is the contract `excalidraw-helpers.ts` depends on — don't break it

---

## File Structure

```
yapdraw/
├── app/
│   ├── layout.tsx                        # Root layout, fonts, metadata
│   ├── page.tsx                          # Split-screen: VoicePanel + ExcalidrawCanvas
│   └── api/
│       ├── generate-diagram/
│       │   └── route.ts                  # POST: transcript + current elements → updated Excalidraw JSON
│       └── deepgram-token/
│           └── route.ts                  # GET: returns short-lived Deepgram browser token
│
├── components/
│   ├── ExcalidrawCanvas.tsx              # Excalidraw embed + updateScene logic
│   ├── VoicePanel.tsx                    # Left panel shell (mic + transcript)
│   ├── MicButton.tsx                     # Record toggle, visual state
│   ├── TranscriptDisplay.tsx             # Final sentences list
│   ├── InterimIndicator.tsx              # Greyed-out live speech text
│   └── LoadingIndicator.tsx             # "Thinking..." overlay on canvas
│
├── hooks/
│   ├── useDeepgram.ts                    # Deepgram WebSocket, transcript accumulation, silence detection
│   ├── useSpeechFallback.ts              # Web Speech API fallback (same interface as useDeepgram)
│   └── useDiagramState.ts               # Element array state, ID-preserving merge, localStorage sync
│
├── lib/
│   ├── prompts.ts                        # System prompt cheat sheet (shapes, colors, ID rules, examples)
│   ├── llm.ts                            # OpenAI call, parse + strip non-Excalidraw fields
│   └── excalidraw-helpers.ts            # mergeElements (ID-based position preservation), overlap nudge
│
├── types/
│   └── diagram.ts                        # Thin wrappers around Excalidraw types + LLMResponse
│
└── public/
    └── (static assets)
```

---

## File Ownership (no two people touch the same file)

This table is the source of truth for avoiding merge conflicts. If you need to touch someone else's file, talk first.

| File                                | Owner       | Notes                                                                 |
| ----------------------------------- | ----------- | --------------------------------------------------------------------- |
| `app/layout.tsx`                    | Sprint 0    | Set up once, don't touch                                              |
| `app/page.tsx`                      | P4          | Imports stubs from P1/P3 — works immediately, fills in as they finish |
| `app/api/generate-diagram/route.ts` | P2          |                                                                       |
| `app/api/deepgram-token/route.ts`   | P3          |                                                                       |
| `components/ExcalidrawCanvas.tsx`   | P1          |                                                                       |
| `components/VoicePanel.tsx`         | P4          |                                                                       |
| `components/MicButton.tsx`          | P3          |                                                                       |
| `components/TranscriptDisplay.tsx`  | P3          |                                                                       |
| `components/InterimIndicator.tsx`   | P3          |                                                                       |
| `components/LoadingIndicator.tsx`   | P4          |                                                                       |
| `hooks/useDeepgram.ts`              | P3          |                                                                       |
| `hooks/useSpeechFallback.ts`        | P3          |                                                                       |
| `hooks/useDiagramState.ts`          | P1          |                                                                       |
| `lib/prompts.ts`                    | P2          |                                                                       |
| `lib/llm.ts`                        | P2          |                                                                       |
| `lib/excalidraw-helpers.ts`         | P1          |                                                                       |
| `types/diagram.ts`                  | Sprint 0    | Agreed types — change only with full team sign-off                    |
| `.env.local`                        | Each person | Add your own keys locally, never commit this file                     |

---

## Sprint 0 — Project Setup (One Person, ~45 min, before clock starts if possible)

**Who:** Whoever is fastest at scaffolding. Everyone else sets up their dev environment in parallel.

**Goal:** Push a working skeleton so all four people can `git pull`, branch, and immediately start their Sprint 1 task without waiting on each other.

### Steps

- [x] Create repo on GitHub, share URL with team
- [x] `npx create-next-app@latest yapdraw --typescript --tailwind --app`
- [x] `npm install @excalidraw/excalidraw openai @deepgram/sdk`
- [x] Create `.env.example` with all keys (no values):
  ```env
  OPENAI_API_KEY=
  DEEPGRAM_API_KEY=
  WATSONX_API_KEY=
  WATSONX_PROJECT_ID=
  USE_WATSONX=false
  ```
- [x] Verify `.env.local` is in `.gitignore`
- [x] Create `types/diagram.ts` with agreed types:

  ```ts
  // Elements are native Excalidraw JSON — the LLM generates them directly.
  // We use `any` here and rely on Excalidraw's own runtime validation.
  // The only constraint we enforce: every element must have a stable kebab-case id.
  export type ExcalidrawElement = Record<string, any> & { id: string };

  export interface LLMResponse {
    elements: ExcalidrawElement[];
  }
  ```

- [x] Create stub files for every file in the structure — just enough to export a no-op so imports don't break:
  - `components/ExcalidrawCanvas.tsx` → `export default function ExcalidrawCanvas() { return <div /> }`
  - `components/VoicePanel.tsx`, `MicButton.tsx`, `TranscriptDisplay.tsx`, `InterimIndicator.tsx`, `LoadingIndicator.tsx` → same pattern
  - `hooks/useDeepgram.ts`, `useSpeechFallback.ts`, `useDiagramState.ts` → stub hooks returning correct shapes
  - `lib/prompts.ts` → `export const SYSTEM_PROMPT = ''`
  - `lib/llm.ts` → stub async function returning `[]`
  - `lib/excalidraw-helpers.ts` → stub functions
  - `app/api/generate-diagram/route.ts` → `export async function POST() { return Response.json({ elements: [] }) }`
  - `app/api/deepgram-token/route.ts` → `export async function GET() { return Response.json({ token: '' }) }`
- [x] Wire stubs into `app/page.tsx` so `npm run dev` boots without errors
- [x] Confirm `npm run dev` loads a blank page with no TypeScript or console errors
- [x] Push to `main`
- [x] Each person: `git pull`, then `git checkout -b p1-canvas` (or `p2-llm`, `p3-voice`, `p4-layout`)

### After Sprint 0 — Branch Strategy

```
main
├── p1-canvas    # P1 works here
├── p2-llm       # P2 works here
├── p3-voice     # P3 works here
└── p4-layout    # P4 works here
```

Merge into `main` at sprint boundaries. **P4 merges last each time** — `page.tsx` imports from everyone, so merging after P1/P3 means near-zero conflicts.

---

## Sprint 1 Steps — The Working Loop (Hours 0–8)

### P1 — Canvas + Render Pipeline

- [x] Create `ExcalidrawCanvas.tsx` — embed `<Excalidraw>` with a ref to the API object
- [x] Expose `updateDiagram(elements: ExcalidrawElement[])` via `useImperativeHandle` or a callback prop
- [x] Inside `updateDiagram`: call `convertToExcalidrawElements(incoming)` (handles label → bound text), then `updateScene({ elements: merged })`
- [x] Implement `excalidraw-helpers.ts` → `mergeElements(existing, incoming)`:
  - Match by `id`; for matches, copy `x`, `y`, `width`, `height` from existing (preserves manual drags)
  - Append new elements at LLM-provided positions
- [x] Call `scrollToContent()` after each `updateScene`
- [x] Smoke test: hardcode 3 native Excalidraw elements (2 rectangles + 1 arrow with bindings) and confirm they render with a connection
- [x] Fix canvas size limit error with safe max dimensions
- [x] Load initial data from localStorage using `initialData` prop

### P2 — LLM API Route

- [x] Add `OPENAI_API_KEY` to `.env.local`
- [x] Write the cheat sheet system prompt in `lib/prompts.ts` — include:
  - All shape types with example JSON (rectangle, rounded rectangle, diamond, ellipse, arrow with `startBinding`/`endBinding`, text)
  - Arrow `fixedPoint` reference table
  - Color palette table
  - ID rules: kebab-case of label, stable across calls
  - Layout guidance: sensible `x`/`y` spacing (~200px between elements), top-to-bottom or left-to-right flow
  - Few-shot examples covering: architecture diagram, flowchart with decision diamond, business process
  - Explicit instruction: return a JSON object `{ "elements": [...] }` — no markdown, no explanation
- [x] Create `route.ts`: accepts `{ transcript, currentElements }`, calls `gpt-4o` with `response_format: { type: "json_object" }`, returns `elements` array
- [x] In `lib/llm.ts`: parse response, strip any non-standard fields if needed, return `ExcalidrawElement[]`
- [x] Test with `curl` — verify arrows have `startBinding`/`endBinding`, shapes have correct geometry
- [x] Support graph-based layout system with nodes/edges/groups
- [x] Support multiple diagram types (freeform, system architecture, process flowchart)

### P3 — Voice (Deepgram) + Silence Detection

- [x] Create `app/api/deepgram-token/route.ts` — mint a short-lived Deepgram browser token (keeps API key server-side)
- [x] Create `hooks/useDeepgram.ts`:
  - Fetch token from `/api/deepgram-token` on start
  - Open Deepgram WebSocket: `model: "nova-2"`, `interim_results: true`, `smart_format: true`
  - Accumulate final transcripts; track interim for live display
  - On each final result: reset 1.5s silence debounce timer
  - When timer fires: emit `onSilence(fullTranscript)`
  - Expose `{ isListening, interimTranscript, finalTranscript, start, stop }`
- [x] Create `hooks/useSpeechFallback.ts` — identical interface using Web Speech API
- [x] `MicButton.tsx` — toggle start/stop, pulsing red ring while active
- [x] `InterimIndicator.tsx` — renders interim transcript greyed + italic
- [x] `TranscriptDisplay.tsx` — renders final sentences stacked
- [x] Support `UtteranceEnd` event for immediate flush

### P4 — Layout + Integration

- [x] Build split-screen in `page.tsx`: left 35% `VoicePanel`, right 65% `ExcalidrawCanvas`
- [x] Wire `onSilence` → POST `/api/generate-diagram` → call `updateDiagram` on canvas ref
- [x] Pass loading state: show `LoadingIndicator` while awaiting LLM
- [x] `VoicePanel.tsx`: compose `MicButton` + `TranscriptDisplay` + `InterimIndicator`
- [x] Manual end-to-end test: speak → pause → native Excalidraw diagram appears with real arrow connections
- [x] Add editor page with diagram persistence (Dexie)
- [x] Add library view for managing diagrams

---

## Sprint 2 Steps — Streaming + Corrections (Hours 8–16)

### P1 — ID Persistence + Position Preservation

- [x] Harden `mergeElements()`:
  - Preserve `x`, `y`, `width`, `height` for all elements whose ID already exists in the scene
  - Run basic overlap check on new elements — if bounding boxes intersect >50%, nudge by 20px
- [x] Implement `useDiagramState.ts` — owns element array, exposes `applyUpdate(elements)`, syncs to `localStorage` on every change
- [x] On app load: restore from `localStorage` if present, call `updateDiagram` with saved elements
- [x] Test: render diagram, drag elements manually, trigger LLM update, confirm positions held
- [x] Add Dexie database for persistent storage
- [x] Add auto-save functionality

### P2 — Prompt Engineering for Incremental Mode

- [x] Update prompt to receive `currentElements` array alongside transcript
- [x] Instruct model: (a) preserve existing element IDs exactly, (b) only modify what the user's latest instruction describes, (c) return the full element array every time including unchanged elements
- [x] Add correction examples: `"actually call it Docker not Kubernetes"` → find element by ID, update label only
- [x] Add insertion examples: `"add a step between validate and send email"` → new element with correct `startBinding`/`endBinding` pointing to existing IDs
- [x] Support graph-based incremental updates with node/edge removal
- [x] Add safety merge to restore accidentally dropped nodes/edges

### P3 — Per-Sentence Trigger

- [x] Change trigger: fire LLM call on each final Deepgram result, not just after silence
- [x] Debounce: if 2+ finals arrive within 1s, batch into one call
- [x] Accumulate finals, pass full transcript on each call
- [x] Handle in-flight: queue new sentences while LLM is processing, flush on completion
- [x] Support `UtteranceEnd` event for immediate processing

### P4 — Loading States + Overlap + Layout Tuning

- [x] `LoadingIndicator`: subtle "Thinking..." in bottom-left corner of canvas, non-blocking
- [x] Nudge overlapping new elements in `excalidraw-helpers.ts` (coordinate with P1)
- [x] Prompt tuning for layout (coordinate with P2): left-to-right for pipelines, top-to-bottom for flows, grouped by concern
- [x] End-to-end test: correction flow + add-to-existing flow
- [x] Add graph-based layout with Dagre for automatic positioning

---

## Sprint 3 Steps — Polish + Demo Prep (Hours 16–24)

### P1 — Export

- [ ] Export to PNG: `exportToBlob({ elements, appState, exportPadding: 16 })`, trigger download
- [ ] Export to SVG: `exportToSvg()`, serialize to string, trigger download
- [x] Export to `.excalidraw`: `JSON.stringify({ elements, appState })`, trigger download
- [x] Add export buttons to canvas toolbar (top-right) — via EditorMenu
- [x] Export to JSON format
- [x] Bulk export to ZIP

### P2 — Error Recovery + Optional IBM Track

- [x] Error recovery: wrap LLM call in try/catch — on failure show toast, keep existing diagram intact
- [ ] Auto-reconnect Deepgram: on WebSocket error/close, retry up to 2x; fall back to `useSpeechFallback` on third failure
- [ ] **[IBM track — optional, ~2 hrs]** Swap `llm.ts` to call IBM watsonx.ai:
  - Use plain `fetch` to watsonx.ai REST endpoint (avoid adding another SDK dep)
  - Gate behind `USE_WATSONX=true` env flag — OpenAI remains the default
  - watsonx doesn't guarantee `json_object` mode — add regex extraction fallback: pull first `\{[\s\S]*\}` from response
  - Add `WATSONX_API_KEY` + `WATSONX_PROJECT_ID` to `.env.local` / Vercel env vars
- [x] Handle empty graph responses gracefully
- [x] Add timeout handling for LLM requests

### P3 — Backup Demo Video

done

### P4 — Example Prompts + Slide Deck + Bitdeer Polish

- [ ] Add 3 example prompt chips to `VoicePanel` spanning different diagram types:
  - "React frontend calls a Node API, which reads from Postgres and caches in Redis" _(architecture)_
  - "User submits a form, it gets validated, if valid send a confirmation email, if not show an error" _(flowchart)_
  - "Customer places an order, warehouse picks and packs it, courier delivers it, customer confirms receipt" _(business process)_
- [ ] Clicking a chip fires LLM call directly without mic — critical demo safety net in noisy room
- [x] **Bitdeer polish targets:**
  - Live deployed Vercel URL (not localhost) — judges will check
  - `README.md`: one-paragraph pitch, tech stack list, setup steps
  - No console errors on the happy path
  - UI doesn't break on a 13" laptop screen
- [ ] Slide deck: 5 slides max — problem, demo screenshot, how it works, tech stack, ask
- [x] Add library management (folders, tags, search, templates)
- [x] Add version history and change tracking
- [x] Add keyboard shortcuts (Cmd+S, Cmd+Z)

---

## Environment Variables

```env
# .env.local
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...

# IBM track only (optional)
WATSONX_API_KEY=...
WATSONX_PROJECT_ID=...
USE_WATSONX=false
```

---

## Day-of Checklist (Before Demo)

- [ ] `OPENAI_API_KEY` and `DEEPGRAM_API_KEY` set in Vercel env vars (not just `.env.local`)
- [ ] Live Vercel URL loads and works on a second device (phone is fine)
- [ ] Deepgram token endpoint returns a valid token
- [ ] Example prompts produce a complete diagram without touching the mic
- [ ] Backup demo video downloaded locally and queued up, ready to play instantly
- [ ] At least one person has practiced the 2-minute pitch cold
- [ ] IBM: if targeting, confirm watsonx.ai call works from deployed Vercel URL
