import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import Footer from '@/components/Footer'
import HeartIcon from '@/components/HeartIcon'
import Hero from '@/components/Hero'
import Navbar from '@/components/Navbar'
import PortraitIcon from '@/components/PortraitIcon'
import StructuredData from '@/components/StructuredData'
import WeddingRingsIcon from '@/components/WeddingRingsIcon'
import { getHeroImageUrl } from '@/lib/supabase'
import styles from './home.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Fotograf i Alingsås',
  description:
    'Pixelmagi – Britt-Marie Ström fotograferar bröllop, baby, barn och porträtt i Alingsås och Västsverige.',
  alternates: {
    canonical: '/',
  },
}

const specialties = [
  {
    title: 'Bröllop',
    description: 'Jag fångar er dag med värme, känsla och naturliga ögonblick.',
    icon: <WeddingRingsIcon />,
  },
  {
    title: 'Baby & barn',
    description: 'Små stunder blir stora minnen. Avslappnat, mjukt och fullt av liv.',
    icon: <HeartIcon />,
  },
  {
    title: 'Porträtt',
    description: 'Porträtt som speglar dig – naturligt, personligt och vackert.',
    icon: <PortraitIcon />,
  },
]

export default async function Home() {
  const heroImageUrl = await getHeroImageUrl()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixelmagi.se'

  return (
    <>
      <StructuredData siteUrl={siteUrl} />
      <Navbar />

      <main>
        <Hero imageUrl={heroImageUrl} />

        <section className={styles.specialties} aria-label="Fotograferingstjänster">
          {specialties.map((specialty) => (
            <article className={styles.specialty} key={specialty.title}>
              <div className={styles.icon} aria-hidden="true">
                {specialty.icon}
              </div>
              <h2>{specialty.title}</h2>
              <p>{specialty.description}</p>
              <Link className={styles.textLink} href="/services">
                Se mer →
              </Link>
            </article>
          ))}
        </section>

        <section id="om-mig" className={styles.about}>
          <Image
            className={styles.aboutImage}
            src="/demo/about-me.webp"
            alt="Britt-Marie Ström med kamera"
            width={900}
            height={900}
            sizes="(max-width: 700px) 100vw, 55vw"
          />

          <div className={styles.aboutCopy}>
            <p className="eyebrow">Om mig</p>
            <h2 className="display">
              Hej, jag heter
              <br />
              Britt-Marie!
            </h2>
            <p>
              Jag är fotograf med hjärtat i Alingsås och kameran i handen så fort livet
              visar något vackert. Mitt mål är att du ska känna dig trygg, sedd och
              avslappnad – och få bilder som du kommer älska i många år framöver.
            </p>
            <Link href="/contact" className={`button ${styles.aboutButton}`}>
              Boka ett samtal
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
