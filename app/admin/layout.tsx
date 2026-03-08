'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    // Don't show sidebar on the login page
    if (pathname === '/admin') {
        return <div className="min-h-screen bg-[#FDFBF7]">{children}</div>
    }

    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' })
        router.push('/admin')
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-[#EBE8DE] flex flex-col no-print">
                <div className="h-16 flex items-center px-6 border-b border-[#EBE8DE]">
                    <div className="font-bold text-lg tracking-tight text-[#1F1F1D] group flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[#D97757] text-white flex items-center justify-center text-xs">▲</span>
                        HackGen
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1">
                    <Link href="/admin/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === '/admin/dashboard' || pathname.startsWith('/admin/events') ? 'bg-[#F3F0E6] text-[#1F1F1D]' : 'text-[#5C5C59] hover:text-[#1F1F1D] hover:bg-[#FDFBF7]'}`}>
                        <LayoutDashboard className="w-4 h-4" />
                        Events
                    </Link>
                </nav>

                <div className="p-4 border-t border-[#EBE8DE] space-y-1">
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-[#5C5C59] hover:text-[#1F1F1D] hover:bg-[#FDFBF7] w-full transition-colors dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-[#5C5C59] hover:text-[#1F1F1D] hover:bg-[#FDFBF7] w-full transition-colors dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden text-[#1F1F1D] font-serif">
                {children}
            </main>
        </div>
    )
}
