import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface Props {
    params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { table_ids, destination_url, label, start_time, end_time, is_default } = await request.json()

    if (!table_ids || !Array.isArray(table_ids) || table_ids.length === 0 || !destination_url) {
        return NextResponse.json({ error: 'table_ids array and destination_url are required' }, { status: 400 })
    }

    const db = supabaseAdmin()

    const payloads = table_ids.map(table_id => ({
        table_id,
        destination_url,
        label: label || '',
        start_time: is_default ? null : start_time,
        end_time: is_default ? null : end_time,
        is_default: is_default || false,
    }))

    // FIX: "2 links at the same time" error
    // Delete any overlapping conflicting links or existing default links to prevent duplicate active URLs
    if (is_default) {
        await db.from('qr_redirects').delete().in('table_id', table_ids).eq('is_default', true)
    } else {
        await db.from('qr_redirects')
            .delete()
            .in('table_id', table_ids)
            .eq('is_default', false)
            .lte('start_time', end_time)
            .gte('end_time', start_time)
    }

    const { data, error } = await db
        .from('qr_redirects')
        .insert(payloads)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: table_ids.length })
}

export async function DELETE(request: NextRequest, { params }: Props) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { table_ids } = await request.json()

    if (!table_ids || !Array.isArray(table_ids) || table_ids.length === 0) {
        return NextResponse.json({ error: 'table_ids array is required' }, { status: 400 })
    }

    const db = supabaseAdmin()

    // Delete all redirects for the selected tables (bulk clear)
    const { error } = await db
        .from('qr_redirects')
        .delete()
        .in('table_id', table_ids)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: table_ids.length })
}
