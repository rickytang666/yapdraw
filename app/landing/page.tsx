"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import rough from "roughjs";
import { Indie_Flower } from "next/font/google";
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
  siGithub,
} from "simple-icons";
import { IconStar, IconArrowRight, IconFolders } from "@tabler/icons-react";
import { FaGithub } from "react-icons/fa";

const indieFlower = Indie_Flower({
  subsets: ["latin"],
  weight: "400",
});

export default function LandingPage() {
  const [step, setStep] = useState(0);
  const arrowsRef = useRef<SVGSVGElement>(null);
  const diagramContainerRef = useRef<HTMLDivElement>(null);
  const [diagramScale, setDiagramScale] = useState(1);

  useEffect(() => {
    // Sequence loop (0 to 11 steps, step 10 and 11 are rest)
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 12);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mirror the SVG viewBox scaling (xMidYMid meet) for the DOM nodes layer
  useEffect(() => {
    const el = diagramContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDiagramScale(Math.min(width / 600, height / 450));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Draw rough.js arrows dynamically based on the step
  useEffect(() => {
    if (!arrowsRef.current) return;
    const svgNode = arrowsRef.current;

    // Clear previous drawings
    while (svgNode.firstChild) {
      svgNode.removeChild(svgNode.firstChild);
    }

    const rc = rough.svg(svgNode);

    const drawRoughArrow = (
      points: [number, number][],
      tip: [number, number],
      wing1: [number, number],
      wing2: [number, number],
      customSeed: number,
    ) => {
      const curve = rc.curve(points, {
        roughness: 1.2,
        strokeWidth: 1.8,
        stroke: "#111111",
        bowing: 1,
        seed: customSeed,
      });
      svgNode.appendChild(curve);
      const w1 = rc.line(tip[0], tip[1], wing1[0], wing1[1], {
        roughness: 1,
        strokeWidth: 1.8,
        stroke: "#111111",
        seed: customSeed + 1,
      });
      const w2 = rc.line(tip[0], tip[1], wing2[0], wing2[1], {
        roughness: 1,
        strokeWidth: 1.8,
        stroke: "#111111",
        seed: customSeed + 2,
      });
      svgNode.appendChild(w1);
      svgNode.appendChild(w2);
    };

    if (step >= 1) {
      // React (40) -> Fastify (180)
      drawRoughArrow(
        [
          [140, 215],
          [160, 215],
          [175, 215],
        ],
        [175, 215],
        [167, 207],
        [167, 223],
        10,
      );
    }
    if (step >= 2) {
      // Fastify (180, 250) down to Clerk (180, 320)
      drawRoughArrow(
        [
          [230, 255],
          [230, 280],
          [230, 315],
        ],
        [230, 315],
        [222, 307],
        [238, 307],
        20,
      );
    }
    if (step >= 3) {
      // Fastify (180) -> Go (320)
      drawRoughArrow(
        [
          [280, 215],
          [300, 215],
          [315, 215],
        ],
        [315, 215],
        [307, 207],
        [307, 223],
        30,
      );
    }
    if (step >= 4) {
      // Go (320) -> Kafka (460)
      drawRoughArrow(
        [
          [420, 215],
          [440, 215],
          [455, 215],
        ],
        [455, 215],
        [447, 207],
        [447, 223],
        40,
      );
    }
    if (step >= 5) {
      // Go (x:370, y:250) -> MySQL (x:455, y:335)
      drawRoughArrow(
        [
          [380, 250],
          [420, 290],
          [455, 335],
        ],
        [455, 335],
        [452, 323],
        [442, 332],
        50,
      );
    }
    if (step >= 7) {
      // Go (x:370, y:180) up to Redis (370, 115)
      drawRoughArrow(
        [
          [370, 175],
          [370, 140],
          [370, 115],
        ],
        [370, 115],
        [362, 123],
        [378, 123],
        60,
      );
    }
    if (step >= 8) {
      // Datadog (230, 40) down to Fastify (230, 175)
      drawRoughArrow(
        [
          [230, 115],
          [230, 140],
          [230, 175],
        ],
        [230, 175],
        [222, 167],
        [238, 167],
        70,
      );
    }
    if (step >= 9) {
      // Cloudflare (370, 320) straight UP to Go (370, 250)
      drawRoughArrow(
        [
          [370, 315],
          [370, 285],
          [370, 255],
        ],
        [370, 255],
        [362, 263],
        [378, 263],
        80,
      );
    }
  }, [step]);

  const transcriptionText = [
    "so we've got a React frontend...",
    "...it hits a Fastify API gateway...",
    "...Clerk handles the auth...",
    "...which calls into our Go core service...",
    "...that publishes events to a Kafka topic...",
    "...and writes to MySQL.",
    "wait — actually we're on Supabase, not MySQL...",
    "...oh and Redis in front for caching.",
    "...Datadog watching the gateway too.",
    "...and Cloudflare sitting in front of the Go backend.",
  ];

  return (
    <div className="h-screen max-h-dvh w-full bg-[#FDFDFC] text-[#111111] font-sans overflow-y-auto overflow-x-hidden flex flex-col justify-start selection:bg-[#EAEAEA]">
      {/* Background Soft Grids */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.25] mix-blend-multiply flex-1"
        style={{
          backgroundSize: "32px 32px",
          backgroundImage:
            "linear-gradient(to right, #EEEEEE 1px, transparent 1px), linear-gradient(to bottom, #EEEEEE 1px, transparent 1px)",
        }}
      ></div>

      {/* Top Left: Pitch & CTA */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-6">
        {/* navbar row: logo + github */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded overflow-hidden shadow-sm flex items-center justify-center border border-[#EAEAEA] bg-white">
              <Image
                src="/yapdraw_logo.png"
                alt="YapDraw Logo"
                width={20}
                height={20}
                className="object-cover opacity-90"
              />
            </div>
            <span className="text-[13px] font-semibold tracking-wide">
              YapDraw
            </span>
          </div>
          <a
            href="https://github.com/rickytang666/yapdraw"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-border/50 hover:border-border transition-all group shadow-sm"
          >
            <FaGithub className="w-5 h-5 shrink-0" />
            <span className="text-[11px] font-semibold tracking-wide hidden sm:block">
              Star us on GitHub!
            </span>
            <IconStar className="w-4 h-4 group-hover:fill-yellow-500/40 group-hover:text-yellow-500 transition-colors hidden sm:block shrink-0" />
          </a>
        </div>

        <div className="flex flex-col gap-3 max-w-xl">
          <h1 className="text-[34px] md:text-[42px] font-medium tracking-tight text-[#111111] leading-[1.1]">
            The whiteboard that{" "}
            <span
              className={`relative whitespace-nowrap inline-block z-10 text-primary`}
            >
              listens.
              <span className="absolute inset-0 bg-primary/10 -z-10 rounded-sm scale-105"></span>
            </span>
          </h1>

          <p className="text-[15px] text-[#666666] leading-relaxed">
            Think out loud. Watch it draw.
          </p>

          <div className="flex items-center gap-3 mt-2">
            <Link
              href="/d/new"
              className="group flex items-center justify-center gap-2 bg-white border border-border px-5 py-3 rounded-xl text-[13px] font-semibold transition-all hover:text-primary hover:border-primary/30 shadow-sm active:scale-[0.98]"
            >
              Start drawing
              <IconArrowRight className="w-5 h-5 group-hover:fill-primary/20 group-hover:text-primary transition-all" />
            </Link>

            <Link
              href="/library"
              className="group flex items-center justify-center gap-2 bg-white border border-border px-5 py-3 rounded-xl text-[13px] font-semibold transition-all hover:text-primary hover:border-primary/30"
            >
              Go to Library
              <IconFolders className="w-5 h-5 group-hover:fill-primary/20 group-hover:text-primary transition-all" />
            </Link>
          </div>
        </div>
      </header>

      {/* Center Layout: Transcription vs Canvas */}
      <main className="relative z-10 grid grid-cols-1 lg:grid-cols-[2fr_3fr] mt-2 lg:mt-0 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 w-full max-w-[1600px] mx-auto min-w-0 shrink-0 lg:min-h-[550px] gap-3 pb-12 max-lg:pb-20 lg:pb-14">
        {/* Left Side: Voice Stream */}
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
              <span className="text-[11px] font-semibold text-primary font-mono uppercase">
                voice stream
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:gap-2.5 justify-start h-[min(370px,55vh)] min-h-[320px] overflow-hidden relative z-0 pb-1 max-lg:pb-0">
            {transcriptionText.map((text, idx) => (
              <div
                key={idx}
                className={`
                     transition-all duration-500 ease-out flex-shrink-0 w-full
                     ${idx <= step ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 hidden"}
                     ${idx === step ? "opacity-100" : "opacity-40"}
                   `}
              >
                <p
                  className={`font-mono text-[11px] sm:text-[13px] leading-relaxed ${idx === step ? "text-primary font-medium" : "text-[#888888]"}`}
                >
                  {idx === 5 && step >= 6 ? (
                    <span className="line-through">{text}</span>
                  ) : (
                    text
                  )}
                </p>
              </div>
            ))}
            {/* Minimal terminal cursor */}
            {step < 10 && (
              <div className="flex items-center h-5 opacity-60 flex-shrink-0 mt-1">
                <div className="w-1.5 h-3.5 bg-primary animate-[pulse_0.8s_ease-in-out_infinite]"></div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Generated DOM Architecture Diagram (hidden on small screens) */}
        <div
          ref={diagramContainerRef}
          className="relative bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl w-full min-w-0 h-[min(450px,55vh)] min-h-[320px] lg:self-center overflow-hidden"
          style={{
            backgroundImage: "radial-gradient(#D4D4D4 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          {/* Rough.js overlay layer for hand-drawn arrows */}
          <svg
            ref={arrowsRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 600 450"
            preserveAspectRatio="xMidYMid meet"
          ></svg>

          {/* DOM Nodes Layer */}
          <div
            style={{
              position: "absolute",
              width: "600px",
              height: "450px",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) scale(${diagramScale})`,
              transformOrigin: "center center",
            }}
          >
            {/* 0: React Frontend */}
            <div
              className={`absolute top-[180px] left-[40px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 0 ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                style={{ color: `#${siReact.hex}` }}
                fill="currentColor"
              >
                <path d={siReact.path} />
              </svg>
              <span
                className={`text-[13px] text-[#333333] ${indieFlower.className}`}
                style={{ fontWeight: 600 }}
              >
                Frontend
              </span>
            </div>

            {/* 1: Fastify API Gateway */}
            <div
              className={`absolute top-[180px] left-[180px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                style={{ color: `#${siFastify.hex}` }}
                fill="currentColor"
              >
                <path d={siFastify.path} />
              </svg>
              <span
                className={`text-[13px] text-[#333333] ${indieFlower.className}`}
                style={{ fontWeight: 600 }}
              >
                API Gateway
              </span>
            </div>

            {/* 2: Clerk Auth */}
            <div
              className={`absolute top-[320px] left-[180px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                style={{ color: `#${siClerk.hex}` }}
                fill="currentColor"
              >
                <path d={siClerk.path} />
              </svg>
              <span
                className={`text-[13px] text-[#333333] ${indieFlower.className}`}
                style={{ fontWeight: 600 }}
              >
                Clerk
              </span>
            </div>

            {/* 3: Go Core Service */}
            <div
              className={`absolute top-[180px] left-[320px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 3 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-4"
                style={{ color: `#${siGo.hex}` }}
                fill="currentColor"
              >
                <path d={siGo.path} />
              </svg>
              <span
                className={`text-[13px] text-[#333333] ${indieFlower.className}`}
                style={{ fontWeight: 600 }}
              >
                Core Service
              </span>
            </div>

            {/* 4: Apache Kafka */}
            <div
              className={`absolute top-[180px] left-[460px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 4 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                style={{ color: `#${siApachekafka.hex}` }}
                fill="currentColor"
              >
                <path d={siApachekafka.path} />
              </svg>
              <span
                className={`text-[13px] text-[#333333] ${indieFlower.className}`}
                style={{ fontWeight: 600 }}
              >
                Kafka Topic
              </span>
            </div>

            {/* 5 & 6: MySQL -> Supabase (Correction logic) */}
            <div
              className={`absolute top-[320px] left-[460px] w-[100px] h-[70px] bg-white border shadow-sm rounded-full flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-in-out transform
               ${step >= 5 ? "opacity-100 scale-100" : "opacity-0 scale-95"}
               ${step >= 6 ? "border-[#3FCF8E] shadow-[0_0_12px_rgba(63,207,142,0.2)]" : "border-[#E0E0E0]"}
             `}
            >
              {step < 6 ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    style={{ color: `#${siMysql.hex}` }}
                    fill="currentColor"
                  >
                    <path d={siMysql.path} />
                  </svg>
                  <span
                    className={`text-[13px] text-[#333333] ${indieFlower.className}`}
                    style={{ fontWeight: 600 }}
                  >
                    MySQL
                  </span>
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    style={{ color: `#${siSupabase.hex}` }}
                    fill="currentColor"
                  >
                    <path d={siSupabase.path} />
                  </svg>
                  <span
                    className={`text-[13px] text-[#333333] ${indieFlower.className}`}
                    style={{ fontWeight: 600 }}
                  >
                    Supabase
                  </span>
                </>
              )}
            </div>

            {/* 7: Redis Cache */}
            <div
              className={`absolute top-[40px] left-[320px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 7 ? "opacity-100 translate-y-0" : "opacity-y-4"} ${step < 7 ? "opacity-0 translate-y-4" : ""}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                style={{ color: `#${siRedis.hex}` }}
                fill="currentColor"
              >
                <path d={siRedis.path} />
              </svg>
              <span
                className={`text-[13px] text-[#333333] ${indieFlower.className}`}
                style={{ fontWeight: 600 }}
              >
                Redis Cache
              </span>
            </div>

            {/* 8: Datadog */}
            <div
              className={`absolute top-[40px] left-[180px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 8 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                style={{ color: `#${siDatadog.hex}` }}
                fill="currentColor"
              >
                <path d={siDatadog.path} />
              </svg>
              <span
                className={`text-[13px] text-[#333333] ${indieFlower.className}`}
                style={{ fontWeight: 600 }}
              >
                Datadog Agent
              </span>
            </div>

            {/* 9: Cloudflare */}
            <div
              className={`absolute top-[320px] left-[320px] w-[100px] h-[70px] bg-white border border-[#E0E0E0] shadow-sm rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-700 ease-out transform ${step >= 9 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                style={{ color: `#${siCloudflare.hex}` }}
                fill="currentColor"
              >
                <path d={siCloudflare.path} />
              </svg>
              <span
                className={`text-[13px] text-[#333333] ${indieFlower.className}`}
                style={{ fontWeight: 600 }}
              >
                Cloudflare
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
