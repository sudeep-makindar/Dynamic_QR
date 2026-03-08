'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'

// Using dynamic import would be better for qrcode but standard import works in 'use client'
// Provide data url directly to img src
export default function QRCodesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [baseUrl, setBaseUrl] = useState('')

    const [event, setEvent] = useState<{ name: string, slug: string } | null>(null)
    const [tables, setTables] = useState<{ id: string, table_number: number }[]>([])
    const [loading, setLoading] = useState(true)

    const [qrImages, setQrImages] = useState<{ table: number; dataUrl: string }[]>([])
    const [cols, setCols] = useState(4) // Default 4xN for card template
    const [generating, setGenerating] = useState(false)
    const [fontFamily, setFontFamily] = useState('ui-sans-serif, system-ui, sans-serif')
    const [fontScale, setFontScale] = useState(1.0)

    useEffect(() => {
        setBaseUrl(window.location.origin)
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const [eventRes, tablesRes] = await Promise.all([
            fetch(`/api/admin/events/${id}`),
            fetch(`/api/admin/events/${id}/tables`)
        ])

        if (eventRes.ok && tablesRes.ok) {
            const eData = await eventRes.json()
            const tData = await tablesRes.json()
            setEvent(eData.event)
            setTables(tData.tables || [])
        } else {
            router.push('/admin/dashboard')
        }
        setLoading(false)
    }

    const handleGenerate = async () => {
        if (!event || tables.length === 0) return
        setGenerating(true)

        // Quick client-side generation trick. 
        // Wait, the API relies on table numbers but now we have event paths.
        // Let's create a specialized API endpoint to return QRs for this event, or just generate them client-side using `qrcode`.
        // Wait, we have `qrcode` installed! Let's just call the server api. But we need a new multi-event QR API.
        // Let's create `POST /api/admin/events/[id]/qrcodes` first. For now, I'll redirect to a new route.

        const res = await fetch(`/api/admin/events/${id}/qrcodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ baseUrl, size: 600 }), // Much larger QRs for print
        })

        if (res.ok) {
            const data = await res.json()
            setQrImages(data.codes)
        }
        setGenerating(false)
    }

    const handleDownloadPDF = async () => {
        if (!event || qrImages.length === 0) return
        setGenerating(true)

        // Native PDF Generation: Eliminates all browser-specific CSS layout bugs
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        const pageWidth = 210
        const pageHeight = 297
        const marginX = 10
        const marginY = 10

        const contentWidth = pageWidth - 2 * marginX
        const contentHeight = pageHeight - 2 * marginY

        const cardWidth = contentWidth / cols
        const cardHeight = cardWidth * 1.4 // Match UI aspect ratio 1:1.4

        const rowsPerPage = Math.floor(contentHeight / cardHeight)
        const itemsPerPage = cols * rowsPerPage

        for (let i = 0; i < qrImages.length; i++) {
            const { table, dataUrl } = qrImages[i]

            if (i > 0 && i % itemsPerPage === 0) {
                doc.addPage()
            }

            const pageIndex = i % itemsPerPage
            const rowIndex = Math.floor(pageIndex / cols)
            const colIndex = pageIndex % cols

            const x = marginX + colIndex * cardWidth
            const y = marginY + rowIndex * cardHeight

            // Card Boundary
            doc.setDrawColor(220, 220, 220)
            doc.setLineWidth(0.3)
            doc.rect(x, y, cardWidth, cardHeight)

            const padding = cardWidth * 0.1
            const qrSize = cardWidth - (2 * padding)
            const qrX = x + padding
            const qrY = y + padding

            // Sub-box for QR
            doc.setDrawColor(180, 180, 180)
            doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2)

            // Base64 PNG
            doc.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

            doc.setTextColor(0, 0, 0)

            // Event Name
            const eventFontSz = (cols === 4 ? 12 : cols === 3 ? 16 : cols === 2 ? 22 : 30) * fontScale
            doc.setFontSize(eventFontSz)
            doc.setFont("helvetica", "bold")
            const eventText = (event?.name || "").toUpperCase()
            const eventTextWidth = doc.getStringUnitWidth(eventText) * eventFontSz / doc.internal.scaleFactor
            const textX = x + (cardWidth - eventTextWidth) / 2
            const textY = qrY + qrSize + (cardHeight * 0.12)
            doc.text(eventText, textX, textY)

            // Line
            const lineY = textY + 3
            doc.setDrawColor(0, 0, 0)
            doc.setLineWidth(0.5)
            // Leave margin around line inside the card
            doc.line(x + padding + 3, lineY, x + cardWidth - padding - 3, lineY)

            // Team String
            const teamFontSz = (cols === 4 ? 9 : cols === 3 ? 12 : cols === 2 ? 16 : 22) * fontScale
            doc.setFontSize(teamFontSz)
            doc.setFont("helvetica", "normal")
            const teamText = `TEAM NO. ${table}`
            const teamTextWidth = doc.getStringUnitWidth(teamText) * teamFontSz / doc.internal.scaleFactor
            const teamX = x + (cardWidth - teamTextWidth) / 2
            const teamY = lineY + 6 + (cardHeight * 0.02)
            doc.text(teamText, teamX, teamY)
        }

        doc.save(`${event?.slug || 'hackathon'}-qrs.pdf`)
        setGenerating(false)
    }

    return (
        <div className="flex-1 overflow-auto bg-gray-50 flex flex-col items-center min-h-screen">
            <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-10 no-print">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/admin/events/${id}`} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">Print Setup</h1>
                            <span className="text-xs text-gray-500">Generate PDF Table Tents for {event?.name}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={generating || qrImages.length === 0}
                            className="flex items-center gap-2 bg-[#D97757] hover:bg-[#C26547] disabled:opacity-50 disabled:bg-[#EBE8DE] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            {generating && qrImages.length > 0 ? 'Generating PDF...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-6xl mx-auto px-6 py-6 no-print">
                <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-6 mb-8 flex items-end gap-6 shadow-sm">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grid Layout (Columns per A4 Page)</label>
                        <select
                            value={cols}
                            onChange={e => setCols(Number(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value={1}>1 Column</option>
                            <option value={2}>2 Columns</option>
                            <option value={3}>3 Columns</option>
                            <option value={4}>4 Columns (Match Template)</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Font Style</label>
                        <select
                            value={fontFamily}
                            onChange={e => setFontFamily(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="ui-sans-serif, system-ui, sans-serif">Modern (Sans-Serif)</option>
                            <option value="ui-serif, Georgia, serif">Classic (Serif)</option>
                            <option value="ui-monospace, SFMono-Regular, monospace">Code (Monospace)</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Font Size Scale</label>
                        <select
                            value={fontScale}
                            onChange={e => setFontScale(Number(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value={0.75}>Small (75%)</option>
                            <option value={1.0}>Normal (100%)</option>
                            <option value={1.25}>Large (125%)</option>
                            <option value={1.5}>Extra Large (150%)</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Routing URL</label>
                        <input
                            type="text"
                            value={baseUrl}
                            onChange={e => setBaseUrl(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 font-mono text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex-shrink-0 bg-black hover:bg-gray-800 disabled:opacity-50 text-white px-6 py-2 h-[38px] rounded-md font-medium text-sm transition-colors shadow-sm"
                    >
                        {generating ? 'Generating High-Res...' : 'Generate Posters'}
                    </button>
                </div>

                {qrImages.length === 0 && !loading && !generating && (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center bg-gray-50 max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Printer className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Ready to Print?</h3>
                        <p className="text-gray-500 mt-2 text-sm">Click "Generate Posters" above to render {tables.length} high-resolution QR codes suitable for professional A4 printing.</p>
                    </div>
                )}
            </div>

            {/* Screen Preview (Hide during print) */}
            {qrImages.length > 0 && (
                <div className="w-full max-w-6xl mx-auto px-6 pb-24 no-print">
                    <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Screen Preview</h3>
                    <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                        {qrImages.map(({ table, dataUrl }) => (
                            <div key={table} className="aspect-[1/1.4] bg-white border border-gray-400 p-4 flex flex-col items-center justify-start overflow-hidden hover:border-black transition-colors" style={{ fontFamily }}>
                                <div className="w-full aspect-square border border-gray-400 p-1 mb-4 flex items-center justify-center">
                                    <img src={dataUrl} alt={`Table ${table}`} className="w-full h-full object-contain" />
                                </div>
                                <div className="text-black font-black uppercase tracking-wide text-center" style={{ fontSize: `${(cols === 4 ? 14 : 20) * fontScale}px` }}>{event?.name}</div>
                                <div className="w-4/5 h-[1.5px] bg-black my-3" />
                                <div className="font-bold text-gray-900 uppercase" style={{ fontSize: `${(cols === 4 ? 11 : 16) * fontScale}px` }}>TEAM NO. {table}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* The absolute HTML print fallback layout has been removed as we now generate standard PDFs directly using jsPDF. */}


            <style jsx global>{`
        @media print {
          @page {
             size: A4;
             margin: 0;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
        </div>
    )
}
