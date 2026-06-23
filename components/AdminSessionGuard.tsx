'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const INACTIVITY_LIMIT = 30 * 60 * 1000

function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export default function AdminSessionGuard() {
  const pathname = usePathname()
  const router = useRouter()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    const previousPath = previousPathname.current
    const leftAdmin = isAdminPath(previousPath) && !isAdminPath(pathname)

    previousPathname.current = pathname

    if (!leftAdmin) return

    async function logoutAfterLeavingAdmin() {
      try {
        const response = await fetch('/api/admin/logout', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
        })

        if (!response.ok) {
          console.error('Automatic logout failed:', response.status)
          return
        }

        // Clear cached Server Component data that may still
        // represent the previous authenticated session.
        router.refresh()
      } catch (error) {
        console.error('Automatic logout failed:', error)
      }
    }

    void logoutAfterLeavingAdmin()
  }, [pathname, router])

  useEffect(() => {
    if (!isAdminPath(pathname)) return

    let timeoutId: number | undefined

    async function logoutFromInactivity() {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
        })
      } finally {
        window.location.replace('/admin')
      }
    }

    function resetTimer() {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }

      timeoutId = window.setTimeout(() => {
        void logoutFromInactivity()
      }, INACTIVITY_LIMIT)
    }

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ]

    events.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, {
        passive: true,
      })
    })

    resetTimer()

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }

      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer)
      })
    }
  }, [pathname])

  return null
}
