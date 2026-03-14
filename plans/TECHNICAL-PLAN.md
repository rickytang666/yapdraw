# YapDraw — Technical Plan

## Prize Track Strategy

| Track | Effort | Verdict |
|---|---|---|
| **Main prize** | — | Primary goal |
| **Bitdeer — Production-Ready AI Tool** | Near zero — just build well and deploy | Yes, target this |
| **IBM — Best AI Hack using IBM Technology** | ~2 hrs Sprint 3 — swap LLM call to watsonx.ai | Yes, if one person volunteers |
| **Moorcheh — Efficient Memory** | ~4 hrs, requires Python service alongside Next.js | Skip |

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Vercel-native, API routes built in |
| Language | TypeScript | Catches schema mismatches on Excalidraw types early |
| Diagramming | `@excalidraw/excalidraw` | Real Excalidraw embed with `updateScene` API |
| Speech (primary) | Deepgram real-time STT via `@deepgram/sdk` | Accurate on technical vocab, handles noisy rooms, WebSocket streaming |
| Speech (fallback) | Web Speech API | Zero-setup backup if Deepgram integration stalls |
| LLM (primary) | OpenAI `gpt-4o-mini` via `openai` SDK | `response_format: json_object` gives guaranteed valid JSON, fast, cheap |
| LLM (IBM track) | IBM watsonx.ai | Swap-in for IBM prize track only; keep OpenAI as fallback |
| Styling | Tailwind CSS | Fast layout iteration |
| Deployment | Vercel | Zero-config Next.js deploy — required for Bitdeer "production-ready" judging |

### Browser Requirement
Any modern browser. Deepgram works everywhere (WebSocket). Web Speech API fallback is Chrome/Edge only — document this.

---

## Data Storage

No database. All state is ephemeral and lives in the browser.

| Data | Where it lives |
|---|---|
| Excalidraw elements | React state (`useState`) + Excalidraw's internal scene |
| Transcript text | React state |
| Interim speech | React state (wiped after each transcript update) |
| LLM loading state | React state |
| Session continuity | `localStorage` — save element JSON + transcript on every update, restore on page load |
| Diagram export | Client-side blob via `exportToBlob` / `exportToSvg` — downloaded directly, never uploaded |

`localStorage` gives you "resume last session" for free with no backend. This is sufficient for the demo and satisfies the Moorcheh memory angle if you ever revisit it.

---

## Stable Element ID Scheme (agreed in Sprint 0, never changed)

LLM-generated elements must have stable IDs across calls so positions are preserved when the diagram updates.

**Rule:** Element ID = `kebab-case(label)`. Example: `"React Frontend"` → `id: "react-frontend"`.

- LLM is instructed to always emit this exact format
- On re-render, existing elements with matching IDs keep their `x`/`y` positions
- New elements (ID not in current scene) are appended with LLM-suggested positions

This is locked in `types/diagram.ts` during Sprint 0. If P1 uses random IDs, Sprint 2's correction logic breaks.

---

## File Structure

```
yapdraw/
├── app/
│   ├── layout.tsx                        # Root layout, fonts, metadata
│   ├── page.tsx                          # Split-screen: VoicePanel + ExcalidrawCanvas
│   └── api/
│       ├── generate-diagram/
│       │   └── route.ts                  # POST: transcript + current elements → updated elements
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
│   └── useDiagramState.ts               # Element array state, ID-preserving merge logic, localStorage sync
│
├── lib/
│   ├── prompts.ts                        # System prompt + few-shot examples
│   ├── llm.ts                            # OpenAI call with json_object response format, parse + validate
│   └── excalidraw-helpers.ts            # convertToExcalidrawElements wrapper, position merge, overlap fix
│
├── types/
│   └── diagram.ts                        # DiagramElement, LLMResponse types
│
└── public/
    └── (static assets)
```

---

## File Ownership (no two people touch the same file)

This table is the source of truth for avoiding merge conflicts. If you need to touch someone else's file, talk first.

