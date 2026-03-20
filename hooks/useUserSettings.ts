"use client";

import { useCallback, useSyncExternalStore } from "react";

export type UserProvider = "openrouter" | "google";

export interface UserSettings {
  provider: UserProvider;
  apiKey: string; // empty = fall back to free tier (groq)
}

const STORAGE_KEY = "yapdraw-user-settings";

const DEFAULT_SETTINGS: UserSettings = {
  provider: "openrouter",
  apiKey: "",
};

let clientCache: UserSettings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();
let didScheduleHydrate = false;

function load(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function getSnapshot(): UserSettings {
  return clientCache;
}

function getServerSnapshot(): UserSettings {
  return DEFAULT_SETTINGS;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(onChange);
    };
  }

  const onStorage = () => {
    clientCache = load();
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);

  if (!didScheduleHydrate) {
    didScheduleHydrate = true;
    clientCache = load();
    queueMicrotask(() => {
      listeners.forEach((l) => l());
    });
  }

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useUserSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setSettings = useCallback(
    (update: UserSettings | ((prev: UserSettings) => UserSettings)) => {
      const next =
        typeof update === "function"
          ? (update as (prev: UserSettings) => UserSettings)(clientCache)
          : update;
      clientCache = next;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota / private mode */
      }
      listeners.forEach((l) => l());
    },
    [],
  );

  return { settings, setSettings };
}
