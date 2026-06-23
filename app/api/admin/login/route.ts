import { NextResponse } from 'next/server'

import { safeCompare } from '@/lib/security'

type LoginBody = {
  password?: unknown
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody

    if (typeof body.password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const adminPassword = process.env.ADMIN_PASSWORD
    const sessionToken = process.env.ADMIN_SESSION_TOKEN

    if (!adminPassword || !sessionToken) {
      console.error('Admin environment variables are missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (!safeCompare(body.password, adminPassword)) {
      await new Promise((resolve) => setTimeout(resolve, 350))
      return NextResponse.json({ error: 'Fel lösenord' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set('pixelmagi-admin', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
