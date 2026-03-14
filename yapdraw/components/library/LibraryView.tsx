'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLibrary } from '@/hooks/useLibrary'
import { migrateFromLocalStorage } from '@/lib/migrate'
import Sidebar from './Sidebar'
import DiagramGrid from './DiagramGrid'
import TrashView from './TrashView'

export default function LibraryView() {
  const router = useRouter()
  const { state, diagrams, trashedCount, purgeExpiredTrash } = useLibrary()

  useEffect(() => {
    migrateFromLocalStorage().then((id) => {
      if (id) {
        router.push(`/d/${id}`)
      }
    })
    purgeExpiredTrash()
  }, [router, purgeExpiredTrash])

  const isTrash = state.activeSection === 'trash'

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100">
      <Sidebar trashedCount={trashedCount} />
      <main className="flex-1 min-w-0 p-6 overflow-auto">
        {isTrash ? <TrashView /> : <DiagramGrid diagrams={diagrams} />}
      </main>
    </div>
  )
}

