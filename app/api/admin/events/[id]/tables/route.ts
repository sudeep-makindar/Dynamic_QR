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

    const { data, error } = await db
        .from('qr_tables')
        .select(`
      id,
      event_id,
      table_number,
      label,
      created_at,
      qr_redirects (
        id,
        table_id,
        destination_url,
        label,
        start_time,
        end_time,
        is_default,
        created_at,
        updated_at
      )
    `)
        .eq('event_id', id)
        .order('table_number', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const tables = (data || []).map(t => ({
        ...t,
        qr_redirects: (t.qr_redirects || []).sort(
            (a: { start_time: string }, b: { start_time: string }) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        ),
    }))

    return NextResponse.json({ tables })
}
