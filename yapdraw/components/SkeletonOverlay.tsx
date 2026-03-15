'use client'

// Ghost diagram shown while the LLM is generating — breaks the "black box" wait.
// Nodes are laid out to suggest a realistic architecture/flowchart shape.
const GHOST_NODES = [
  { x: '6%',  y: '38%', w: '20%', h: '13%' },
  { x: '34%', y: '20%', w: '20%', h: '13%' },
  { x: '34%', y: '55%', w: '20%', h: '13%' },
  { x: '62%', y: '20%', w: '20%', h: '13%' },
  { x: '62%', y: '55%', w: '20%', h: '13%' },
]

const GHOST_ARROWS = [
  { x1: '26%', y1: '44%', x2: '34%', y2: '30%' },
  { x1: '26%', y1: '44%', x2: '34%', y2: '62%' },
  { x1: '54%', y1: '27%', x2: '62%', y2: '27%' },
  { x1: '54%', y1: '62%', x2: '62%', y2: '62%' },
]

export default function SkeletonOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Subtle frosted backdrop */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />

      {/* Ghost arrows */}
      <svg className="absolute inset-0 w-full h-full animate-pulse" style={{ animationDuration: '1.8s' }}>
        {GHOST_ARROWS.map((a, i) => (
          <line
            key={i}
            x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
            stroke="#D1D5DB"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        ))}
      </svg>

      {/* Ghost nodes */}
      {GHOST_NODES.map((n, i) => (
        <div
          key={i}
          className="absolute rounded-xl bg-[#E5E7EB]/70 animate-pulse"
          style={{
            left: n.x, top: n.y,
            width: n.w, height: n.h,
            animationDuration: `${1.4 + i * 0.15}s`,
          }}
        >
          {/* Ghost label line */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-2 rounded bg-[#D1D5DB]/80" />
        </div>
      ))}
    </div>
  )
}
