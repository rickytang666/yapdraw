'use client'

import { useState } from 'react'
import { IconX } from '@tabler/icons-react'
import type { UserProvider, UserSettings } from '@/hooks/useUserSettings'

interface Props {
  settings: UserSettings
  onSave: (settings: UserSettings) => void
  onClose: () => void
}

const PROVIDERS: { id: UserProvider; label: string; placeholder: string }[] = [
  { id: 'openrouter', label: 'OpenRouter',       placeholder: 'sk-or-...' },
  { id: 'google',     label: 'Google AI Studio', placeholder: 'AIza...'   },
]

export default function SettingsPanel({ settings, onSave, onClose }: Props) {
  const [provider, setProvider] = useState<UserProvider>(settings.provider)
  const [apiKey, setApiKey]     = useState(settings.apiKey)

  function handleSave() {
    onSave({ provider, apiKey: apiKey.trim() })
    onClose()
  }

  const placeholder = PROVIDERS.find(p => p.id === provider)!.placeholder

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-sm font-semibold text-foreground">Settings</h2>
          <button onClick={onClose} className="text-placeholder hover:text-muted transition-colors">
            <IconX size={18} />
          </button>
        </div>

        {/* body */}
        <div className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-subtle">AI provider</label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as UserProvider)}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-subtle">API key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={placeholder}
              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-placeholder">
              Leave blank to use our free tier — Groq (Llama 3.3 70B)
            </p>
          </div>
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 text-subtle hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-sm px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
