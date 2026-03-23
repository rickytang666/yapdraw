'use client'

import { redirect } from 'next/navigation'

export default function LibrariesRedirectPage() {
  // legacy path → /library
  redirect('/library')
}
