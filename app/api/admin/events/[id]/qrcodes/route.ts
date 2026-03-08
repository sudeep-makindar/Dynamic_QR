import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import QRCode from 'qrcode'
import { supabaseAdmin } from '@/lib/supabase'

interface Props {
    params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { baseUrl, size = 600 } = await request.json()

    if (!baseUrl) {
        return NextResponse.json({ error: 'baseUrl is required' }, { status: 400 })
    }

    const db = supabaseAdmin()

    // 1. Get Event Slug
    const { data: event, error: eventError } = await db
        .from('events')
        .select('slug, name')
        .eq('id', id)
        .single()

    if (eventError || !event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // 2. Get Tables
    const { data: tables, error: tablesError } = await db
        .from('qr_tables')
        .select('table_number')
        .eq('event_id', id)
        .order('table_number', { ascending: true })

    if (tablesError || !tables) {
        return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
    }

    // 3. Generate High Res QRs
    const codes: { table: number; dataUrl: string }[] = []

    // Processing sequentially to avoid Vercel memory spike if table count is massive
    // but for <500 tables it's very fast locally.
    for (const t of tables) {
        const tableNum = t.table_number
        const url = `${baseUrl}/e/${event.slug}/${tableNum}`
        try {
            const dataUrl = await QRCode.toDataURL(url, {
                width: size,
                margin: 1, // Minimize margin for larger QR print area
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
                errorCorrectionLevel: 'H', // High error correction for printing
            })
            codes.push({ table: tableNum, dataUrl })
        } catch (e) {
            console.error(`Failed to generate QR for table ${tableNum}`, e)
        }
    }

    return NextResponse.json({ codes, eventName: event.name })
}
