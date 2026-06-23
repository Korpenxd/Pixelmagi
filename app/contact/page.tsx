import type { Metadata } from 'next'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ContactSection from '@/components/ContactSection'

export const metadata: Metadata = {
  title: 'Kontakt',
  description:
    'Kontakta Britt-Marie Ström på Pixelmagi för bokning eller frågor om fotografering i Alingsås och Västsverige.',
  alternates: {
    canonical: '/contact',
  },
}

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <main className="pageTop">
        <ContactSection />
      </main>

      <Footer />
    </>
  )
}
