'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { siteConfig } from '@/lib/site'
import styles from './Navbar.module.css'

const navigation = [
  { href: '/', label: 'Hem' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/services', label: 'Tjänster' },
  { href: '/#om-mig', label: 'Om mig' },
  { href: '/contact', label: 'Kontakt' },
]

function SocialLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      className={mobile ? styles.mobileSocials : styles.socials}
      aria-label="Sociala medier"
    >
      <a
        className={styles.socialLink}
        href={siteConfig.instagramUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Instagram"
      >
        <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle className={styles.socialDot} cx="17.4" cy="6.6" r="1" />
        </svg>
      </a>

      <a
        className={styles.socialLink}
        href={siteConfig.facebookUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Facebook"
      >
        <svg
          className={`${styles.socialIcon} ${styles.facebookIcon}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M14 21v-8h3l.5-3H14V8.2c0-.9.3-1.7 1.8-1.7H18V3.8c-.6-.1-1.5-.3-2.7-.3-2.7 0-4.6 1.7-4.6 4.7V10H8v3h2.7v8H14Z" />
        </svg>
      </a>
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-open', open)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    const handleResize = () => {
      if (window.innerWidth > 820) setOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)

    return () => {
      document.body.classList.remove('menu-open')
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [open])

  const heroMode = pathname === '/' && !scrolled && !open

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    if (href.includes('#')) return false
    return pathname === href
  }

  return (
    <nav
      className={[
        styles.navbar,
        heroMode ? styles.heroMode : '',
        open ? styles.menuOpen : '',
      ].join(' ')}
      aria-label="Huvudnavigering"
    >
      <Link
        href="/"
        className={styles.brand}
        aria-label="Pixelmagi – gå till startsidan"
        onClick={() => setOpen(false)}
      >
        <span className={styles.brandMain}>PIXELMAGI</span>
        <span
          className={styles.brandSub}
          aria-label="Britt-Marie Ström"
        >
          {'BRITT-MARIE STRÖM'.split('').map(
            (character, index) =>
              character === ' ' ? (
                <span
                  key={`space-${index}`}
                  className={styles.brandSpace}
                  aria-hidden="true"
                />
              ) : (
                <span
                  key={`${character}-${index}`}
                  aria-hidden="true"
                >
                  {character}
                </span>
              ),
          )}
        </span>
      </Link>

      <div
        id="main-navigation"
        className={`${styles.links} ${open ? styles.linksOpen : ''}`}
      >
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.link} ${isActive(item.href) ? styles.active : ''}`}
            aria-current={isActive(item.href) ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <SocialLinks mobile />
      </div>

      <div className={styles.actions}>
        <SocialLinks />
        <button
          type="button"
          className={`${styles.menuButton} ${open ? styles.buttonOpen : ''}`}
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? 'Stäng meny' : 'Öppna meny'}
          aria-expanded={open}
          aria-controls="main-navigation"
        >
          <span className={styles.menuIcon} aria-hidden="true">
            <span className={styles.menuLine} />
            <span className={styles.menuLine} />
            <span className={styles.menuLine} />
          </span>
        </button>
      </div>
    </nav>
  )
}
