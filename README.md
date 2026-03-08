# Dynamic QR Redirection System for Hackathons

A dynamic QR code redirection system built with Next.js and Supabase for managing physical tables at Hackathons.

## Features
- **Dynamic Routing**: Print a QR code once and change its destination URL dynamically via an admin dashboard.
- **Time-based Rules**: Schedule redirects for specific times during the event (e.g. Lunch menu at 12 PM, sub-event link at 3 PM).
- **Multi-Event Support**: Manage multiple distinctive hackathons from a single dashboard.
- **Bulk Operations**: Apply URLs to all tables or specific chunks of tables simultaneously.
- **Print-ready PDF Generation**: Generate perfectly spaced A4 PDFs containing the event name, QR matrix, and table labels, ready to be printed and folded into table tents.

## Tech Stack
- Frontend: Next.js (App Router), Tailwind CSS
- Backend: Next.js API Routes, Supabase (Postgres)
- Auth: Custom JWT-protected paths + Supabase RLS
- Utilities: lucide-react (icons), qrcode & jsPDF (PDF export)

## Deployment Readiness
This build is designated as `v0` and implements the core foundation. 

*Note: Ensure `.env.local` contains `NEXTAUTH_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` prior to deployment.*
