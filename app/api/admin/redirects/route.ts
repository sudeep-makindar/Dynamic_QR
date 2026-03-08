import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/admin/redirects — Create a new redirect rule
export async function POST(request: NextRequest) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { table_id, destination_url, label, start_time, end_time, is_default } = body

    if (!table_id || !destination_url) {
        return NextResponse.json({ error: 'table_id and destination_url are required' }, { status: 400 })
    }

    const db = supabaseAdmin()

    const { data, error } = await db
        .from('qr_redirects')
        .insert({
            table_id,
            destination_url,
            label: label || '',
            start_time,
            end_time,
            is_default: is_default || false,
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ redirect: data }, { status: 201 })
}
