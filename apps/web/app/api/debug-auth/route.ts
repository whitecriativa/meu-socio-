import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const authCookies = allCookies
    .filter((c) => c.name.startsWith('sb-'))
    .map((c) => ({ name: c.name, valuePreview: c.value.substring(0, 80) }))

  const userId = await getAuthenticatedUserId()

  return NextResponse.json({ userId, authCookies })
}
