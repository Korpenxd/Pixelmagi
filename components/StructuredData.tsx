import { siteConfig } from '@/lib/site'

type StructuredDataProps = {
  siteUrl: string
}

export default function StructuredData({ siteUrl }: StructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: siteConfig.name,
    url: siteUrl,
    founder: siteConfig.photographer,
    email: siteConfig.email,
    telephone: siteConfig.phoneHref,
    areaServed: siteConfig.location,
    description: siteConfig.description,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
