"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { IconX } from "@tabler/icons-react";

const STORAGE_KEY = "yapdraw-storage-banner-dismissed";

export default function StorageBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    setMounted(true);
    // double rAF so the enter transition plays after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => setMounted(false), 350);
  }

  if (!mounted) return null;

  return (
    <div
      className={`fixed top-16 right-4 z-50 w-72 bg-white border border-border-subtle rounded-2xl shadow-2xl shadow-black/10 transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <Image
          src="/yapdraw_logo.png"
          alt="YapDraw"
          width={32}
          height={32}
          className="rounded-lg shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">YapDraw</p>
          <p className="text-xs text-subtle leading-snug mt-0.5">
            Diagrams are stored in your browser — export to back up.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-placeholder hover:text-muted transition-colors mt-0.5"
          aria-label="Dismiss"
        >
          <IconX size={14} />
        </button>
      </div>
    </div>
  );
}
