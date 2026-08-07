import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import PageHeader from '@/components/PageHeader'
import { getServices, type Service } from '@/lib/supabase'
import styles from './services.module.css'

export const metadata: Metadata = {
  title: 'Tjänster',
  description:
    'Bröllopsfotografering, baby- och barnfotografering samt porträttfotografering i Alingsås och Västsverige.',
  alternates: {
    canonical: '/services',
  },
}

export const dynamic = 'force-dynamic'

const fallbackServices: Service[] = [
  {
    id: 'fallback-wedding',
    image_path: '/demo/bouquet.webp',
    image_url: '/demo/bouquet.webp',
    title: 'Bröllopsfotografering',
    description:
      'Från förberedelser till fest – jag fångar er kärlek och alla viktiga ögonblick på ett naturligt och personligt sätt.',
    price: 'Paket från 12 900 kr',
    button_label: 'Boka eller fråga',
    sort_order: 0,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-baby',
    image_path: '/demo/baby-service.webp',
    image_url: '/demo/baby-service.webp',
    title: 'Baby & barnfotografering',
    description:
      'Naturliga och lekfulla bilder som speglar barnets personlighet och familjens närhet.',
    price: 'Session från 2 900 kr',
    button_label: 'Boka eller fråga',
    sort_order: 1,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'fallback-portrait',
    image_path: '/demo/portrait-service.webp',
    image_url: '/demo/portrait-service.webp',
    title: 'Porträttfotografering',
    description:
      'Porträtt för dig själv, familjen eller företaget. Fotograferingen kan ske utomhus eller i studio.',
    price: 'Session från 2 500 kr',
    button_label: 'Boka eller fråga',
    sort_order: 2,
    created_at: '',
    updated_at: '',
  },
]

export default async function ServicesPage() {
  const storedServices = await getServices()
  const services = storedServices.length > 0 ? storedServices : fallbackServices

  return (
    <>
      <Navbar />
      <main className={`pageTop section ${styles.main}`}>
        <PageHeader
          title="Tjänster"
          eyebrow="Fotograferingar"
          intro="Jag fotograferar olika typer av tillfällen och anpassar upplägget efter dina önskemål."
        />

        <div className={styles.grid}>
          {services.map((service) => (
            <article className={styles.card} key={service.id}>
              <Image
                className={styles.image}
                src={service.image_url}
                alt={service.title}
                width={700}
                height={520}
                sizes="(max-width: 560px) 100vw, (max-width: 820px) 50vw, 33vw"
                style={{
                  width: '100%',
                  height: 'auto',
                }}
              />
              <div className={styles.copy}>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <div className={styles.price}>{service.price}</div>
                <Link href="/contact" className={styles.link}>
                  {service.button_label} →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.action}>
          <Link href="/contact" className="button">
            Kontakta mig för bokning
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
