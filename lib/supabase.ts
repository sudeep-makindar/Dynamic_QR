import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client for browser usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client (uses service role key, bypasses RLS)
export const supabaseAdmin = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

export type Event = {
    id: string
    name: string
    slug: string
    created_at: string
}

export type QrTable = {
    id: string
    event_id: string
    table_number: number
    label: string
    created_at: string
}

export type QrRedirect = {
    id: string
    table_id: string
    destination_url: string
    label: string
    start_time: string
    end_time: string
    is_default: boolean
    created_at: string
    updated_at: string
}

export type QrTableWithRedirects = QrTable & {
    qr_redirects: QrRedirect[]
}
