import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = supabaseAdmin()

    const { data, error } = await db
        .from('qr_tables')
        .select(`
      id,
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
        .order('table_number', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort redirects by start_time within each table
    const tables = (data || []).map(t => ({
        ...t,
        qr_redirects: (t.qr_redirects || []).sort(
            (a: { start_time: string }, b: { start_time: string }) =>
                new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        ),
    }))

    return NextResponse.json({ tables })
}
