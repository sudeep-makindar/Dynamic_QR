'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        })

        if (res.ok) {
            router.push('/admin/dashboard')
        } else {
            const data = await res.json()
            setError(data.error || 'Invalid password')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFBF7]">
            <div className="w-full max-w-sm">
                <div className="bg-white border text-[#1F1F1D] border-[#EBE8DE] rounded-xl shadow-sm overflow-hidden">
                    <div className="p-8 pb-6 border-b border-[#EBE8DE]">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded bg-[#D97757] text-white flex items-center justify-center text-xs font-bold. font-mono">▲</span>
                            <h1 className="text-xl font-bold tracking-tight font-serif">HackGen Admin</h1>
                        </div>
                        <p className="text-[#5C5C59] text-sm">Sign in with organizer password to continue.</p>
                    </div>

                    <form onSubmit={handleLogin} className="p-8 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-[#1F1F1D] mb-2">
                                Secure Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-white border border-[#EBE8DE] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent transition-all"
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#D97757] hover:bg-[#C26547] disabled:opacity-50 text-white font-medium rounded-md px-4 py-2 text-sm transition-all"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>
                </div>
                <div className="text-center text-[#5C5C59] text-xs mt-6 font-medium tracking-wide">
                    SYSTEM ACCESS SECURED
                </div>
            </div>
        </div>
    )
}
