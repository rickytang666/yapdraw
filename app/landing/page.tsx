'use client'

import Link from 'next/link'
import Image from 'next/image'
import { IconStar, IconArrowRight, IconFolders } from '@tabler/icons-react'
import { FaGithub, FaYoutube } from 'react-icons/fa'
import ArchitectureDemo from '@/components/landing/ArchitectureDemo'

export default function LandingPage() {
  return (
    <div className="h-screen max-h-dvh w-full bg-[#FDFDFC] text-[#111111] font-sans overflow-y-auto overflow-x-hidden flex flex-col justify-start selection:bg-[#EAEAEA]">
      {/* background soft grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.25] mix-blend-multiply flex-1"
        style={{
          backgroundSize: '32px 32px',
          backgroundImage:
            'linear-gradient(to right, #EEEEEE 1px, transparent 1px), linear-gradient(to bottom, #EEEEEE 1px, transparent 1px)',
        }}
      />

      <header className="relative z-10 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-6 flex flex-col gap-6">
        {/* navbar */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded overflow-hidden shadow-sm flex items-center justify-center border border-[#EAEAEA] bg-white">
              <Image src="/yapdraw_logo.png" alt="YapDraw Logo" width={20} height={20} className="object-cover opacity-90" />
            </div>
            <span className="text-[13px] font-semibold tracking-wide">YapDraw</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/rickytang666/yapdraw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-border/50 hover:border-border transition-all group shadow-sm"
            >
              <FaGithub className="w-5 h-5 shrink-0" />
              <span className="text-[11px] font-semibold tracking-wide hidden sm:block">Star us on GitHub!</span>
              <IconStar className="w-4 h-4 group-hover:fill-yellow-500/40 group-hover:text-yellow-500 transition-colors hidden sm:block shrink-0" />
            </a>
            <a
              href="https://youtu.be/gSKKap_LVrg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-border/50 hover:border-border transition-all group shadow-sm"
            >
              <FaYoutube className="w-5 h-5 shrink-0 group-hover:text-[#FF0000] transition-colors" />
              <span className="text-[11px] font-semibold tracking-wide hidden sm:block">Demo Video</span>
            </a>
          </div>
        </div>

        {/* hero */}
        <div className="flex flex-col gap-3 max-w-xl">
          <h1 className="text-[34px] md:text-[42px] font-medium tracking-tight text-[#111111] leading-[1.1]">
            The whiteboard that{' '}
            <span className="relative whitespace-nowrap inline-block z-10 text-primary">
              listens.
              <span className="absolute inset-0 bg-primary/10 -z-10 rounded-sm scale-105" />
            </span>
          </h1>
          <p className="text-[15px] text-[#666666] leading-relaxed">
            Talk through your idea — corrections, second thoughts, and all. It keeps up.
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

      <ArchitectureDemo />
    </div>
  )
}
