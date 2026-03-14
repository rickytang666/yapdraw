import { useLibrary } from '@/hooks/useLibrary'
import SidebarFixedSection from './SidebarFixedSection'

interface Props {
  trashedCount: number
}

export default function Sidebar({ trashedCount }: Props) {
  const { state, setSection } = useLibrary()

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 px-4 py-4 flex flex-col gap-2">
      <SidebarFixedSection
        active={state.activeSection === 'all'}
        label="All diagrams"
        onClick={() => setSection('all')}
      />
      <SidebarFixedSection
        active={state.activeSection === 'starred'}
        label="Starred"
        onClick={() => setSection('starred')}
      />
      <SidebarFixedSection
        active={state.activeSection === 'recent'}
        label="Recent"
        onClick={() => setSection('recent')}
      />
      <SidebarFixedSection
        active={state.activeSection === 'trash'}
        label="Trash"
        count={trashedCount}
        onClick={() => setSection('trash')}
      />
      <button
        type="button"
        className="mt-4 inline-flex items-center justify-center rounded-md bg-zinc-800 px-3 py-2 text-sm font-medium hover:bg-zinc-700"
        onClick={() => {
          window.location.href = '/d/new'
        }}
      >
        New Diagram
      </button>
    </aside>
  )
}

