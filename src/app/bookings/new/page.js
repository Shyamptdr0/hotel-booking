'use client'

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AuthGuard } from '@/components/auth-guard'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { ArrowLeft, Save, User, Phone, Mail, CreditCard, Calendar } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

function BookingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preSelectedRoomId = searchParams.get('roomId')

    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        guest_name: '',
        guest_phone: '',
        guest_email: '',
        room_id: preSelectedRoomId || '',
        check_in_date: new Date().toISOString().split('T')[0],
        check_out_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        total_amount: 0,
        paid_amount: 0,
        payment_status: 'pending'
    })

    useEffect(() => {
        fetchRooms()
    }, [])

    useEffect(() => {
        if (formData.room_id && rooms.length > 0) {
            calculateTotal()
        }
    }, [formData.room_id, formData.check_in_date, formData.check_out_date, rooms])

    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/rooms')
            if (response.ok) {
                const data = await response.json()
                setRooms(data.filter(r => r.status === 'available' || r.id === preSelectedRoomId))
            }
        } catch (error) {
            console.error('Error fetching rooms:', error)
        }
    }

    const calculateTotal = () => {
        const room = rooms.find(r => r.id === formData.room_id)
        if (!room) return

        const price = room.price_per_night || room.room_types?.base_price || 0
        const start = new Date(formData.check_in_date)
        const end = new Date(formData.check_out_date)
        const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))

        setFormData(prev => ({ ...prev, total_amount: price * nights }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                // Update room status to occupied if checking in now
                await fetch(`/api/rooms/${formData.room_id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'occupied' })
                })

                router.push('/rooms')
            } else {
                const err = await response.json()
                alert('Error: ' + err.error)
            }
        } catch (error) {
            console.error('Error creating booking:', error)
            alert('Failed to create booking')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthGuard>
            <div className="flex h-screen bg-gray-50">
                <Sidebar />

                <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                    <Navbar />

                    <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                        <div className="max-w-3xl mx-auto">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-6"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Rooms
                            </button>

                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">New Booking / Check-In</h1>
                                <p className="text-gray-500 mt-1">Register a new guest and assign a room</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                                    <CardHeader className="bg-white border-b p-6">
                                        <CardTitle className="text-lg flex items-center">
                                            <User className="h-5 w-5 mr-2 text-orange-600" />
                                            Guest Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="guest_name">Full Name</Label>
                                                <Input
                                                    id="guest_name"
                                                    placeholder="John Doe"
                                                    required
                                                    value={formData.guest_name}
                                                    onChange={e => setFormData({ ...formData, guest_name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="guest_phone">Phone Number</Label>
                                                <Input
                                                    id="guest_phone"
                                                    placeholder="+91 98765 43210"
                                                    required
                                                    value={formData.guest_phone}
                                                    onChange={e => setFormData({ ...formData, guest_phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="guest_email">Email Address (Optional)</Label>
                                            <Input
                                                id="guest_email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={formData.guest_email}
                                                onChange={e => setFormData({ ...formData, guest_email: e.target.value })}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                                    <CardHeader className="bg-white border-b p-6">
                                        <CardTitle className="text-lg flex items-center">
                                            <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                                            Stay Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="room">Select Room</Label>
                                            <Select
                                                value={formData.room_id}
                                                onValueChange={val => setFormData({ ...formData, room_id: val })}
                                                required
                                            >
                                                <SelectTrigger className="h-12">
                                                    <SelectValue placeholder="Choose an available room" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {rooms.map(room => (
                                                        <SelectItem key={room.id} value={room.id}>
                                                            Room {room.room_number} - {room.room_types?.name} (₹{room.price_per_night || room.room_types?.base_price})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="check_in">Check-In Date</Label>
                                                <Input
                                                    id="check_in"
                                                    type="date"
                                                    required
                                                    value={formData.check_in_date}
                                                    onChange={e => setFormData({ ...formData, check_in_date: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="check_out">Check-Out Date</Label>
                                                <Input
                                                    id="check_out"
                                                    type="date"
                                                    required
                                                    value={formData.check_out_date}
                                                    onChange={e => setFormData({ ...formData, check_out_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                                    <CardHeader className="bg-white border-b p-6">
                                        <CardTitle className="text-lg flex items-center">
                                            <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
                                            Payment Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col space-y-4">
                                            <div className="flex justify-between items-center py-2 border-b border-dashed">
                                                <span className="text-gray-600">Total Calculation</span>
                                                <span className="text-xl font-bold text-orange-600">₹{formData.total_amount}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="paid">Advance Amount (Optional)</Label>
                                                    <Input
                                                        id="paid"
                                                        type="number"
                                                        placeholder="0"
                                                        value={formData.paid_amount}
                                                        onChange={e => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="pay_status">Payment Status</Label>
                                                    <Select
                                                        value={formData.payment_status}
                                                        onValueChange={val => setFormData({ ...formData, payment_status: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pending</SelectItem>
                                                            <SelectItem value="partial">Partial</SelectItem>
                                                            <SelectItem value="paid">Fully Paid</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 py-6"
                                        onClick={() => router.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-6 shadow-lg shadow-orange-200"
                                        disabled={loading}
                                    >
                                        <Save className="h-5 w-5 mr-2" />
                                        {loading ? 'Processing...' : 'Complete Check-In'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    )
}

export default function NewBooking() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingContent />
        </Suspense>
    )
}
