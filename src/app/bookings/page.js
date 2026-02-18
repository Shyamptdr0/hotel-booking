'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AuthGuard } from '@/components/auth-guard'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import {
    ArrowLeft, Search, Calendar, User,
    MapPin, CheckCircle, Clock, CreditCard,
    LogOut, Eye
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function BookingHistory() {
    const router = useRouter()
    const [stays, setStays] = useState([])
    const [filteredStays, setFilteredStays] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all')
    const [loading, setLoading] = useState(true)

    const fetchStays = useCallback(async () => {
        try {
            const response = await fetch('/api/guest-stays')
            if (response.ok) {
                const data = await response.json()
                setStays(data || [])
            }
        } catch (error) {
            console.error('Error fetching stays:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchStays()
    }, [fetchStays])

    useEffect(() => {
        filterStays()
    }, [stays, searchTerm, statusFilter, dateFilter])

    const filterStays = () => {
        let filtered = stays

        // Search filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase()
            filtered = filtered.filter(stay =>
                stay.guest_name?.toLowerCase().includes(lowerTerm) ||
                stay.room_number?.toString().includes(lowerTerm) ||
                stay.phone?.includes(searchTerm)
            )
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(stay => stay.status === statusFilter)
        }

        // Date filter (Check-in time)
        if (dateFilter !== 'all') {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            filtered = filtered.filter(stay => {
                const checkIn = new Date(stay.check_in_time)
                switch (dateFilter) {
                    case 'today':
                        return checkIn >= today
                    case 'week':
                        const week = new Date()
                        week.setDate(week.getDate() - 7)
                        return checkIn >= week
                    case 'month':
                        const month = new Date()
                        month.setMonth(month.getMonth() - 1)
                        return checkIn >= month
                    default:
                        return true
                }
            })
        }

        setFilteredStays(filtered)
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'completed': return 'bg-slate-100 text-slate-700 border-slate-200'
            case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    // Helper to calculate total including bills if not set
    const calculateTotal = (stay) => {
        const billsTotal = stay.bills?.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0) || 0
        // If total_amount in stay is just room rent (which we set at checkin), we might need to add bills?
        // In our logic, we usually update stay.total_amount at checkout.
        // For active stays, stay.total_amount might just be rent.
        // Let's display what's in the DB + bills validly?
        // Actually, in dashboard we saw `total_amount` is usually reliable if updated. 
        // But let's check `rooms/[id]` logic: roomCharges + foodCharges.

        // Simple display:
        return stay.total_amount // fallback or logic depending on your backend
    }

    if (loading) {
        return (
            <AuthGuard>
                <div className="flex h-screen bg-gray-50">
                    <Sidebar />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                    </div>
                </div>
            </AuthGuard>
        )
    }

    return (
        <AuthGuard>
            <div className="flex h-screen bg-gray-50">
                <div className="hidden lg:flex h-full w-64 flex-col bg-slate-50 border-r border-slate-200">
                    <Sidebar />
                </div>

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <Navbar />

                    <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                        <div className="max-w-7xl mx-auto space-y-6">

                            {/* Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">Booking History</h1>
                                    <p className="text-sm text-slate-500 mt-1">Manage guest stays and invoices</p>
                                </div>
                                <Link href="/rooms">
                                    <Button className="bg-slate-900 text-white hover:bg-black">
                                        Go to Room Status
                                    </Button>
                                </Link>
                            </div>

                            {/* Filters */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="sm:col-span-2 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search guest, room or phone..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={dateFilter} onValueChange={setDateFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Date Range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Time</SelectItem>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="week">This Week</SelectItem>
                                        <SelectItem value="month">This Month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Table */}
                            <Card className="border-slate-200 shadow-sm">
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="font-semibold text-slate-700">Guest Details</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Room</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Check-In / Out</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                                <TableHead className="text-right font-semibold text-slate-700">Amount</TableHead>
                                                <TableHead className="text-right font-semibold text-slate-700 px-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredStays.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                                        No bookings found matching your criteria.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredStays.map((stay) => (
                                                    <TableRow key={stay.id} className="hover:bg-slate-50 transition-colors">
                                                        <TableCell>
                                                            <div className="font-medium text-slate-900">{stay.guest_name}</div>
                                                            <div className="text-xs text-slate-500">{stay.phone}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="font-normal bg-white">
                                                                Room {stay.rooms?.room_number}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-slate-600">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-medium">IN</span>
                                                                {new Date(stay.check_in_time).toLocaleDateString()}
                                                                <span className="text-slate-400 text-xs">{new Date(stay.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            {stay.check_out_time && (
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-medium">OUT</span>
                                                                    {new Date(stay.check_out_time).toLocaleDateString()}
                                                                    <span className="text-slate-400 text-xs">{new Date(stay.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`capitalize ${getStatusColor(stay.status)}`}>
                                                                {stay.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-slate-900">
                                                            ₹{stay.total_amount || 0}
                                                        </TableCell>
                                                        <TableCell className="text-right px-6">
                                                            <div className="flex justify-end gap-2">
                                                                {stay.status === 'active' ? (
                                                                    <Link href={`/rooms/${stay.room_id}`}>
                                                                        <Button size="sm" variant="outline" className="h-8">
                                                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                                                            Details
                                                                        </Button>
                                                                    </Link>
                                                                ) : (
                                                                    <Link href={`/checkout/${stay.id}`}>
                                                                        <Button size="sm" variant="outline" className="h-8">
                                                                            <LogOut className="h-3.5 w-3.5 mr-1" />
                                                                            Invoice
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    )
}
