import { redirect, notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

interface Props {
    params: Promise<{ eventSlug: string; tableNumber: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TableRedirectPage({ params }: Props) {
    const { eventSlug, tableNumber } = await params
    const tableNum = parseInt(tableNumber, 10)

    if (isNaN(tableNum) || tableNum < 1) {
        notFound()
    }

    const db = supabaseAdmin()
    const now = new Date().toISOString()

    // Get event by slug
    const { data: event, error: eventError } = await db
        .from('events')
        .select('id, name')
        .eq('slug', eventSlug)
        .single()

    if (eventError || !event) {
        notFound()
    }

    // Fetch the table record for this event
    const { data: table, error: tableError } = await db
        .from('qr_tables')
        .select('id, table_number, label')
        .eq('event_id', event.id)
        .eq('table_number', tableNum)
        .single()

    if (tableError || !table) {
        notFound()
    }

    // Find active redirect based on current time
    const { data: activeRedirect } = await db
        .from('qr_redirects')
        .select('destination_url, label')
        .eq('table_id', table.id)
        .lte('start_time', now)
        .gte('end_time', now)
        .order('start_time', { ascending: false })
        .limit(1)
        .single()

    if (activeRedirect) {
        redirect(activeRedirect.destination_url)
    }

    // Check default redirect
    const { data: defaultRedirect } = await db
        .from('qr_redirects')
        .select('destination_url, label')
        .eq('table_id', table.id)
        .eq('is_default', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (defaultRedirect) {
        redirect(defaultRedirect.destination_url)
    }

    // Fallback UI
    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-900">
            <div className="max-w-sm w-full text-center space-y-6">
                <div className="text-6xl text-gray-400">⏳</div>
                <div className="space-y-3">
                    <div className="text-sm font-semibold tracking-wider text-gray-500 uppercase">{event.name}</div>
                    <h1 className="text-2xl font-bold">
                        {table.label || `Table ${tableNum}`}
                    </h1>
                    <p className="text-gray-600">
                        No active destination is configured right now.
                    </p>
                    <p className="text-gray-400 text-sm">
                        Please check back later or ask an organizer for help.
                    </p>
                </div>
            </div>
        </main>
    )
}
