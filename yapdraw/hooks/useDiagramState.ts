import { ExcalidrawElement } from '@/types/diagram'

export function useDiagramState() {
  return {
    elements: [] as ExcalidrawElement[],
    applyUpdate: (_elements: ExcalidrawElement[]) => {},
  }
}
