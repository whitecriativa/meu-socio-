import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/recuperar-senha') ||
    pathname.startsWith('/nova-senha') ||
    pathname.startsWith('/agendar')

  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  )

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasSession && (pathname === '/login' || pathname === '/cadastro')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
