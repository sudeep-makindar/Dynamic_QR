import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

interface Props {
    params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = supabaseAdmin()

    const { data: event, error } = await db
        .from('events')
        .select(`*`)
        .eq('id', id)
        .single()

    if (error || !event) {
        return NextResponse.json({ error: error?.message || 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
}

export async function DELETE(request: NextRequest, { params }: Props) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const db = supabaseAdmin()

    // CASCADE will delete tables and redirects automatically
    const { error } = await db
        .from('events')
        .delete()
        .eq('id', id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
