'use client'

import { useEffect, useState, useRef } from 'react'
import rough from 'roughjs'
import { Indie_Flower } from 'next/font/google'
import {
  siReact,
  siCloudflare,
  siFastify,
  siGo,
  siApachekafka,
  siMysql,
  siSupabase,
  siRedis,
  siDatadog,
  siClerk,
} from 'simple-icons'

const indieFlower = Indie_Flower({ subsets: ['latin'], weight: '400' })

const transcriptionText = [
  "so we've got a React frontend...",
  '...it hits a Fastify API gateway...',
  '...Clerk handles the auth...',
  '...which calls into our Go core service...',
  '...that publishes events to a Kafka topic...',
  '...and writes to MySQL.',
  "wait — actually we're on Supabase, not MySQL...",
  '...oh and Redis in front for caching.',
  '...Datadog watching the gateway too.',
  '...and Cloudflare sitting in front of the Go backend.',
]

export default function ArchitectureDemo() {
  const [step, setStep] = useState(0)
  const arrowsRef = useRef<SVGSVGElement>(null)
  const diagramContainerRef = useRef<HTMLDivElement>(null)
  const [diagramScale, setDiagramScale] = useState(1)

  // sequence loop (0–11, steps 10–11 are rest)
  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s + 1) % 12), 1000)
    return () => clearInterval(interval)
  }, [])

  // mirror the svg viewbox scaling (xMidYMid meet) for the dom nodes layer
  useEffect(() => {
    const el = diagramContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setDiagramScale(Math.min(width / 600, height / 450))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // draw rough.js arrows based on current step
  useEffect(() => {
    if (!arrowsRef.current) return
    const svgNode = arrowsRef.current
    while (svgNode.firstChild) svgNode.removeChild(svgNode.firstChild)

    const rc = rough.svg(svgNode)

    function drawArrow(
      points: [number, number][],
      tip: [number, number],
      wing1: [number, number],
      wing2: [number, number],
      seed: number,
    ) {
      svgNode.appendChild(rc.curve(points, { roughness: 1.2, strokeWidth: 1.8, stroke: '#111111', bowing: 1, seed }))
      svgNode.appendChild(rc.line(tip[0], tip[1], wing1[0], wing1[1], { roughness: 1, strokeWidth: 1.8, stroke: '#111111', seed: seed + 1 }))
      svgNode.appendChild(rc.line(tip[0], tip[1], wing2[0], wing2[1], { roughness: 1, strokeWidth: 1.8, stroke: '#111111', seed: seed + 2 }))
    }

    // react -> fastify
    if (step >= 1) drawArrow([[140, 215], [160, 215], [175, 215]], [175, 215], [167, 207], [167, 223], 10)
    // fastify -> clerk
    if (step >= 2) drawArrow([[230, 255], [230, 280], [230, 315]], [230, 315], [222, 307], [238, 307], 20)
    // fastify -> go
    if (step >= 3) drawArrow([[280, 215], [300, 215], [315, 215]], [315, 215], [307, 207], [307, 223], 30)
    // go -> kafka
    if (step >= 4) drawArrow([[420, 215], [440, 215], [455, 215]], [455, 215], [447, 207], [447, 223], 40)
    // go -> mysql/supabase
    if (step >= 5) drawArrow([[380, 250], [420, 290], [455, 335]], [455, 335], [452, 323], [442, 332], 50)
    // go -> redis
    if (step >= 7) drawArrow([[370, 175], [370, 140], [370, 115]], [370, 115], [362, 123], [378, 123], 60)
    // datadog -> fastify
    if (step >= 8) drawArrow([[230, 115], [230, 140], [230, 175]], [230, 175], [222, 167], [238, 167], 70)
    // cloudflare -> go
    if (step >= 9) drawArrow([[370, 315], [370, 285], [370, 255]], [370, 255], [362, 263], [378, 263], 80)
  }, [step])

  return (
    <main className="relative z-10 grid grid-cols-1 lg:grid-cols-[2fr_3fr] mt-2 lg:mt-0 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 w-full max-w-[1600px] mx-auto min-w-0 shrink-0 lg:min-h-[550px] gap-3 pb-12 max-lg:pb-20 lg:pb-14">
      {/* left: voice stream */}
      <div className="flex flex-col justify-center max-lg:justify-start h-full gap-3 max-lg:gap-2 min-w-0 relative">
        <div className="flex items-center justify-between mb-2 max-lg:mb-1.5 z-20 relative border-b border-[#F0F0F0] pb-2">
          <div className="flex items-center gap-2 opacity-80">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-3 bg-primary animate-[pulse_1s_ease-in-out_infinite]"></div>
              <div className="w-1 h-5 bg-primary animate-[pulse_0.8s_ease-in-out_infinite_0.2s]"></div>
              <div className="w-1 h-2 bg-primary animate-[pulse_1.2s_ease-in-out_infinite_0.4s]"></div>
              <div className="w-1 h-4 bg-primary animate-[pulse_0.9s_ease-in-out_infinite_0.1s]"></div>
              <div className="w-1 h-3 bg-primary animate-[pulse_1.1s_ease-in-out_infinite_0.3s]"></div>
            </div>
            <span className="text-[11px] font-semibold text-primary font-mono uppercase">voice stream</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2.5 justify-start h-[min(370px,55vh)] min-h-[320px] overflow-hidden relative z-0 pb-1 max-lg:pb-0">
          {transcriptionText.map((text, idx) => (
            <div
              key={idx}
              className={`transition-all duration-500 ease-out flex-shrink-0 w-full ${idx <= step ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden'} ${idx === step ? 'opacity-100' : 'opacity-40'}`}
            >
              <p className={`font-mono text-[11px] sm:text-[13px] leading-relaxed ${idx === step ? 'text-primary font-medium' : 'text-[#888888]'}`}>
                {idx === 5 && step >= 6 ? <span className="line-through">{text}</span> : text}
              </p>
            </div>
          ))}
          {step < 10 && (
            <div className="flex items-center h-5 opacity-60 flex-shrink-0 mt-1">
              <div className="w-1.5 h-3.5 bg-primary animate-[pulse_0.8s_ease-in-out_infinite]"></div>
            </div>
          )}
        </div>
      </div>

      {/* right: generated diagram */}
      <div
        ref={diagramContainerRef}
        className="relative bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl w-full min-w-0 h-[min(450px,55vh)] min-h-[320px] lg:self-center overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(#D4D4D4 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      >
        {/* rough.js arrows overlay */}
        <svg ref={arrowsRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 600 450" preserveAspectRatio="xMidYMid meet" />

        {/* dom nodes */}
        <div style={{ position: 'absolute', width: '600px', height: '450px', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${diagramScale})`, transformOrigin: 'center center' }}>

          {/* react frontend */}
          <div className={`absolute top-[180px] left-[40px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: `#${siReact.hex}` }} fill="currentColor"><path d={siReact.path} /></svg>
            <span className={`text-[13px] text-[#333333] ${indieFlower.className}`} style={{ fontWeight: 600 }}>Frontend</span>
          </div>

          {/* fastify api gateway */}
          <div className={`absolute top-[180px] left-[180px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: `#${siFastify.hex}` }} fill="currentColor"><path d={siFastify.path} /></svg>
            <span className={`text-[13px] text-[#333333] ${indieFlower.className}`} style={{ fontWeight: 600 }}>API Gateway</span>
          </div>

          {/* clerk auth */}
          <div className={`absolute top-[320px] left-[180px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: `#${siClerk.hex}` }} fill="currentColor"><path d={siClerk.path} /></svg>
            <span className={`text-[13px] text-[#333333] ${indieFlower.className}`} style={{ fontWeight: 600 }}>Clerk</span>
          </div>

          {/* go core service */}
          <div className={`absolute top-[180px] left-[320px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 3 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <svg viewBox="0 0 24 24" className="w-5 h-4" style={{ color: `#${siGo.hex}` }} fill="currentColor"><path d={siGo.path} /></svg>
            <span className={`text-[13px] text-[#333333] ${indieFlower.className}`} style={{ fontWeight: 600 }}>Core Service</span>
          </div>

          {/* kafka */}
          <div className={`absolute top-[180px] left-[460px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 4 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: `#${siApachekafka.hex}` }} fill="currentColor"><path d={siApachekafka.path} /></svg>
            <span className={`text-[13px] text-[#333333] ${indieFlower.className}`} style={{ fontWeight: 600 }}>Kafka Topic</span>
          </div>

          {/* mysql -> supabase (correction) */}
          <div className={`absolute top-[320px] left-[460px] w-[100px] h-[70px] bg-white border shadow-sm rounded-full flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-in-out transform ${step >= 5 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${step >= 6 ? 'border-[#3FCF8E] shadow-[0_0_12px_rgba(63,207,142,0.2)]' : 'border-[#E0E0E0]'}`}>
            {step < 6 ? (
              <>
                <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: `#${siMysql.hex}` }} fill="currentColor"><path d={siMysql.path} /></svg>
                <span className={`text-[13px] text-[#333333] ${indieFlower.className}`} style={{ fontWeight: 600 }}>MySQL</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: `#${siSupabase.hex}` }} fill="currentColor"><path d={siSupabase.path} /></svg>
                <span className={`text-[13px] text-[#333333] ${indieFlower.className}`} style={{ fontWeight: 600 }}>Supabase</span>
              </>
            )}
          </div>

          {/* redis cache */}
          <div className={`absolute top-[40px] left-[320px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: `#${siRedis.hex}` }} fill="currentColor"><path d={siRedis.path} /></svg>
            <span className={`text-[13px] text-[#333333] ${indieFlower.className}`} style={{ fontWeight: 600 }}>Redis Cache</span>
          </div>

          {/* datadog */}
          <div className={`absolute top-[40px] left-[180px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 8 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: `#${siDatadog.hex}` }} fill="currentColor"><path d={siDatadog.path} /></svg>
            <span className={`text-[13px] text-[#333333] ${indieFlower.className}`} style={{ fontWeight: 600 }}>Datadog Agent</span>
          </div>

          {/* cloudflare */}
          <div className={`absolute top-[320px] left-[320px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 9 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: `#${siCloudflare.hex}` }} fill="currentColor"><path d={siCloudflare.path} /></svg>
            <span className={`text-[13px] text-[#333333] ${indieFlower.className}`} style={{ fontWeight: 600 }}>Cloudflare</span>
          </div>

        </div>
      </div>
    </main>
  )
}
