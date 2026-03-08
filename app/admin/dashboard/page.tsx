'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Table as TableIcon, Trash2, ExternalLink } from 'lucide-react'

type EventType = {
    id: string
    name: string
    slug: string
    created_at: string
    table_count: number
}

export default function AdminDashboard() {
    const [events, setEvents] = useState<EventType[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ name: '', table_count: 50 })

    const fetchEvents = useCallback(async () => {
        setLoading(true)
        const res = await fetch('/api/admin/events')
        if (res.ok) {
            const data = await res.json()
            setEvents(data.events || [])
        }
        setLoading(false)
    }, [])

    useEffect(() => { fetchEvents() }, [fetchEvents])

    const handleCreateEvent = async () => {
        if (!form.name || form.table_count < 1) return
        setSaving(true)

        const res = await fetch('/api/admin/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        })

        if (res.ok) {
            setShowAddModal(false)
            setForm({ name: '', table_count: 50 })
            fetchEvents()
        }
        setSaving(false)
    }

    const handleDeleteEvent = async (id: string, name: string) => {
        if (!confirm(`Are you SURE you want to delete "${name}"? This deletes all tables and QR rules.`)) return

        await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
        fetchEvents()
    }

    if (loading) {
        return <div className="p-8 flex items-center gap-3 text-gray-500 font-medium"><div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Loading workspace data...</div>
    }

    return (
        <div className="flex-1 overflow-auto bg-[#FDFBF7]">
            <div className="max-w-7xl mx-auto px-6 py-8">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[#1F1F1D] font-serif">Events Workspace</h1>
                        <p className="text-sm text-[#5C5C59] mt-1">Manage multiple hackathons and bulk table assignments.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-[#D97757] hover:bg-[#C26547] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Event
                    </button>
                </div>

                {events.length === 0 ? (
                    <div className="border border-dashed border-[#EBE8DE] rounded-xl p-12 text-center bg-white shadow-sm">
                        <h3 className="text-lg font-medium text-[#1F1F1D] mb-2 font-serif">No Events Found</h3>
                        <p className="text-[#5C5C59] text-sm mb-6 max-w-sm mx-auto">Create an event to generate QR codes and start managing dynamic redirects for your tables.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 bg-[#F3F0E6] hover:bg-[#EBE8DE] text-[#1F1F1D] px-4 py-2 rounded-md font-medium text-sm transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create First Event
                        </button>
                    </div>
                ) : (
                    <div className="bg-white border text-[#1F1F1D] border-[#EBE8DE] rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#F3F0E6] border-b border-[#EBE8DE] text-[#5C5C59] font-medium">
                                <tr>
                                    <th className="px-6 py-4">Event Name</th>
                                    <th className="px-6 py-4">Slug</th>
                                    <th className="px-6 py-4">Tables</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {events.map(event => (
                                    <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{event.name}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs max-w-[200px] truncate" title={event.slug}>{event.slug}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <TableIcon className="w-4 h-4" />
                                                {event.table_count} registered
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link
                                                    href={`/admin/events/${event.id}`}
                                                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                                                >
                                                    Manage Tables <ExternalLink className="w-3.5 h-3.5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id, event.name)}
                                                    className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                                                    title="Delete Event"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* New Event Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Create New Event</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 lg:text-xl">&times;</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#1F1F1D] mb-1">Event Name</label>
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="e.g. HackGen v1.0"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full bg-white border border-[#EBE8DE] text-[#1F1F1D] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1F1F1D] mb-1">Number of Tables (Teams)</label>
                                <input
                                    type="number"
                                    min={1} max={500}
                                    value={form.table_count}
                                    onChange={e => setForm(f => ({ ...f, table_count: Number(e.target.value) }))}
                                    className="w-full bg-white border border-[#EBE8DE] text-[#1F1F1D] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]"
                                />
                                <p className="text-xs text-[#5C5C59] mt-1">This will automatically generate {form.table_count} QR slots.</p>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-[#FDFBF7] border-t border-[#EBE8DE] flex justify-end gap-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 text-sm font-medium text-[#5C5C59] hover:bg-[#EBE8DE] rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateEvent}
                                disabled={saving || !form.name || form.table_count < 1}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#D97757] hover:bg-[#C26547] disabled:opacity-50 rounded-md transition-colors"
                            >
                                {saving ? 'Creating...' : 'Create Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
