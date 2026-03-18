export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY
  const projectId = process.env.DEEPGRAM_PROJECT_ID
  if (!apiKey) return Response.json({ error: 'DEEPGRAM_API_KEY not set' }, { status: 500 })
  if (!projectId) return Response.json({ error: 'DEEPGRAM_PROJECT_ID not set' }, { status: 500 })

  const res = await fetch(`https://api.deepgram.com/v1/projects/${projectId}/keys`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comment: 'tmp',
      scopes: ['usage:write'],
      time_to_live_in_seconds: 10,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return Response.json({ error: `deepgram key creation failed: ${text}` }, { status: 502 })
  }

  const { key } = await res.json()
  return Response.json({ key })
}
