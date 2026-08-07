import type { NextConfig } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseHostname = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : undefined

const isDev = process.env.NODE_ENV === 'development'

/*
 * Content Security Policy
 *
 * Allows:
 * - resources from Pixelmagi itself
 * - Supabase images and API requests
 * - blob/data images used for previews
 * - inline styles/scripts required by the current Next.js setup
 *
 * unsafe-eval is only allowed during local development.
 */
const contentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:${supabaseHostname ? ` https://${supabaseHostname}` : ''};
  font-src 'self' data:;
  connect-src 'self'${
    supabaseHostname
      ? ` https://${supabaseHostname} wss://${supabaseHostname}`
      : ''
  };
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`.replace(/\s{2,}/g, ' ').trim()

const securityHeaders = [
  {
    /*
     * While testing, use:
     * Content-Security-Policy-Report-Only
     *
     * Once everything works, change it to:
     * Content-Security-Policy
     */
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
    qualities: [75, 85],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
