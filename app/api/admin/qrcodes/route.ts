import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { baseUrl, from, to, size = 200 } = await request.json()

    if (!baseUrl || from < 1 || to > 50 || from > to) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const codes: { table: number; dataUrl: string }[] = []

    for (let tableNum = from; tableNum <= to; tableNum++) {
        const url = `${baseUrl}/t/${tableNum}`
        const dataUrl = await QRCode.toDataURL(url, {
            width: size,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
            errorCorrectionLevel: 'M',
        })
        codes.push({ table: tableNum, dataUrl })
    }

    return NextResponse.json({ codes })
}
