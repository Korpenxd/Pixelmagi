import type { Metadata } from 'next'
import {
  Allura,
  Cormorant_Garamond,
  Montserrat,
} from 'next/font/google'

import './globals.css'

const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const sansFont = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

const scriptFont = Allura({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-script',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pixelmagi — Britt-Marie Ström',
  description:
    'Fotograf i Alingsås med fokus på bröllop, porträtt och familjefotografering.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="sv"
      className={`${displayFont.variable} ${sansFont.variable} ${scriptFont.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>{children}</body>
    </html>
  )
}
