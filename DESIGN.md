# YapDraw — Feature Plan

## Product Overview

A web app where you describe your software architecture by talking, and a diagram builds itself on an Excalidraw canvas. You can correct, add, and refine by continuing to talk. The diagram is fully editable after generation — it's real Excalidraw, not a static image.

**Format:** Web app (Next.js + React, deployed on Vercel)
**URL opens to:** Split-screen — Excalidraw canvas on the right, voice controls + transcript on the left

---

## MVP — Sprint 1 (Hours 0-8)

_Goal: A working end-to-end loop. Talk → diagram appears. Ugly is fine. It just has to WORK._

### Features

- [ ] **Excalidraw canvas** embedded in the page, full-height right panel
- [ ] **Mic button** — click to start recording (toggle on/off)
- [ ] **Web Speech API** in continuous mode, displaying live transcript in left panel
- [ ] **Auto-generate on speech pause (Wispr Flow style)** — detect when user stops talking (~1.5s silence after last `isFinal` result), automatically fire LLM call. No "generate" button needed.
- [ ] **Silence detection logic** — combine Web Speech API's `isFinal` flag + a 1.5s debounce timer. Only fire when: (a) at least one `isFinal` sentence exists, AND (b) 1.5s of silence has passed since the last `isFinal` result. Too short = fires mid-thought. Too long = feels laggy. Start at 1.5s and tune.
- [ ] **LLM pipeline** — API route that takes transcript string → returns Excalidraw element skeleton JSON
- [ ] **Render pipeline** — takes LLM JSON → `convertToExcalidrawElements` → `updateScene` → diagram appears on canvas
- [ ] **Basic system prompt** that handles common architecture patterns (frontend/backend/database/cache/queue/external service)
- [ ] **Color coding** — frontend=blue, backend=green, database=orange, external=purple, cache=yellow
- [ ] **Auto-fit** — after rendering, `scrollToContent` to center the diagram in viewport
- [ ] **Interim speech indicator** — show greyed-out text of what's currently being heard (before `isFinal`), so the user knows the app is listening

### What "done" looks like

You click mic and start talking: "I have a React frontend that talks to a Node API, which connects to Postgres and Redis." You pause naturally. After ~1.5 seconds of silence, a clean color-coded architecture diagram appears on the Excalidraw canvas — boxes, arrows, labels, colors. No button clicked. You just talked and stopped. You can then drag elements around, edit text, add things manually — it's real Excalidraw.

### Who does what (Sprint 1)

| Person | Task                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| P1     | Next.js project setup + Excalidraw component + updateScene pipeline                    |
| P2     | LLM system prompt design + API route + JSON output parsing                             |
| P3     | Web Speech API + mic button + silence detection (1.5s debounce) + transcript display   |
| P4     | Page layout (split panel), interim speech indicator, basic styling, connect all pieces |

---

## Sprint 2 (Hours 8-16)

_Goal: Streaming mode + corrections. This is where it goes from "cool" to "holy shit"._

### Features

- [ ] **Per-sentence streaming** — upgrade from "generate on full pause" to "update after every sentence"
  - Shorten the trigger: instead of waiting for full silence, fire an LLM call after each `isFinal` sentence result
  - Send full transcript so far + current diagram state (element IDs + labels) to LLM
  - LLM returns updated full element array (not a diff — full replace is simpler and more reliable)
  - Re-render via `updateScene`, preserving element positions the user may have manually adjusted
  - Debounce rapid-fire sentences (if 3 sentences come in 2 seconds, batch them into one LLM call)
- [ ] **Correction handling** — "oh wait, it's not Kubernetes, it's Docker"
  - LLM sees full transcript including the correction
  - Matches element by old label, updates to new label
  - Element smoothly updates on canvas (same position, just new text)
- [ ] **"Add to existing" mode** — "also add a message queue between the API and the database"
  - LLM sees existing diagram + new instruction
  - Adds new elements and connects them to existing ones without moving what's already there
- [ ] **Element ID persistence** — when the LLM returns updated elements, match against existing element IDs so positions are preserved and the canvas doesn't "jump"
- [ ] **Loading states** — subtle "thinking..." indicator on canvas while LLM processes each update
- [ ] **Overlap detection** — post-process LLM output to shift overlapping elements apart
- [ ] **Improved layout** — LLM prompt tuning for cleaner layouts (layered top-to-bottom, grouped by concern)

### What "done" looks like

You click mic and start talking. As you describe each component, boxes and arrows appear on the canvas in real-time — one or two elements per sentence. When you say "actually, swap Redis for Memcached," the Redis box smoothly renames. When you say "oh and add a CDN in front of the frontend," a new element appears and connects. The diagram grows organically as you speak. It feels like pair-diagramming with someone who draws really fast.

### Who does what (Sprint 2)

| Person | Task                                                                                                                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------- |
| P1     | Element ID persistence across updates — match existing elements, prevent canvas jumping, handle position preservation   |
| P2     | Prompt engineering for incremental mode — LLM needs to understand existing state + new instructions. Correction logic.  |
| P3     | Per-sentence trigger — shorten debounce from 1.5s pause to per-sentence, batch rapid sentences, manage transcript state |
| P4     | Loading states, overlap post-processing, layout improvements, UI polish                                                 |

