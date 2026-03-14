export async function GET() {
  const key = process.env.DEEPGRAM_API_KEY
  if (!key) {
    return Response.json({ error: 'DEEPGRAM_API_KEY not set' }, { status: 500 })
  }
  return Response.json({ key })
}
