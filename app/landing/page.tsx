import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "YapDraw",
  description:
    "Create architecture diagrams by describing them out loud. Built for developers and teams.",
};

export default function LandingPage() {
  return (
    <div
      className="min-h-screen text-slate-900 antialiased bg-[#fbfcfd] overflow-auto"
      style={{
        backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Navigation */}
      <nav className="flex items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Image
            src="/yapdraw_logo.png.webp"
            alt="YapDraw logo"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="font-bold text-xl tracking-tight uppercase">
            YapDraw
          </span>
        </div>
      </nav>

      {/* Hero Section: The "Kinetic Canvas" */}
      <header className="max-w-5xl mx-auto pt-20 pb-32 px-6 text-center">
        <div className="inline-block px-3 py-1 mb-6 text-xs font-mono tracking-widest uppercase border border-slate-200 rounded-full bg-white/50 backdrop-blur-sm">
          Powered by Deepgram &amp; Excalidraw
        </div>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 mb-8 leading-[1.1]">
          Describe your system. <br />
          <span className="text-[#6965db] italic underline decoration-wavy decoration-2 underline-offset-8 mt-4 inline-block font-serif">
            Watch it appear.
          </span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          Skip the drag-and-drop. Describe architecture, flows, and sketches
          naturally. We&apos;ll draw the nodes, you lead the session.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/d/new"
            className="bg-[#6965db] text-white px-10 py-4 text-lg font-bold flex items-center gap-3 border-2 border-[#1e1e1e] shadow-[3px_3px_0px_#1e1e1e] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#1e1e1e] transition-all"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            Start Drawing
          </Link>
          <Link
            href="/library"
            className="bg-white text-[#1e1e1e] px-10 py-4 text-lg font-bold border-2 border-[#1e1e1e] shadow-[3px_3px_0px_#1e1e1e] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_#1e1e1e] transition-all"
          >
            Library
          </Link>
        </div>
      </header>

      {/* How it works: The "Draftsman" Grid */}
      <section className="bg-white border-y border-slate-200 py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-20">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-4">
              Process / Workflow
            </h2>
            <p className="text-4xl font-bold tracking-tight">
              Built for technical architects.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* The "Excalidraw-style" Hero Visual */}
            <div className="relative border-2 border-[#1e1e1e] shadow-[4px_4px_0px_#1e1e1e] rounded-sm bg-white p-2 overflow-hidden sticky top-8">
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              {/* Placeholder for diagram image - can be replaced */}
              <div className="w-full h-64 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-100 mb-4 flex items-center justify-center">
                <span className="text-slate-300 text-sm font-mono">
                  [ Diagram Preview ]
                </span>
              </div>
              <div className="p-8 text-left">
                <p className="text-[#6965db] text-2xl mb-2 font-[family-name:var(--font-hand)]">
                  &quot;Create a 3-tier AWS architecture...&quot;
                </p>
                <div className="h-1 w-24 bg-[#6965db] rounded"></div>
              </div>
            </div>

            {/* Steps */}
            <div className="grid gap-8">
              {/* Step 1 */}
              <div className="bg-white border border-slate-200 p-10 rounded-xl relative group hover:border-[#6965db] hover:translate-y-[-4px] transition-all duration-300">
                <span className="absolute top-6 right-8 text-6xl font-black text-slate-100 group-hover:text-slate-200 transition-colors">
                  01
                </span>
                <h3 className="text-xl font-bold mb-4">Speak Naturally</h3>
                <p className="text-slate-500 leading-relaxed mb-6">
                  Explain your microservices, databases, and message queues just
                  like you&apos;re talking to a senior engineer.
                </p>
                <div className="text-slate-400 italic font-[family-name:var(--font-hand)]">
                  &quot;First, we have a React frontend hitting a
                  Gateway...&quot;
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white border border-[#6965db]/20 p-10 rounded-xl relative group hover:border-[#6965db] hover:translate-y-[-4px] transition-all duration-300">
                <span className="absolute top-6 right-8 text-6xl font-black text-slate-100 group-hover:text-slate-200 transition-colors">
                  02
                </span>
                <h3 className="text-xl font-bold mb-4">Real-time Rendering</h3>
                <p className="text-slate-500 leading-relaxed mb-6">
                  Our engine translates intent into Excalidraw primitives. Nodes
                  connect and labels appear as you speak.
                </p>
                <div className="flex gap-2">
                  <div className="w-12 h-8 border-2 border-dashed border-slate-300 rounded"></div>
                  <div className="w-12 h-8 border-2 border-slate-800 rounded"></div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white border border-slate-200 p-10 rounded-xl relative group hover:border-[#6965db] hover:translate-y-[-4px] transition-all duration-300">
                <span className="absolute top-6 right-8 text-6xl font-black text-slate-100 group-hover:text-slate-200 transition-colors">
                  03
                </span>
                <h3 className="text-xl font-bold mb-4">Full Ownership</h3>
                <p className="text-slate-500 leading-relaxed mb-6">
                  Export directly to high-res PNG, SVG, or take the JSON into
                  Excalidraw for final manual polishes.
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-bold text-[#6965db]">
                  <span>EXPORT TO SVG</span>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 7l5 5 5-5M7 13l5 5 5-5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / CTA */}
      <footer className="py-24 px-8 text-center bg-[#0a0a0b] text-white">
        <h2 className="text-4xl font-bold mb-8">Ready to whiteboard?</h2>
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/d/new"
            className="bg-white text-black px-12 py-4 font-bold rounded-lg hover:scale-105 transition-transform"
          >
            Open Canvas Now
          </Link>
          <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">
            No credit card. No friction. Just draw.
          </p>
        </div>
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm max-w-7xl mx-auto">
          <p>© 2024 YapDraw Inc.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-white transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Changelog
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
