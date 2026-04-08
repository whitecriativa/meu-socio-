import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google-calendar'
import { getAuthenticatedUserId } from '@/lib/get-user-id'

export async function GET(_req: NextRequest) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? ''))

  const url = getAuthUrl(userId)
  return NextResponse.redirect(url)
}