| File | Owner | Notes |
|---|---|---|
| `app/layout.tsx` | Sprint 0 | Set up once, don't touch |
| `app/page.tsx` | P4 | Imports stubs from P1/P3 — works immediately, fills in as they finish |
| `app/api/generate-diagram/route.ts` | P2 | |
| `app/api/deepgram-token/route.ts` | P3 | |
| `components/ExcalidrawCanvas.tsx` | P1 | |
| `components/VoicePanel.tsx` | P4 | |
| `components/MicButton.tsx` | P3 | |
| `components/TranscriptDisplay.tsx` | P3 | |
| `components/InterimIndicator.tsx` | P3 | |
| `components/LoadingIndicator.tsx` | P4 | |
| `hooks/useDeepgram.ts` | P3 | |
| `hooks/useSpeechFallback.ts` | P3 | |
| `hooks/useDiagramState.ts` | P1 | |
| `lib/prompts.ts` | P2 | |
| `lib/llm.ts` | P2 | |
| `lib/excalidraw-helpers.ts` | P1 | |
| `types/diagram.ts` | Sprint 0 | Agreed types — change only with full team sign-off |
| `.env.local` | Sprint 0 | Each person adds their own keys locally, never commit this file |

---

## Sprint 0 — Project Setup (One Person, ~45 min, before clock starts if possible)

**Who:** Whoever is fastest at scaffolding. Everyone else sets up their dev environment in parallel.

**Goal:** Push a working skeleton so all four people can `git pull`, branch, and immediately start their Sprint 1 task without waiting on each other.

### Steps

- [ ] Create repo on GitHub, share URL with team
- [ ] `npx create-next-app@latest yapdraw --typescript --tailwind --app`
- [ ] `npm install @excalidraw/excalidraw openai @deepgram/sdk`
- [ ] Create `.env.example` with all keys (no values):
  ```env
  OPENAI_API_KEY=
  DEEPGRAM_API_KEY=
  WATSONX_API_KEY=
  WATSONX_PROJECT_ID=
  USE_WATSONX=false
  ```
- [ ] Add `.env.local` to `.gitignore` (Next.js does this by default — verify)
- [ ] Create `types/diagram.ts` with the agreed types:
  ```ts
  export type ElementType = 'frontend' | 'backend' | 'database' | 'cache' | 'queue' | 'external'

  export interface DiagramElement {
    id: string           // kebab-case(label) — e.g. "react-frontend"
    label: string
    type: ElementType
    connects_to: string[] // IDs of target elements
    x?: number
    y?: number
  }

  export interface LLMResponse {
    elements: DiagramElement[]
  }
  ```
- [ ] Create stub files for every file in the structure — just enough to export a no-op so imports don't break:
  - `components/ExcalidrawCanvas.tsx` → `export default function ExcalidrawCanvas() { return <div /> }`
  - `components/VoicePanel.tsx` → same pattern
  - `components/MicButton.tsx` → same
  - `components/TranscriptDisplay.tsx` → same
  - `components/InterimIndicator.tsx` → same
  - `components/LoadingIndicator.tsx` → same
  - `hooks/useDeepgram.ts` → export a stub hook returning the right shape
  - `hooks/useSpeechFallback.ts` → same
  - `hooks/useDiagramState.ts` → same
  - `lib/prompts.ts` → `export const SYSTEM_PROMPT = ''`
  - `lib/llm.ts` → stub async function
  - `lib/excalidraw-helpers.ts` → stub functions
  - `app/api/generate-diagram/route.ts` → `export async function POST() { return Response.json([]) }`
  - `app/api/deepgram-token/route.ts` → `export async function GET() { return Response.json({ token: '' }) }`
- [ ] Wire stubs into `app/page.tsx` so `npm run dev` boots without errors
- [ ] Confirm `npm run dev` loads a blank page with no TypeScript errors
- [ ] Push to `main`
- [ ] Each person: `git pull`, `git checkout -b p1-canvas` (or `p2-llm`, `p3-voice`, `p4-layout`)

### After Sprint 0 — Branch Strategy

```
main
├── p1-canvas    # P1 works here
├── p2-llm       # P2 works here
├── p3-voice     # P3 works here
└── p4-layout    # P4 works here
```

Merge into `main` at sprint boundaries (end of Sprint 1, end of Sprint 2). P4 should merge last each time since `page.tsx` imports everything — merging after P1/P3 means fewer conflicts.

---

## Sprint 1 Steps — The Working Loop (Hours 0–8)

### P1 — Canvas + Render Pipeline

