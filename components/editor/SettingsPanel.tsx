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
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-sm font-semibold text-[#0F172A]">Settings</h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
            <IconX size={18} />
          </button>
        </div>

        {/* body */}
        <div className="px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#64748B]">AI provider</label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as UserProvider)}
              className="w-full text-sm bg-[#F8FAFC] border border-[#D1D5DB] rounded-lg px-3 py-2 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#5B57D1]"
            >
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#64748B]">API key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={placeholder}
              className="w-full text-sm bg-[#F8FAFC] border border-[#D1D5DB] rounded-lg px-3 py-2 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#5B57D1]"
            />
            <p className="text-xs text-[#94A3B8]">
              Leave blank to use our free tier — Groq (Llama 3.3 70B)
            </p>
          </div>
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E5E7EB]">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-sm px-4 py-2 bg-[#5B57D1] text-white rounded-lg hover:bg-[#4F4BC4] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
