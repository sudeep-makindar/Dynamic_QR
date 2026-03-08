# QR Hackathon Redirect System

A dynamic QR code redirect system for hackathon events.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.local` and fill in your Supabase service role key:
   - Go to: https://supabase.com/dashboard/project/ghgmkocedknbtyjseyof/settings/api
   - Copy the `service_role` key
   - Paste into `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

3. **Run locally:**
   ```bash
   npm run dev
   ```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/t/[1-50]` | QR redirect (auto-redirects based on time) |
| `/admin` | Admin login |
| `/admin/dashboard` | Manage redirect rules |
| `/admin/qrcodes` | Generate & print QR codes |

## Admin Credentials

Default password: `hackathon2024`  
Change via `ADMIN_PASSWORD` env variable.

## Deploy on Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_BASE_URL` (your production domain)
