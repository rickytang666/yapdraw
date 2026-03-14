import { useLibrary } from '@/hooks/useLibrary'

export default function TrashView() {
  const { diagrams, restoreDiagram, permanentlyDelete, emptyTrash } = useLibrary()

  if (!diagrams.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-500 text-sm">
        <p>Trash is empty.</p>
        <button
          type="button"
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          onClick={() => emptyTrash()}
        >
          Empty trash
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-zinc-100">Trash</h2>
        <button
          type="button"
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          onClick={() => emptyTrash()}
        >
          Empty trash
        </button>
      </div>
      <ul className="space-y-2">
        {diagrams.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
          >
            <div className="flex flex-col">
              <span className="font-medium text-zinc-100">{d.name}</span>
              <span className="text-[11px] text-zinc-500">
                Deleted {d.trashedAt ? new Date(d.trashedAt).toLocaleString() : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
                onClick={() => restoreDiagram(d.id)}
              >
                Restore
              </button>
              <button
                type="button"
                className="rounded-md border border-red-700 px-2 py-1 text-xs text-red-200 hover:bg-red-900"
                onClick={() => permanentlyDelete(d.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

