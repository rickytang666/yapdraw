<div align="center">

<a href="https://yapdraw.vercel.app">
<img src="public/logo_round.png" alt="" width="150" height="150">
</a>

# YapDraw

_Build diagrams at the speed of speech._

</div>

---

## Overview

YapDraw is [Wispr Flow](https://wisprflow.ai) for [Excalidraw](https://excalidraw.com).

Describe anything out loud — a system architecture, a business process, a research workflow, a project plan — and it draws it as a clean, editable Excalidraw diagram. No code, no syntax, no drag-and-drop. For anyone who has ever stared at a blank whiteboard.

## [Demo Video](https://youtu.be/JoLELmPKW6w?si=vIdsas2C-dv69O4P)

<div align="center">
<a href="https://youtu.be/JoLELmPKW6w?si=vIdsas2C-dv69O4P">
<img src="public/landing.png" alt="landing page">
</a>
</div>

## Features

- **Just talk** — mid-sentence corrections, filler words, backtracking — it reflects your intent, not your exact words. No syntax, no templates.
- **Incremental updates** — say "add X" or "remove Y" and only that changes. The rest of your diagram stays exactly where it is.
- **Local-first** — auto-saves to your browser. No account, no data leaving your machine.
- **Undo AI changes** — every generation is snapshotted. Use `[` / `]` to step through AI change history without touching anything you edited manually.
- **Three modes** — Freeform (anything), System Architecture (layered service graphs), Process Flowchart (decision trees, approval flows, research plans).

## How to Use

1. Open the library and create a new diagram
2. Pick a mode — when in doubt, use Freeform
3. Hit the mic and describe what you want
4. Keep talking to refine — add, remove, or change anything
5. Drag nodes around, or use `[` / `]` to step through AI change history

Works out of the box on the free tier. For higher limits, add your own OpenRouter or Gemini key in the settings panel (⚙️ top right).

**Tips:**

- Talk like you're explaining it to someone, not writing a spec. "So we have a React frontend, it calls our Node API, which reads from Postgres — oh and Redis for session caching" works perfectly.
- Corrections are handled automatically: "it connects to S3 — actually we use GCS" will use GCS.
- For updates, just say what changed: "remove the message queue" or "add an analytics service between the API and the database."

## Tech Stack

- Framework: Next.js
- Canvas: Excalidraw
- Layout engine: Dagre
- Speech-to-text: Deepgram
- Storage: Dexie (IndexedDB, local-first)

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

Required env vars:

```bash
DEEPGRAM_API_KEY=...
DEEPGRAM_PROJECT_ID=...
GROQ_API_KEY=...   # free tier LLM fallback
```

You can also bring your own OpenRouter or Gemini key via the in-app settings — no env var needed for that.

---

![views badge](https://visitor-badge.laobi.icu/badge?page_id=rickytang666.yapdraw&left_text=👀)
