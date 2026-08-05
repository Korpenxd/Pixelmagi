import Link from 'next/link'

import BranchOrnament from '@/components/BranchOrnament'
import { siteConfig } from '@/lib/site'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.main}>
        <div className={styles.brand}>
          <Link
            href="/"
            className={styles.brandLink}
            aria-label="Pixelmagi – gå till startsidan"
          >
            <span className={styles.brandMain}>PIXELMAGI</span>
            <span className={styles.brandSub}>BRITT-MARIE STRÖM</span>
            <BranchOrnament className={styles.branch} />
          </Link>
        </div>

        <div className={styles.contactGrid}>
          <a
            className={styles.contactItem}
            href={siteConfig.mapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s6-5.4 6-12a6 6 0 1 0-12 0c0 6.6 6 12 6 12Z" />
              <circle cx="12" cy="9" r="2.2" />
            </svg>
            <span>{siteConfig.location}</span>
          </a>

          <a className={styles.contactItem} href={`mailto:${siteConfig.email}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="1.5" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            <span>{siteConfig.email}</span>
          </a>

          <a className={styles.contactItem} href={`tel:${siteConfig.phoneHref}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.5 3.5 9 8l-2 2c1.3 2.7 3.3 4.7 6 6l2-2 4.5 2.5c.5.3.7.8.5 1.3-.5 1.5-1.9 3.2-4.2 3.2C9.2 21 3 14.8 3 7.2 3 4.9 4.7 3.5 6.2 3c.5-.2 1 .1 1.3.5Z" />
            </svg>
            <span>{siteConfig.phoneDisplay}</span>
          </a>
        </div>

        <nav className={styles.links} aria-label="Sidfotsnavigering">
          <Link className={styles.link} href="/">
            Hem
          </Link>
          <Link className={styles.link} href="/portfolio">
            Portfolio
          </Link>
          <Link className={styles.link} href="/services">
            Tjänster
          </Link>
          <Link className={styles.link} href="/#om-mig">
            Om mig
          </Link>
          <Link className={styles.link} href="/contact">
            Kontakt
          </Link>
        </nav>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} Pixelmagi – Britt-Marie Ström</span>
        <span>
          Site by {" "}
            <a
            className={styles.credit}
            href="https://www.birdbrain.it"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Birdbrain – webbyrå i Alingsås"
            >
            Birdbrain IT
            </a>
        </span>
      </div>
    </footer>
  )
}
