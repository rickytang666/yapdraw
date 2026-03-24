'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconPlus, IconSearch, IconUpload, IconSettings, IconKey } from '@tabler/icons-react'
import SortDropdown from './SortDropdown'
import ViewModeToggle from './ViewModeToggle'
import type { SortField, SortDirection, ViewMode } from '@/types/library'
import type { UserSettings } from '@/hooks/useUserSettings'

interface LibraryHeaderProps {
  sectionLabel: string
  isTrash: boolean
  searchQuery: string
  onSearch: (q: string) => void
  searchRef: React.RefObject<HTMLInputElement | null>
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField, direction: SortDirection) => void
  viewMode: ViewMode
  onViewMode: (mode: ViewMode) => void
  onImport: () => void
  settings: UserSettings
  onOpenSettings: () => void
  onNewDiagram: () => void
}

export default function LibraryHeader({
  sectionLabel,
  isTrash,
  searchQuery,
  onSearch,
  searchRef,
  sortField,
  sortDirection,
  onSort,
  viewMode,
  onViewMode,
  onImport,
  settings,
  onOpenSettings,
  onNewDiagram,
}: LibraryHeaderProps) {
  return (
    <header className="flex items-center gap-2 md:gap-3 h-14 px-4 md:px-6 border-b border-surface bg-white shrink-0">
      <Link href="/" className="sm:hidden shrink-0">
        <Image src="/yapdraw_logo.png" alt="YapDraw" width={24} height={24} className="rounded" />
      </Link>
      <h2 className="text-foreground font-semibold text-base shrink-0 hidden sm:block">{sectionLabel}</h2>

      {!isTrash && (
        <div className="flex items-center gap-2 sm:ml-4 bg-white border border-border-subtle rounded-md px-3 py-1.5 flex-1 max-w-xs">
          <IconSearch size={14} className="text-placeholder shrink-0" />
          <input
            ref={searchRef}
            className="bg-transparent text-sm text-foreground placeholder-placeholder outline-none flex-1"
            placeholder="Search diagrams…"
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
          />
          {!searchQuery && (
            <kbd className="hidden sm:flex items-center gap-0.5 text-placeholder text-xs font-sans pointer-events-none">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          )}
        </div>
      )}

      <div className="flex-1" />

      {!isTrash && (
        <div className="hidden md:flex items-center gap-2">
          <SortDropdown
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <ViewModeToggle viewMode={viewMode} onToggle={onViewMode} />
        </div>
      )}

      {!isTrash && (
        <button
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-muted hover:text-foreground hover:bg-surface border border-border hover:border-placeholder text-sm rounded-md transition-colors"
          onClick={onImport}
          title="Import .excalidraw file"
        >
          <IconUpload size={15} />
          <span className="hidden sm:inline">Import</span>
        </button>
      )}

      <button
        onClick={onOpenSettings}
        className={`flex items-center p-1.5 rounded-md transition-colors ${
          !settings.apiKey
            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
            : 'text-placeholder hover:text-muted hover:bg-surface'
        }`}
        aria-label="Open settings"
      >
        {!settings.apiKey
          ? <IconKey size={18} className="animate-pulse" />
          : <IconSettings size={18} />
        }
      </button>

      {!isTrash && (
        <button
          className="flex items-center gap-2 px-2.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-colors"
          onClick={onNewDiagram}
        >
          <IconPlus size={16} />
          <span className="hidden sm:inline">New Diagram</span>
        </button>
      )}
    </header>
  )
}
