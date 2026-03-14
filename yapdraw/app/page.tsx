import ExcalidrawCanvas from '@/components/ExcalidrawCanvas'
import VoicePanel from '@/components/VoicePanel'

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-[35%] h-full border-r border-zinc-200">
        <VoicePanel />
      </div>
      <div className="w-[65%] h-full">
        <ExcalidrawCanvas />
      </div>
    </div>
  )
}
