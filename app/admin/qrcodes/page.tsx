'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function QRCodesPage() {
    const router = useRouter()
    const [baseUrl, setBaseUrl] = useState('')
    const [from, setFrom] = useState(1)
    const [to, setTo] = useState(50)
    const [cols, setCols] = useState(4)
    const [qrSize, setQrSize] = useState(180)
    const [loading, setLoading] = useState(false)
    const [generated, setGenerated] = useState(false)
    const [qrImages, setQrImages] = useState<{ table: number; dataUrl: string }[]>([])
    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const origin = window.location.origin
        setBaseUrl(origin)
    }, [])

    const generateQRCodes = async () => {
        if (from < 1 || to > 50 || from > to) return
        setLoading(true)
        setGenerated(false)

        const res = await fetch('/api/admin/qrcodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ baseUrl, from, to, size: qrSize }),
        })

        if (res.status === 401) { router.push('/admin'); return }

        if (res.ok) {
            const data = await res.json()
            setQrImages(data.codes)
            setGenerated(true)
        }
        setLoading(false)
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10 no-print">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/dashboard" className="text-gray-400 hover:text-white transition-colors">← Back</Link>
                        <div className="text-gray-700">|</div>
                        <div>
                            <h1 className="text-lg font-bold text-white">🔲 QR Code Generator</h1>
                            <p className="text-xs text-gray-500 hidden sm:block">Generate and print QR codes for all tables</p>
                        </div>
                    </div>
                    {generated && (
                        <button
                            onClick={handlePrint}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium"
                        >
                            🖨️ Print All
                        </button>
                    )}
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* Config Panel */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 no-print">
                    <h2 className="text-base font-semibold text-white mb-4">Configuration</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Base URL</label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">From Table</label>
                            <input
                                type="number"
                                min={1} max={50}
                                value={from}
                                onChange={(e) => setFrom(Number(e.target.value))}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">To Table</label>
                            <input
                                type="number"
                                min={1} max={50}
                                value={to}
                                onChange={(e) => setTo(Number(e.target.value))}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Columns (print)</label>
                            <select
                                value={cols}
                                onChange={(e) => setCols(Number(e.target.value))}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                            >
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                                <option value={5}>5</option>
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={generateQRCodes}
                        disabled={loading}
                        className="mt-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl px-6 py-3 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Generating...
                            </span>
                        ) : (
                            '⚡ Generate QR Codes'
                        )}
                    </button>
                </div>

                {/* QR Grid */}
                {generated && qrImages.length > 0 && (
                    <>
                        {/* Screen preview */}
                        <div className="no-print">
                            <h2 className="text-base font-semibold text-white mb-3">Preview — {qrImages.length} QR codes</h2>
                            <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(cols, 6)}, minmax(0, 1fr))` }}>
                                {qrImages.map(({ table, dataUrl }) => (
                                    <div key={table} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-violet-500/30 transition-colors">
                                        <img src={dataUrl} alt={`QR for Table ${table}`} className="w-full rounded-lg" />
                                        <div className="text-center">
                                            <div className="text-sm font-bold text-white">Table {table}</div>
                                            <div className="text-xs text-gray-500 font-mono truncate max-w-full">{baseUrl}/t/{table}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Print-only layout */}
                        <div ref={printRef} className="print-only hidden">
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px', padding: '24px' }}>
                                {qrImages.map(({ table, dataUrl }) => (
                                    <div key={table} style={{
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        textAlign: 'center',
                                        breakInside: 'avoid',
                                        background: '#fff',
                                    }}>
                                        <img src={dataUrl} alt={`QR for Table ${table}`} style={{ width: '100%', maxWidth: '200px' }} />
                                        <div style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '18px', color: '#111' }}>Table {table}</div>
                                        <div style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace', marginTop: '4px' }}>
                                            {baseUrl}/t/{table}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
        </div>
    )
}