- [ ] `npx create-next-app@latest yapdraw --typescript --tailwind --app`
- [ ] `npm install @excalidraw/excalidraw openai @deepgram/sdk`
- [ ] Create `ExcalidrawCanvas.tsx` — embed `<Excalidraw>` with a ref to the API object
- [ ] Wire `updateScene({ elements })` from outside the component via a forwarded ref or callback prop
- [ ] Implement `excalidraw-helpers.ts`: `mergeElements(existing, incoming)` — match by ID, keep `x`/`y` of matches, append new ones
- [ ] Call `scrollToContent()` after each `updateScene`
- [ ] Smoke test: hardcode a 3-element scene and confirm it renders

### P2 — LLM API Route

- [ ] Add `OPENAI_API_KEY` to `.env.local`
- [ ] Write system prompt in `prompts.ts` — instruct the model to return a JSON array of elements:
  ```json
  { "id": "react-frontend", "label": "React Frontend", "type": "frontend", "connects_to": ["node-api"] }
  ```
- [ ] Include few-shot examples for common patterns (frontend/backend/DB/cache/queue/external)
- [ ] Create `route.ts`: accepts `{ transcript, currentElements }`, calls `gpt-4o-mini` with `response_format: { type: "json_object" }`, returns parsed element array
- [ ] Add color map: `frontend=blue, backend=green, database=orange, cache=yellow, external=purple, queue=red`
- [ ] No retry logic needed — `json_object` mode guarantees valid JSON
- [ ] Test with `curl` before connecting to UI

### P3 — Voice (Deepgram) + Silence Detection

- [ ] Create `/api/deepgram-token/route.ts` — calls Deepgram API to mint a short-lived browser token (keeps API key server-side)
- [ ] Create `useDeepgram.ts` hook:
  - Fetch token from `/api/deepgram-token` on start
  - Open Deepgram WebSocket with `model: "nova-2"`, `interim_results: true`, `smart_format: true`
  - Accumulate final transcripts; track interim for live display
  - On each final result: reset 1.5s silence debounce timer
  - When timer fires: emit `onSilence(fullTranscript)` → triggers LLM call
  - Expose `{ isListening, interimTranscript, finalTranscript, start, stop }`
- [ ] Create `useSpeechFallback.ts` — identical interface using Web Speech API, used if Deepgram setup fails
- [ ] Create `MicButton.tsx` — toggle start/stop, pulsing red ring while active
- [ ] Create `InterimIndicator.tsx` — renders interim transcript in greyed italic
- [ ] Create `TranscriptDisplay.tsx` — renders final sentences stacked

### P4 — Layout + Integration

- [ ] Build split-screen layout in `page.tsx`: left 35% `VoicePanel`, right 65% `ExcalidrawCanvas`
- [ ] Wire `onSilence` → POST `/api/generate-diagram` → call `updateScene` with returned elements
- [ ] Pass loading state down: show `LoadingIndicator` while awaiting LLM
- [ ] `VoicePanel.tsx`: compose `MicButton` + `TranscriptDisplay` + `InterimIndicator`
- [ ] Manual end-to-end test: speak → pause → diagram appears

---

## Sprint 2 Steps — Streaming + Corrections (Hours 8–16)

### P1 — ID Persistence + Position Preservation

- [ ] Harden `mergeElements()` in `excalidraw-helpers.ts`:
  - For each incoming element: if ID exists in current scene, copy over `x`, `y`, `width`, `height`
  - For new elements: trust LLM positions but run basic overlap check (shift if bounding boxes intersect >50%)
- [ ] Implement `useDiagramState.ts` — owns the element array, exposes `applyUpdate(newElements)`, syncs to `localStorage` on every update
- [ ] On app load: read `localStorage` and restore last session if present
- [ ] Test: render diagram, drag elements manually, trigger update, confirm positions held

### P2 — Prompt Engineering for Incremental Mode

- [ ] Update system prompt to accept `currentElements` array alongside transcript
- [ ] Prompt instructs the model to: (a) keep existing element IDs, (b) only rename/add/remove as directed by the latest instruction, (c) return full element array every time
- [ ] Add correction examples to few-shot: `"actually it's Docker not Kubernetes"` → same ID, updated label
- [ ] Add "add to existing" examples: `"add a CDN in front of the frontend"` → new element + new connection

