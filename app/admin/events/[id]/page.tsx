'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckSquare, Square, Search, Copy, Printer, Trash } from 'lucide-react'

type Redirect = {
    id: string
    destination_url: string
    label: string
    start_time: string
    end_time: string
    is_default: boolean
}

type Table = {
    id: string
    table_number: number
    label: string
    qr_redirects: Redirect[]
}

const EMPTY_FORM = {
    label: '',
    destination_url: '',
    start_time: '',
    end_time: '',
    is_default: false,
}

function isActive(r: Redirect) {
    const now = new Date()
    return r.is_default || (new Date(r.start_time) <= now && new Date(r.end_time) >= now)
}

function formatLocal(isoStr: string) {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export default function EventTablesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()

    const [event, setEvent] = useState<{ name: string, slug: string } | null>(null)
    const [tables, setTables] = useState<Table[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())

    // Modal state
    const [showBulkModal, setShowBulkModal] = useState(false)
    const [showClearModal, setShowClearModal] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [savedTiles, setSavedTiles] = useState<{ label: string, url: string }[]>([])

    // Load tiles from localStorage
    useEffect(() => {
        try {
            const tiles = localStorage.getItem('hackgen_tiles')
            if (tiles) setSavedTiles(JSON.parse(tiles))
        } catch (e) { }
    }, [])

    const handleSaveTile = () => {
        if (!form.destination_url) return
        const newTiles = [...savedTiles, { label: form.label || 'Saved Link', url: form.destination_url }]
        setSavedTiles(newTiles)
        localStorage.setItem('hackgen_tiles', JSON.stringify(newTiles))
    }

    const handleDeleteTile = (idx: number) => {
        const newTiles = savedTiles.filter((_, i) => i !== idx)
        setSavedTiles(newTiles)
        localStorage.setItem('hackgen_tiles', JSON.stringify(newTiles))
    }

    const fetchData = useCallback(async () => {
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
    }, [id, router])

    useEffect(() => { fetchData() }, [fetchData])

    const toggleAll = () => {
        if (selectedTables.size === filteredTables.length) {
            setSelectedTables(new Set())
        } else {
            setSelectedTables(new Set(filteredTables.map(t => t.id)))
        }
    }

    const toggleTable = (tableId: string) => {
        const next = new Set(selectedTables)
        if (next.has(tableId)) next.delete(tableId)
        else next.add(tableId)
        setSelectedTables(next)
    }

    const handleBulkSubmit = async () => {
        if (!form.destination_url || selectedTables.size === 0) return
        setSaving(true)

        const payload = {
            ...form,
            table_ids: Array.from(selectedTables),
            start_time: form.is_default ? new Date(0).toISOString() : new Date(form.start_time).toISOString(),
            end_time: form.is_default ? new Date('2099-12-31').toISOString() : new Date(form.end_time).toISOString(),
        }

        const res = await fetch(`/api/admin/events/${id}/bulk-redirects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (res.ok) {
            setShowBulkModal(false)
            setSelectedTables(new Set())
            setForm(EMPTY_FORM)
            fetchData()
        }
        setSaving(false)
    }

    const handleBulkClear = async () => {
        if (selectedTables.size === 0) return
        setSaving(true)

        const res = await fetch(`/api/admin/events/${id}/bulk-redirects`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table_ids: Array.from(selectedTables) })
        })

        if (res.ok) {
            setShowClearModal(false)
            setSelectedTables(new Set())
            fetchData()
        }
        setSaving(false)
    }

    const filteredTables = tables.filter(t =>
        t.table_number.toString().includes(searchTerm) ||
        t.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleQuickSchedule = (type: 'now_30m' | 'queue_30m' | 'queue_1h') => {
        const nowMs = Date.now()
        let startMs = nowMs

        if (type.startsWith('queue')) {
            let maxEnd = nowMs
            selectedTables.forEach(tid => {
                const table = tables.find(t => t.id === tid)
                if (table) {
                    table.qr_redirects.forEach(r => {
                        if (!r.is_default && r.end_time) {
                            const endMs = new Date(r.end_time).getTime()
                            if (endMs > maxEnd) maxEnd = endMs
                        }
                    })
                }
            })
            // Add a tiny buffer (1 min) to the queue so links don't visually overlap on exact same ms
            startMs = maxEnd + 60000
        }

        const durationMs = type === 'queue_1h' ? 60 * 60 * 1000 : 30 * 60 * 1000
        const endMs = startMs + durationMs

        const formatForInput = (ms: number) => {
            const d = new Date(ms)
            const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            return local.toISOString().slice(0, 16)
        }

        setForm(f => ({
            ...f,
            is_default: false,
            start_time: formatForInput(startMs),
            end_time: formatForInput(endMs)
        }))
    }

    if (loading) {
        return <div className="p-8 text-gray-500 font-medium">Loading event data...</div>
    }

    if (!event) return null

    return (
        <div className="flex-1 overflow-auto bg-[#FDFBF7] flex flex-col items-center">
            <div className="w-full bg-[#FFFFFF] border-b border-[#EBE8DE] sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2 -ml-2 text-[#5C5C59] hover:text-[#1F1F1D] rounded hover:bg-[#F3F0E6] transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-[#1F1F1D] leading-tight font-serif">{event.name}</h1>
                            <span className="text-xs font-mono text-[#5C5C59] bg-[#F3F0E6] px-2 py-0.5 rounded">/e/{event.slug}/[table]</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-1/3">
                        <div className="relative w-full">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5C59]" />
                            <input
                                type="text"
                                placeholder="Search tables..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-[#FDFBF7] border border-[#EBE8DE] text-sm rounded-md pl-9 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D97757] focus:border-transparent transition-all"
                            />
                        </div>

                        <Link
                            href={`/admin/events/${id}/print`}
                            className="flex items-center gap-2 bg-[#D97757] hover:bg-[#C26547] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shadow-sm"
                        >
                            <Printer className="w-4 h-4" />
                            Print QRs
                        </Link>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-6xl mx-auto px-6 py-8">
                {/* Bulk Action Bar */}
                <div className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between transition-all duration-300 ${selectedTables.size > 0 ? 'bg-[#D97757]/10 border-[#D97757]/30 shadow-sm' : 'bg-[#FFFFFF] border-[#EBE8DE] shadow-sm opacity-50 pointer-events-none'}`}>
                    <div className="flex items-center gap-3 mb-4 sm:mb-0">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${selectedTables.size > 0 ? 'bg-[#D97757] text-white' : 'bg-[#EBE8DE] text-[#5C5C59]'}`}>
                            {selectedTables.size}
                        </span>
                        <span className="font-medium text-[#1F1F1D]">Tables Selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowClearModal(true)}
                            className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
                        >
                            <Trash className="w-4 h-4" /> Clear All Rules
                        </button>
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="flex items-center gap-2 bg-[#D97757] hover:bg-[#C26547] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
                        >
                            <Copy className="w-4 h-4" /> Apply Master Rule
                        </button>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="bg-[#FFFFFF] border border-[#EBE8DE] rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#F3F0E6] border-b border-[#EBE8DE] text-[#5C5C59] font-medium">
                            <tr>
                                <th className="px-5 py-4 w-12 text-center">
                                    <button onClick={toggleAll} className="text-[#8A8A86] hover:text-[#1F1F1D] transition-colors">
                                        {selectedTables.size === filteredTables.length && filteredTables.length > 0 ? <CheckSquare className="w-5 h-5 text-[#D97757]" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="px-5 py-4 w-24">Table No.</th>
                                <th className="px-5 py-4">Status & Rules</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTables.map(table => {
                                const isSelected = selectedTables.has(table.id)
                                const activeRules = table.qr_redirects.filter(isActive)
                                const isLive = activeRules.length > 0

                                return (
                                    <tr key={table.id} className={`transition-colors hover:bg-[#FDFBF7] ${isSelected ? 'bg-[#D97757]/5' : ''}`}>
                                        <td className="px-5 py-4 text-center align-top">
                                            <button onClick={() => toggleTable(table.id)} className="text-[#8A8A86] hover:text-[#5C5C59] transition-colors mt-0.5">
                                                {isSelected ? <CheckSquare className="w-5 h-5 text-[#D97757]" /> : <Square className="w-5 h-5" />}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4 align-top">
                                            <div className="font-semibold text-[#1F1F1D] text-base">{table.table_number}</div>
                                            <div className="text-xs text-[#5C5C59] mt-1 truncate w-full" title={table.id}>{table.id.split('-')[0]}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            {table.qr_redirects.length === 0 ? (
                                                <span className="text-[#8A8A86] italic text-sm">No rules configured. Select table to apply bulk rules.</span>
                                            ) : (
                                                <div className="space-y-2">
                                                    {table.qr_redirects.map(r => {
                                                        const active = isActive(r)
                                                        return (
                                                            <div key={r.id} className={`flex items-start gap-3 p-3 rounded-lg border ${active ? 'border-green-200 bg-green-50' : 'border-[#EBE8DE] bg-[#FDFBF7]'} max-w-2xl`}>
                                                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${r.is_default ? 'bg-[#D97757]' : active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-semibold text-[#1F1F1D]">{r.label || 'Unnamed Rule'}</span>
                                                                        {r.is_default && <span className="text-xs font-mono bg-[#D97757]/10 text-[#D97757] px-1.5 py-0.5 rounded">DEFAULT</span>}
                                                                        {active && !r.is_default && <span className="text-xs font-mono bg-green-100 text-green-700 px-1.5 py-0.5 rounded">ACTIVE</span>}
                                                                    </div>
                                                                    <a href={r.destination_url} target="_blank" rel="noreferrer" className="text-sm text-[#D97757] hover:text-[#C26547] hover:underline block truncate w-full max-w-lg mb-1">{r.destination_url}</a>
                                                                    {!r.is_default && (
                                                                        <div className="text-xs font-mono text-[#5C5C59] flex items-center gap-1.5">
                                                                            {formatLocal(r.start_time)} <span className="text-[#EBE8DE]">→</span> {formatLocal(r.end_time)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredTables.length === 0 && (
                                <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No tables matching your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bulk Apply Modal */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#FFFFFF] rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-[#EBE8DE]">
                        <div className="px-6 py-4 border-b border-[#EBE8DE] flex justify-between items-center bg-[#D97757]/10">
                            <h3 className="font-semibold text-[#1F1F1D] flex items-center gap-2"><Copy className="w-4 h-4 text-[#D97757]" /> Batch Apply Rule</h3>
                            <button onClick={() => setShowBulkModal(false)} className="text-[#8A8A86] hover:text-[#1F1F1D] lg:text-xl">&times;</button>
                        </div>

                        <div className="p-6 space-y-4 text-[#1F1F1D] text-sm">
                            <div className="bg-[#D97757]/10 border border-[#D97757]/30 text-[#D97757] px-4 py-3 rounded-md mb-4 flex gap-3 text-sm">
                                <span className="text-lg">ℹ️</span>
                                <div>Applying <strong>new redirect rule</strong> to <strong>{selectedTables.size} selected tables</strong> simultaneously.</div>
                            </div>

                            {/* Saved Link Tiles */}
                            {savedTiles.length > 0 && (
                                <div className="mb-4">
                                    <label className="block font-medium text-gray-700 mb-2 text-xs uppercase tracking-wider">Quick Select Saved Links (Tiles)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {savedTiles.map((tile, i) => (
                                            <div key={i} className="group relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, label: tile.label, destination_url: tile.url }))}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                                                >
                                                    {tile.label}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTile(i)}
                                                    className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-sm"
                                                    title="Remove Tile"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block font-medium text-[#1F1F1D] mb-1 flex justify-between">
                                    <span>Destination URL *</span>
                                    {form.destination_url && (
                                        <button onClick={handleSaveTile} className="text-xs text-[#D97757] hover:text-[#C26547] font-medium">
                                            + Save as Tile
                                        </button>
                                    )}
                                </label>
                                <input
                                    type="url"
                                    value={form.destination_url}
                                    onChange={e => setForm(f => ({ ...f, destination_url: e.target.value }))}
                                    placeholder="https://chat.whatsapp.com/..."
                                    className="w-full bg-[#FFFFFF] border border-[#EBE8DE] rounded-md px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#D97757] shadow-inner"
                                />
                            </div>

                            <div>
                                <label className="block font-medium text-[#1F1F1D] mb-1">Rule Label <span className="text-[#5C5C59] font-normal">(optional)</span></label>
                                <input
                                    type="text"
                                    value={form.label}
                                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                                    placeholder="e.g. WhatsApp Group"
                                    className="w-full bg-[#FFFFFF] border border-[#EBE8DE] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757] shadow-inner"
                                />
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer py-2 border-b border-[#EBE8DE]">
                                <input type="checkbox" checked={form.is_default} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} className="w-4 h-4 text-[#D97757] rounded border-[#EBE8DE] focus:ring-[#D97757]" />
                                <span className="font-medium text-[#1F1F1D]">Make this the Default Fallback</span>
                            </label>

                            {!form.is_default && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={() => handleQuickSchedule('now_30m')} className="px-3 py-1.5 bg-[#D97757]/10 text-[#D97757] hover:bg-[#D97757]/20 border border-[#D97757]/30 text-xs rounded-md font-medium transition-colors shadow-sm">⚡ Start Now (30m)</button>
                                        <button type="button" onClick={() => handleQuickSchedule('queue_30m')} className="px-3 py-1.5 bg-[#F3F0E6] text-[#5C5C59] hover:bg-[#EBE8DE] border border-[#EBE8DE] text-xs rounded-md font-medium transition-colors shadow-sm">⏳ Queue Next (30m)</button>
                                        <button type="button" onClick={() => handleQuickSchedule('queue_1h')} className="px-3 py-1.5 bg-[#F3F0E6] text-[#5C5C59] hover:bg-[#EBE8DE] border border-[#EBE8DE] text-xs rounded-md font-medium transition-colors shadow-sm">⏳ Queue Next (1hr)</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-medium text-[#1F1F1D] mb-1">Active From *</label>
                                            <input
                                                type="datetime-local"
                                                value={form.start_time}
                                                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                                                className="w-full bg-[#FFFFFF] border border-[#EBE8DE] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D97757]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-medium text-[#1F1F1D] mb-1">Active Until *</label>
                                            <input
                                                type="datetime-local"
                                                value={form.end_time}
                                                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                                                className="w-full bg-[#FFFFFF] border border-[#EBE8DE] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#D97757]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-[#FDFBF7] border-t border-[#EBE8DE] flex justify-end gap-2">
                            <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 font-medium text-[#5C5C59] hover:bg-[#F3F0E6] rounded-md transition-colors text-sm">Cancel</button>
                            <button
                                onClick={handleBulkSubmit}
                                disabled={saving || !form.destination_url || (!form.is_default && (!form.start_time || !form.end_time))}
                                className="px-6 py-2 font-medium text-white bg-[#D97757] hover:bg-[#C26547] disabled:opacity-50 rounded-md transition-colors shadow-sm text-sm"
                            >
                                {saving ? 'Applying...' : 'Apply to Selected'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Modal */}
            {showClearModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-red-200">
                        <div className="px-6 py-5">
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto"><Trash className="w-6 h-6" /></div>
                            <h3 className="font-bold text-[#1F1F1D] text-center mb-2">Clear All Redirects?</h3>
                            <p className="text-[#5C5C59] text-sm text-center">Are you sure you want to delete EVERY active and scheduled redirect rule for the {selectedTables.size} selected tables? This cannot be undone.</p>
                        </div>

                        <div className="px-6 py-4 bg-[#FDFBF7] border-t border-[#EBE8DE] flex gap-3">
                            <button onClick={() => setShowClearModal(false)} className="flex-1 px-4 py-2 font-medium text-[#5C5C59] hover:bg-[#EBE8DE] rounded-md transition-colors text-sm">Cancel</button>
                            <button
                                onClick={handleBulkClear}
                                disabled={saving}
                                className="flex-1 px-4 py-2 font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md transition-colors shadow-sm text-sm"
                            >
                                {saving ? 'Deleting...' : 'Yes, Clear All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
