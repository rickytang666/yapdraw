import type { GraphNode, BinaryFileData } from '@/types/diagram'

// Normalize common name variants to their Simple Icons slugs
const SLUG_ALIASES: Record<string, string> = {
  postgres:       'postgresql',
  node:           'nodedotjs',
  nodejs:         'nodedotjs',
  next:           'nextdotjs',
  nextjs:         'nextdotjs',
  vue:            'vuedotjs',
  vuejs:          'vuedotjs',
  aws:            'amazonaws',
  gcp:            'googlecloud',
  google:         'googlecloud',
  mongo:          'mongodb',
  elastic:        'elasticsearch',
  k8s:            'kubernetes',
  rabbit:         'rabbitmq',
  rabbitmq:       'rabbitmq',
  couch:          'couchdb',
  dynamo:         'amazondynamodb',
  dynamodb:       'amazondynamodb',
  s3:             'amazons3',
  lambda:         'awslambda',
  cloudwatch:     'amazoncloudwatch',
  sqs:            'amazonsqs',
  sns:            'amazonsns',
  rds:            'amazonrds',
  cloudfront:     'amazoncloudfront',
  ecr:            'amazonecr',
  ecs:            'amazonecs',
  bigquery:       'googlebigquery',
  pubsub:         'googlepubsub',
  firebase:       'firebase',
  supabase:       'supabase',
  stripe:         'stripe',
  twilio:         'twilio',
  sendgrid:       'sendgrid',
  datadog:        'datadog',
  grafana:        'grafana',
  prometheus:     'prometheus',
  jenkins:        'jenkins',
  github:         'github',
  gitlab:         'gitlab',
  vercel:         'vercel',
  netlify:        'netlify',
  heroku:         'heroku',
  digitalocean:   'digitalocean',
  azure:          'microsoftazure',
}

export function normalizeSlug(raw: string): string {
  const lower = raw.toLowerCase().trim()
  return SLUG_ALIASES[lower] ?? lower
}

// In-memory cache: slug → BinaryFileData (process-lifetime)
const cache = new Map<string, BinaryFileData>()

export async function fetchIcons(nodes: GraphNode[]): Promise<BinaryFileData[]> {
  const slugs = [...new Set(
    nodes
      .filter(n => n.icon)
      .map(n => normalizeSlug(n.icon!))
  )]

  const results: BinaryFileData[] = []

  await Promise.all(slugs.map(async (slug) => {
    if (cache.has(slug)) {
      results.push(cache.get(slug)!)
      return
    }

    try {
      // Request black fill so icons are visible on all node background colors
      const res = await fetch(`https://cdn.simpleicons.org/${slug}/4a4a4a`, {
        next: { revalidate: 86400 }, // cache at HTTP level for 24h
      } as RequestInit)
      if (!res.ok) return

      const svgText = await res.text()
      const dataURL = `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`
      const file: BinaryFileData = {
        id: `simpleicon-${slug}`,
        mimeType: 'image/svg+xml',
        dataURL,
        created: Date.now(),
      }
      cache.set(slug, file)
      results.push(file)
    } catch {
      // Network error or bad slug — skip silently
    }
  }))

  return results
}
