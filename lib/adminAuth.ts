import 'server-only'

import { cookies } from 'next/headers'

import { safeCompare } from '@/lib/security'

export async function isAdminRequest(): Promise<boolean> {
  const expectedToken = process.env.ADMIN_SESSION_TOKEN

  if (!expectedToken) {
    console.error('ADMIN_SESSION_TOKEN is missing')
    return false
  }

  const cookieStore = await cookies()
  const providedToken = cookieStore.get('pixelmagi-admin')?.value

  return providedToken ? safeCompare(providedToken, expectedToken) : false
}