---

## Sprint 3 (Hours 16-24)

_Goal: Polish, track-specific features, demo prep. Make it feel like a real product, not a hackathon hack._

### Features

- [ ] **Export options** — download as PNG, SVG, or .excalidraw file
- [ ] **Diagram style selector** — "architecture diagram" vs "flowchart" vs "sequence diagram" (changes LLM prompt)
- [ ] **Example prompts** — pre-loaded examples users can click to see it in action ("Show me a microservices architecture", "Draw a CI/CD pipeline")
- [ ] **Voice activity indicator** — waveform visualization while recording
- [ ] **Transcript panel polish** — highlighted keywords, show which sentence generated which elements
- [ ] **Moorcheh memory integration** (if targeting that track)
  - Save diagram state + project name to Moorcheh boilerplate
  - "Continue my diagram from last time" — loads previous state
  - "Add a feature to the project I described yesterday" — remembers context
- [ ] **Error recovery** — if LLM returns bad JSON, retry silently; if speech API disconnects, auto-reconnect
- [ ] **Mobile-friendly mic input** (even if canvas isn't great on mobile, the voice capture should work)
- [ ] **Backup demo video** — record a perfect run as insurance
- [ ] **Slide deck** — 3-5 slides for pitch

### Polish Priorities (if time is limited, do these in order)

1. Backup demo video (NON-NEGOTIABLE — record this first in Sprint 3)
2. Export to PNG (judges want to see a "real feature")
3. Example prompts (makes the demo smoother — click example instead of risking live mic in noisy room)
4. Slide deck (keep it minimal — the demo IS the pitch)
5. Everything else is gravy

### Who does what (Sprint 3)

| Person | Task                                                              |
| ------ | ----------------------------------------------------------------- |
| P1     | Export functionality + diagram style selector                     |
| P2     | Moorcheh memory integration (if targeting track) + error recovery |
| P3     | Record backup demo video + practice live demo 3x                  |
| P4     | Slide deck + UI polish + example prompts                          |

---

## Feature Priority Matrix

| Feature                                           | Impact on Demo                | Effort | Priority               |
| ------------------------------------------------- | ----------------------------- | ------ | ---------------------- |
| Auto-generate on speech pause (Wispr Flow style)  | HIGH                          | LOW    | Sprint 1 — MUST        |
| Silence detection (1.5s debounce + isFinal)       | HIGH                          | LOW    | Sprint 1 — MUST        |
| Interim speech indicator ("currently hearing...") | MEDIUM                        | LOW    | Sprint 1 — MUST        |
| Color-coded elements by type                      | MEDIUM                        | LOW    | Sprint 1 — MUST        |
| Auto-fit canvas after generation                  | MEDIUM                        | LOW    | Sprint 1 — MUST        |
| Per-sentence streaming (update every sentence)    | VERY HIGH                     | MEDIUM | Sprint 2 — SHOULD      |
| Correction handling ("not X, it's Y")             | HIGH                          | MEDIUM | Sprint 2 — SHOULD      |
| Add-to-existing diagram                           | HIGH                          | LOW    | Sprint 2 — SHOULD      |
| Element ID persistence (no canvas jumping)        | HIGH                          | MEDIUM | Sprint 2 — SHOULD      |
| Overlap detection / layout fix                    | MEDIUM                        | MEDIUM | Sprint 2 — SHOULD      |
| Export to PNG/SVG                                 | MEDIUM                        | LOW    | Sprint 3 — NICE        |
| Example prompts                                   | MEDIUM                        | LOW    | Sprint 3 — NICE        |
| Moorcheh memory                                   | LOW (HIGH if targeting track) | MEDIUM | Sprint 3 — CONDITIONAL |
| Diagram style selector                            | LOW                           | MEDIUM | Sprint 3 — NICE        |
| Backup demo video                                 | CRITICAL                      | LOW    | Sprint 3 — MUST        |
| Slide deck                                        | CRITICAL                      | LOW    | Sprint 3 — MUST        |

---

## Demo Flow (2 minutes)

**[0:00-0:15]** "Every developer has been in a meeting trying to explain their architecture. You're waving your hands, saying 'the frontend talks to the API, which talks to the database...' — and nobody's drawing it. We fixed that."

**[0:15-0:45]** Live demo: click mic, start talking naturally about a system. Diagram builds itself on the Excalidraw canvas as you speak. Boxes appear, arrows connect them, colors differentiate layers.

**[0:45-1:00]** Make a correction: "Actually, it's Docker, not Kubernetes." Watch the element update live.

**[1:00-1:15]** Add something: "Oh, and there's a CDN in front of the frontend." New element appears and connects.

**[1:15-1:30]** Show that it's real Excalidraw — drag an element, edit text manually, zoom in. "It's not a static image. It's a fully editable diagram you can share with your team."

**[1:30-1:45]** Export to PNG. Show the clean result.

**[1:45-2:00]** "YapDraw. Stop drawing your architecture. Start describing it." [end]

---

## Repo Name Suggestions

- `yapdraw`
- `yap-draw`
- `archvoice`
- `drawwithvoice`
- `excalidraw-voice`
- `talkitecture`
