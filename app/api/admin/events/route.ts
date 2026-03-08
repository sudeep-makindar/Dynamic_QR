import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = supabaseAdmin()

    const { data: events, error } = await db
        .from('events')
        .select(`
      id,
      name,
      slug,
      created_at,
      qr_tables (count)
    `)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format the count properly
    const formattedEvents = events.map((e: any) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        created_at: e.created_at,
        table_count: e.qr_tables[0]?.count || 0
    }))

    return NextResponse.json({ events: formattedEvents })
}

export async function POST(request: NextRequest) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, table_count } = await request.json()

    if (!name || !table_count || table_count < 1) {
        return NextResponse.json({ error: 'Invalid name or table count' }, { status: 400 })
    }

    const db = supabaseAdmin()

    // Generate a URL-friendly slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000)

    // 1. Create the event
    const { data: event, error: eventError } = await db
        .from('events')
        .insert({ name, slug })
        .select()
        .single()

    if (eventError || !event) {
        return NextResponse.json({ error: eventError?.message || 'Failed to create event' }, { status: 500 })
    }

    // 2. Generate the tables for this event
    const tablesToInsert = Array.from({ length: table_count }).map((_, i) => ({
        event_id: event.id,
        table_number: i + 1,
        label: `Table ${i + 1}`,
    }))

    const { error: tablesError } = await db
        .from('qr_tables')
        .insert(tablesToInsert)

    if (tablesError) {
        // If table creation fails, delete the event to rollback (dirty rollback)
        await db.from('events').delete().eq('id', event.id)
        return NextResponse.json({ error: tablesError.message }, { status: 500 })
    }

    return NextResponse.json({ event })
}
