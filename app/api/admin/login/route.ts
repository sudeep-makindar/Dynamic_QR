import { NextRequest, NextResponse } from 'next/server'
import { validateAdminPassword, setAdminSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
    const { password } = await request.json()

    const valid = await validateAdminPassword(password)
    if (!valid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    await setAdminSession()
    return NextResponse.json({ success: true })
}
