import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.NEXTAUTH_SECRET || 'super-secret-qr-hackathon-key-2024'
const key = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Protect /admin routes (except login /admin)
    if (pathname.startsWith('/admin/dashboard') || pathname.startsWith('/admin/qrcodes') || pathname.startsWith('/admin/events')) {
        const sessionToken = request.cookies.get('qr_admin_session')?.value

        if (!sessionToken) {
            return NextResponse.redirect(new URL('/admin', request.url))
        }

        try {
            // Verify the JWT signature at the Edge (Middleware)
            await jwtVerify(sessionToken, key, {
                algorithms: ['HS256'],
            })
            // Valid token!
            return NextResponse.next()
        } catch (err) {
            // Invalid or tampered token
            return NextResponse.redirect(new URL('/admin', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/dashboard/:path*', '/admin/qrcodes/:path*', '/admin/events/:path*'],
}
