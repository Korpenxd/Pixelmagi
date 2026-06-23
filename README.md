# Pixelmagi

A production-ready photography portfolio for Britt-Marie Ström in Alingsås. The site is built with Next.js, TypeScript and Supabase and includes a protected admin dashboard for gallery uploads, categories and the homepage hero image.

## What is included

- Responsive homepage, portfolio, services and contact pages
- Full-screen animated mobile navigation
- Reusable hollow branch ornament across page headings and footer
- Supabase-backed photos, categories and hero image
- Local demo images when Supabase is not configured
- Protected admin dashboard with image compression, bulk deletion and metadata editing
- SEO metadata, Open Graph image, sitemap, robots rules and structured data
- CSS Modules colocated with pages and components
- Accessible labels, keyboard focus states and reduced-motion support

## Project structure

```text
app/
  globals.css                 Global reset, design tokens and small utilities only
  home.module.css             Homepage-only styles
  portfolio/                  Portfolio page and local styles
  services/                   Services page and local styles
components/
  Component.tsx
  Component.module.css        Styles live beside the component
lib/                          Site configuration, Supabase and server helpers
docs/SUPABASE_SETUP.sql       Database, RLS, storage and RPC setup
public/demo/                  Local placeholder photographs
```

## Local setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local`.
3. Fill in the Supabase and admin values.
4. Run the SQL in `docs/SUPABASE_SETUP.sql` in the Supabase SQL editor.
5. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The admin dashboard is available at `/admin`.

## Environment variables

| Variable                            | Purpose                                               |
| ----------------------------------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`              | Canonical production URL                              |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase project URL                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Public Supabase key                                   |
| `SUPABASE_SERVICE_ROLE_KEY`         | Server-only admin key; never expose it in client code |
| `ADMIN_PASSWORD`                    | Password used on `/admin`                             |
| `ADMIN_SESSION_TOKEN`               | Long random value stored in the secure admin cookie   |
| `NEXT_PUBLIC_CONTACT_FORM_ENDPOINT` | Optional external form endpoint                       |

Generate a session token with:

```bash
openssl rand -hex 32
```

## Contact form behavior

When `NEXT_PUBLIC_CONTACT_FORM_ENDPOINT` is configured, the form posts to that endpoint. When it is empty, the form opens the visitor's email application with a prefilled message. This avoids displaying a false success message when no form backend exists.

## Useful commands

```bash
npm run dev           # Development server
npm run lint          # ESLint
npm run typecheck     # TypeScript validation
npm run format        # Format the project with Prettier
npm run format:check  # Check formatting
npm run build         # Production build
npm start             # Run the production build
```

## Before launch

- Replace the demo photographs in `public/demo` with approved images.
- Update contact details and social links in `lib/site.ts`.
- Replace the placeholder Instagram and Facebook URLs.
- Configure the contact form endpoint or verify the email fallback.
- Keep `.env.local` out of Git and never expose the service-role key.
