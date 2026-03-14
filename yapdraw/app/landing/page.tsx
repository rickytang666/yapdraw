import Link from 'next/link'
import { IconMicrophone, IconSparkles } from '@tabler/icons-react'

export const metadata = {
  title: 'YapDraw — Landing',
  description: 'Describe diagrams with your voice. YapDraw draws them instantly.',
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Top bar */}
  <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <IconSparkles size={18} className="text-blue-300" />
            </div>
            <span className="font-semibold tracking-tight">YapDraw</span>
          </div>
        </header>

        {/* Hero */}
        <section className="mt-16 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              Speak a diagram.
              <span className="block text-zinc-300">It draws itself.</span>
            </h1>
            <p className="mt-5 text-zinc-300 text-base md:text-lg leading-relaxed">
              YapDraw turns spoken descriptions into clean diagrams in real time.
              Great for architecture sketches, flows, sequences, and quick whiteboarding.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/d/new"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-3 text-sm font-medium transition-colors"
              >
                <IconMicrophone size={16} />
                Start a new diagram
              </Link>
              <Link
                href="/library"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-5 py-3 text-sm font-medium transition-colors"
              >
                Browse library
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-sm font-medium">Voice-first</p>
                <p className="mt-1 text-xs text-zinc-400">Describe what you want. Edits are additive.</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-sm font-medium">Fast iterations</p>
                <p className="mt-1 text-xs text-zinc-400">Pause to generate. Keep talking to refine.</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-sm font-medium">Library built-in</p>
                <p className="mt-1 text-xs text-zinc-400">Organize diagrams with folders, tags, and stars.</p>
              </div>
            </div>
          </div>

          {/* Mock preview */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6 shadow-2xl">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-200">Try saying:</p>
                <span className="text-xs text-zinc-500">Example prompt</span>
              </div>
              <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
                “Draw a web app with a Next.js frontend, an API server, and a Postgres database.
                The frontend calls the API, and the API reads and writes to the database.”
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs text-zinc-500">What you get</p>
                <p className="mt-1 text-sm text-zinc-200">Boxes, arrows, labels, auto-layout — ready to tweak.</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs text-zinc-500">Then refine</p>
                <p className="mt-1 text-sm text-zinc-200">“Add a Redis cache between API and DB.”</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-16 border-t border-zinc-800 pt-8 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            © YapDraw
          </p>
        </footer>
      </div>
    </main>
  )
}
