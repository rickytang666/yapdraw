'use client'

import { useState, useEffect } from 'react'

export type UserProvider = 'openrouter' | 'google'

export interface UserSettings {
  provider: UserProvider
  apiKey: string  // empty = fall back to free tier (groq)
}

const STORAGE_KEY = 'yapdraw-user-settings'

const DEFAULT_SETTINGS: UserSettings = {
  provider: 'openrouter',
  apiKey: '',
}

function load(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  return { settings, setSettings }
}