### P3 — Per-Sentence Trigger

- [ ] Change trigger: fire LLM call on each final Deepgram transcript result, not just after 1.5s silence
- [ ] Add debounce: if 2+ final results arrive within 1s, batch into one call
- [ ] Accumulate finals, pass full transcript on each call
- [ ] Handle in-flight: if new sentence arrives while LLM is processing, queue it (don't drop)

### P4 — Loading States + Overlap + Layout

- [ ] `LoadingIndicator`: subtle "Thinking..." text in bottom-left of canvas, not a blocking overlay
- [ ] Overlap post-processor: after merge, nudge elements whose bounding boxes overlap
- [ ] Tune system prompt for layout: top-to-bottom layering (client → API → data), horizontal grouping of peers
- [ ] Test end-to-end correction + add flows

---

## Sprint 3 Steps — Polish + Demo Prep (Hours 16–24)

### P1 — Export (supports Bitdeer "production-ready" narrative)

- [ ] Export to PNG: `exportToBlob({ elements, appState, exportPadding: 16 })`, trigger download
- [ ] Export to SVG: `exportToSvg()`, serialize, trigger download
- [ ] Export to `.excalidraw`: `JSON.stringify` element array, trigger download
- [ ] Add export buttons to canvas toolbar

### P2 — Error Recovery + Optional IBM Track

- [ ] Error recovery: wrap LLM call in try/catch — on failure, show toast and keep existing diagram
- [ ] Auto-reconnect Deepgram: on WebSocket close/error, reconnect if `isListening` is still true; fall back to Web Speech API after 2 failed attempts
- [ ] **[IBM track — optional, ~2 hrs]** Swap `llm.ts` to call IBM watsonx.ai instead of OpenAI:
  - Use `@ibm-cloud/watsonx-ai` SDK or plain `fetch` to watsonx.ai REST API
  - Model: `ibm/granite-34b-code-instruct` or `meta-llama/llama-3-70b-instruct` (hosted on watsonx)
  - Keep OpenAI as fallback: `USE_WATSONX=true` env flag toggles which client is used
  - Add `WATSONX_API_KEY` + `WATSONX_PROJECT_ID` to `.env.local`
  - Note: watsonx models are less reliable with JSON output — add a JSON extract fallback (regex `\[.*\]`)

### P3 — Backup Demo Video

- [ ] Record perfect run of the full demo flow (see DESIGN.md §Demo Flow)
- [ ] Use a rehearsed transcript — don't ad-lib on recording
- [ ] Store video locally (USB) and in cloud (Drive/iCloud) — have both ready
- [ ] Practice live demo 3x minimum

### P4 — Example Prompts + Slide Deck + Bitdeer Polish

- [ ] Add 3 example prompt chips to `VoicePanel`:
  - "React frontend, Node API, Postgres and Redis"
  - "Microservices: auth service, user service, order service, shared message queue"
  - "CI/CD pipeline: GitHub Actions, Docker build, ECR, ECS deploy"
- [ ] Clicking a chip: populates transcript and fires LLM call directly (bypasses mic) — critical demo safety net
- [ ] **Bitdeer polish targets:**
  - Live deployed URL on Vercel (not localhost) — judges will check
  - README with one-paragraph description, tech stack, and setup steps
  - Graceful degradation messaging in UI (e.g., "Use Chrome for best experience")
  - No console errors in the happy path
  - Mobile: UI shouldn't break on small screens (canvas can be non-functional, layout just shouldn't explode)
- [ ] Slide deck: 5 slides max — problem, solution, live demo placeholder, how it works, ask

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

- [ ] `OPENAI_API_KEY` and `DEEPGRAM_API_KEY` are set in Vercel env vars (not just `.env.local`)
- [ ] Live Vercel URL is working and accessible on a phone (sanity check)
- [ ] Deepgram token endpoint returns a valid token
- [ ] Example prompts produce a diagram end-to-end without touching the mic
- [ ] Backup demo video is downloaded locally and queued up, ready to play instantly
- [ ] At least one team member has practiced the 2-minute pitch cold
- [ ] IBM: if targeting, confirm watsonx.ai call works from Vercel (not just localhost)
