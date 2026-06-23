# Project review and refactor summary

## Main fixes

- Replaced the 1,700-line global stylesheet with small CSS Modules beside each page and component.
- Kept `app/globals.css` limited to design tokens, resets and shared utility classes.
- Corrected broken internal links and canonical URLs (`/contact` and `/services`).
- Fixed responsive layout conflicts caused by misplaced media-query braces and duplicate selectors.
- Rebuilt the navbar styles, full-screen mobile menu and animated hamburger in a self-contained component module.
- Kept the logo and hero content aligned through the shared `--site-gutter` token.
- Standardized page headings with a reusable `PageHeader` and branch ornament.
- Made service cards and homepage specialty cards equal height with bottom-aligned calls to action.
- Restored the desktop About section to a two-column layout and kept the mobile stack intentional.
- Restyled portfolio category filters and added a clear empty state.
- Made the contact textarea grow and shrink automatically without a manual resize handle.
- Removed the contact form's false success behavior. It now uses an optional form endpoint or opens a prefilled email.
- Centralized contact details and social links in `lib/site.ts`.
- Made public Supabase reads degrade safely to demo content when environment variables are missing.
- Changed the Supabase service-role client to initialize lazily on the server.
- Added timing-safe comparisons for admin password and session-token checks.
- Removed unused legacy components and hooks.
- Added Prettier, EditorConfig and VS Code workspace formatting settings.
- Added a complete Supabase schema, RLS, storage and usage-RPC setup script.

## Validation completed

- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- `npm run build`
- HTTP smoke checks for `/`, `/portfolio`, `/services`, `/contact`, `/showcase` and `/admin`

## Items to configure before production

- Replace placeholder phone number and social URLs in `lib/site.ts`.
- Add real values to `.env.local` based on `.env.example`.
- Configure `NEXT_PUBLIC_CONTACT_FORM_ENDPOINT` or keep the email-client fallback.
- Replace demo images with approved photography.
