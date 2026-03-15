<div align="center">

<img src="assets/banner.png" alt="YapDraw Logo" width="100" height="100">

"Why draw it with your mouse when you can just yap it out?"

</div>

---

## Overview

YapDraw turns spoken descriptions into structured diagrams — instantly. No drag-and-drop. No clicking through menus. Just describe your system, workflow, or process out loud, and watch it render.

Built for engineers, researchers, and anyone who thinks faster than they can point and click.

---

## Features

- **Voice-to-diagram** — speak naturally, correct yourself mid-sentence, and the right diagram still comes out
- **Three diagram modes** — System Architecture (LR service graphs with layers), Process Flowchart (TB with decision branches), and Freeform (anything else)
- **Incremental updates** — say "add a Redis cache" or "remove the message queue" and only that changes; everything else stays put
- **Version history** — every AI-generated change is snapshotted; hit Cmd+Z to revert the last one
- **Editable canvas** — drag nodes, rearrange, tweak manually after generation
- **Diagram library** — star, duplicate, rename, lock, or trash your diagrams
- **Auto-save** — changes persist locally, no account needed

---

## How to Use

1. Create a new diagram from the library
2. Pick a mode: Freeform, System Architecture, or Process Flowchart
3. Click the mic and describe your system or process
4. Watch the diagram generate — keep talking to refine it
5. Drag nodes or hit Cmd+Z to undo the last AI change

**Tips:**

- You don't need to be precise. "We have a React frontend, it talks to a Node API, which hits Postgres and also Redis for caching" works perfectly.
- Self-corrections are handled: "it goes to S3 — actually no, we use GCS" will use GCS.
- For incremental edits, just say what changed: "add an Elasticsearch node connected to the API."

---

## Tech Stack

| Layer               | Tech       |
| ------------------- | ---------- |
| Framework           | Next.js    |
| Canvas              | Excalidraw |
| Layout engine       | Dagre      |
| Voice transcription | Deepgram   |
| Storage             | Supabase   |

---

## Setup

```bash
cd yapdraw
npm install
cp .env.example .env
npm run dev
```

Required env vars:

```
DEEPGRAM_API_KEY=...
LLM_BASE_URL=...
LLM_MODEL=your_model_name
LLM_API_KEY=...
```
