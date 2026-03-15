import type { BinaryFileData } from "@/types/diagram";

// Normalize common name variants to their Simple Icons slugs
const SLUG_ALIASES: Record<string, string> = {
  postgres: "postgresql",
  node: "nodedotjs",
  nodejs: "nodedotjs",
  next: "nextdotjs",
  nextjs: "nextdotjs",
  vue: "vuedotjs",
  vuejs: "vuedotjs",
  gcp: "googlecloud",
  google: "googlecloud",
  mongo: "mongodb",
  elastic: "elasticsearch",
  k8s: "kubernetes",
  rabbit: "rabbitmq",
  rabbitmq: "rabbitmq",
  couch: "couchdb",
  cloudfront: "amazoncloudfront",
  bigquery: "googlebigquery",
  pubsub: "googlepubsub",
  firebase: "firebase",
  supabase: "supabase",
  stripe: "stripe",
  twilio: "twilio",
  sendgrid: "sendgrid",
  datadog: "datadog",
  grafana: "grafana",
  prometheus: "prometheus",
  jenkins: "jenkins",
  github: "github",
  gitlab: "gitlab",
  vercel: "vercel",
  netlify: "netlify",
  heroku: "heroku",
  digitalocean: "digitalocean",
  azure: "microsoftazure",
};

export function normalizeSlug(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return SLUG_ALIASES[lower] ?? lower;
}

// Keywords in node/group labels that map to a known slug.
// Checked in order — first match wins.
const LABEL_KEYWORDS: Array<[RegExp, string]> = [
  [/\bpostgres(ql)?\b/i, "postgresql"],
  [/\bmysql\b/i, "mysql"],
  [/\bmongo(db)?\b/i, "mongodb"],
  [/\bredis\b/i, "redis"],
  [/\belastic(search)?\b/i, "elasticsearch"],
  [/\bkafka\b/i, "apachekafka"],
  [/\brabbitmq\b/i, "rabbitmq"],
  [/\bsqlite\b/i, "sqlite"],
  [/\bcassandra\b/i, "apachecassandra"],
  [/\breact\b/i, "react"],
  [/\bvue(\.?js)?\b/i, "vuedotjs"],
  [/\bangular\b/i, "angular"],
  [/\bnext(\.?js)?\b/i, "nextdotjs"],
  [/\bnuxt(\.?js)?\b/i, "nuxtdotjs"],
  [/\bsvelte\b/i, "svelte"],
  [/\bnode(\.?js)?\b/i, "nodedotjs"],
  [/\bexpress(\.?js)?\b/i, "express"],
  [/\bfastapi\b/i, "fastapi"],
  [/\bdjango\b/i, "django"],
  [/\brails\b/i, "rubyonrails"],
  [/\blaravel\b/i, "laravel"],
  [/\bspring\b/i, "spring"],
  [/\bflask\b/i, "flask"],
  [/\bdocker\b/i, "docker"],
  [/\bkubernetes\b|k8s/i, "kubernetes"],
  [/\bnginx\b/i, "nginx"],
  [/\bterraform\b/i, "terraform"],
  [/\bansible\b/i, "ansible"],
  [/\bgrafana\b/i, "grafana"],
  [/\bprometheus\b/i, "prometheus"],
  [/\bdatadog\b/i, "datadog"],
  [/\bdynamo(db)?\b/i, "amazondynamodb"],
  [/\bgcp\b|google cloud/i, "googlecloud"],
  [/\bbigquery\b/i, "googlebigquery"],
  [/\bfirebase\b/i, "firebase"],
  [/\bazure\b/i, "microsoftazure"],
  [/\bvercel\b/i, "vercel"],
  [/\bnetlify\b/i, "netlify"],
  [/\bheroku\b/i, "heroku"],
  [/\bsupabase\b/i, "supabase"],
  [/\bgithub\b/i, "github"],
  [/\bgitlab\b/i, "gitlab"],
  [/\bjenkins\b/i, "jenkins"],
  [/\bstripe\b/i, "stripe"],
  [/\btwilio\b/i, "twilio"],
  [/\bsendgrid\b/i, "sendgrid"],
  [/\bgraphql\b/i, "graphql"],
  [/\bgrpc\b/i, "grpc"],
];

/** Infer a Simple Icons slug from a node/group label. Returns null if no match. */
export function inferSlugFromLabel(label: string): string | null {
  for (const [pattern, slug] of LABEL_KEYWORDS) {
    if (pattern.test(label)) return slug;
  }
  return null;
}

export function iconFileId(slug: string, colorHex: string): string {
  return `simpleicon-${slug}-${colorHex.replace("#", "")}`;
}

export interface IconRequest {
  slug: string; // normalized Simple Icons slug
  colorHex: string; // stroke color hex e.g. "#1971c2"
}

// In-memory cache: fileId → BinaryFileData (process-lifetime)
const cache = new Map<string, BinaryFileData>();

export async function fetchIcons(
  requests: IconRequest[],
): Promise<BinaryFileData[]> {
  // Deduplicate by fileId
  const seen = new Map<string, IconRequest>();
  for (const r of requests) {
    const id = iconFileId(r.slug, r.colorHex);
    if (!seen.has(id)) seen.set(id, r);
  }

  const results: BinaryFileData[] = [];

  await Promise.all(
    [...seen.entries()].map(async ([fileId, { slug, colorHex }]) => {
      if (cache.has(fileId)) {
        results.push(cache.get(fileId)!);
        return;
      }

      try {
        const color = colorHex.replace("#", "");
        const res = await fetch(
          `https://cdn.simpleicons.org/${slug}/${color}`,
          {
            next: { revalidate: 86400 },
          } as RequestInit,
        );
        if (!res.ok) return;

        const svgText = await res.text();
        const dataURL = `data:image/svg+xml;base64,${Buffer.from(svgText).toString("base64")}`;
        const file: BinaryFileData = {
          id: fileId,
          mimeType: "image/svg+xml",
          dataURL,
          created: Date.now(),
        };
        cache.set(fileId, file);
        results.push(file);
      } catch {
        // Network error or bad slug — skip silently
      }
    }),
  );

  return results;
}
