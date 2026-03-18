'use client'

import { redirect } from 'next/navigation'

export default function LibrariesRedirectPage() {
  // Back-compat: redirect old /libraries route to the new canonical /library route.
  redirect('/library')
}
