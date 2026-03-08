import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface Props {
    params: Promise<{ id: string }>
}

// PUT /api/admin/redirects/[id] — Update redirect rule
export async function PUT(request: NextRequest, { params }: Props) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { destination_url, label, start_time, end_time, is_default } = body

    if (!destination_url) {
        return NextResponse.json({ error: 'destination_url is required' }, { status: 400 })
    }

    const db = supabaseAdmin()

    const { data, error } = await db
        .from('qr_redirects')
        .update({
            destination_url,
            label: label || '',
            start_time,
            end_time,
            is_default: is_default || false,
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ redirect: data })
}

// DELETE /api/admin/redirects/[id] — Delete redirect rule
export async function DELETE(request: NextRequest, { params }: Props) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = supabaseAdmin()

    const { error } = await db
        .from('qr_redirects')
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
