import * as si from 'simple-icons'
import type { BinaryFileData } from "@/types/diagram"

// build slug → icon map once at module init (server-side only)
const slugMap = new Map<string, { svg: string; hex: string }>()
for (const value of Object.values(si)) {
  if (value && typeof value === 'object' && 'slug' in value) {
    const icon = value as { slug: string; svg: string; hex: string }
    slugMap.set(icon.slug, icon)
  }
}

export interface IconRequest {
  slug: string
  colorHex: string // hex with # prefix, used to tint the icon
}

export function iconFileId(slug: string, colorHex: string): string {
  return `simpleicon-${slug}-${colorHex.replace("#", "")}`
}

export function fetchIcons(requests: IconRequest[]): BinaryFileData[] {
  const seen = new Map<string, IconRequest>()
  for (const r of requests) {
    const id = iconFileId(r.slug, r.colorHex)
    if (!seen.has(id)) seen.set(id, r)
  }

  const results: BinaryFileData[] = []
  for (const [fileId, { slug, colorHex }] of seen) {
    const icon = slugMap.get(slug)
    if (!icon) continue

    // inject fill color into the svg root element
    const tinted = icon.svg.replace('<svg ', `<svg fill="${colorHex}" `)
    const dataURL = `data:image/svg+xml;base64,${Buffer.from(tinted).toString('base64')}`
    results.push({
      id: fileId,
      mimeType: 'image/svg+xml',
      dataURL,
      created: Date.now(),
    })
  }
  return results
}
