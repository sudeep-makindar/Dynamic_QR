import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const ADMIN_SESSION_COOKIE = 'qr_admin_session'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hackathon2024'

// Use a distinct secret for signing JWTs
const secretKey = process.env.NEXTAUTH_SECRET || 'super-secret-qr-hackathon-key-2024'
const key = new TextEncoder().encode(secretKey)

export async function validateAdminPassword(password: string): Promise<boolean> {
    return password === ADMIN_PASSWORD
}

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('12h')
        .sign(key)
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    })
    return payload
}

export async function setAdminSession(): Promise<void> {
    const cookieStore = await cookies()
    const expires = new Date(Date.now() + 12 * 60 * 60 * 1000)

    // Create an encrypted JWT storing the admin session
    const sessionToken = await encrypt({ role: 'admin', expires })

    cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expires,
        path: '/',
        sameSite: 'lax',
    })
}

export async function clearAdminSession(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_SESSION_COOKIE)
}

export async function isAdminAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies()
    const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

    if (!session) return false

    try {
        const parsed = await decrypt(session)
        return Boolean(parsed?.role === 'admin')
    } catch (error) {
        // Token is invalid or expired
        return false
    }
}
