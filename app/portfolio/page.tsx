import type { Metadata } from 'next'

import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import PageHeader from '@/components/PageHeader'
import PortfolioClient from '@/components/PortfolioClient'
import { getCategories, getPhotos } from '@/lib/supabase'
import styles from './portfolio.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Portfolio',
  description:
    'Bröllop, baby, barn, porträtt och andra fotografier av Britt-Marie Ström.',
  alternates: {
    canonical: '/portfolio',
  },
}

export default async function PortfolioPage() {
  const [photos, categories] = await Promise.all([getPhotos(), getCategories()])

  return (
    <>
      <Navbar />
      <main className={`pageTop section ${styles.main}`}>
        <PageHeader title="Portfolio" eyebrow="Utvalda bilder" />
        <PortfolioClient photos={photos} categories={categories} />
      </main>
      <Footer />
    </>
  )
}
