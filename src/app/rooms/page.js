'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AuthGuard } from '@/components/auth-guard'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { Plus, Bed, User, Calendar, CheckCircle, Clock, AlertCircle, MoreVertical, Layers, Save, Pencil, Trash, Settings2, Phone, Mail, CreditCard, Utensils, Minus, PlusCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function RoomsPage() {
    const router = useRouter()
    const [rooms, setRooms] = useState([])
    const [roomTypes, setRoomTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [isActionModalOpen, setIsActionModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingRoomId, setEditingRoomId] = useState(null)
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)
    const [editingType, setEditingType] = useState(null)
    const [typeFormData, setTypeFormData] = useState({
        name: '',
        base_price: '',
        description: ''
    })

    // Form state for new room
    const [formData, setFormData] = useState({
        room_number: '',
        floor: '',
        type_id: '',
        status: 'available',
        capacity: ''
    })

    // GuestStay state
    const [isCheckInSheetOpen, setIsCheckInSheetOpen] = useState(false)
    const [checkInFormData, setCheckInFormData] = useState({
        guest_name: '',
        phone: '',
        persons: 1,
        room_id: '',
        check_in_time: new Date().toISOString(),
        status: 'active',
        total_amount: 0,
        paid_amount: 0,
        payment_status: 'pending'
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [roomsRes, typesRes, menuRes] = await Promise.all([
                fetch('/api/rooms'),
                fetch('/api/room-types'),
                fetch('/api/menu-items')
            ])

            if (roomsRes.ok && typesRes.ok && menuRes.ok) {
                const roomsData = await roomsRes.json()
                const typesData = await typesRes.json()
                const menuData = await menuRes.json()
                setRooms(roomsData)
                setRoomTypes(typesData)
                setMenuItems(menuData.data || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (checkInFormData.room_id) {
            calculateTotal()
        }
    }, [checkInFormData.room_id, checkInFormData.check_in_date, checkInFormData.check_out_date])

    // Update time to live/current when sheet opens
    useEffect(() => {
        if (isCheckInSheetOpen) {
            setCheckInFormData(prev => ({
                ...prev,
                check_in_time: new Date().toISOString()
            }))
        }
    }, [isCheckInSheetOpen])

    const getLocalTimeForInput = (isoString) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        const offset = date.getTimezoneOffset() * 60000
        const localDate = new Date(date.getTime() - offset)
        return localDate.toISOString().slice(0, 16)
    }

    const calculateTotal = () => {
        const room = rooms.find(r => r.id === checkInFormData.room_id)
        if (!room) return

        const price = room.price_per_night || room.room_types?.base_price || 0
        // Room rent is currently simplified to 1 unit per check-in for the initial quote
        // In the full details page, we can calculate based on days/hours

        setCheckInFormData(prev => ({ ...prev, total_amount: price }))
    }

    const handleCheckInSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/guest-stays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkInFormData),
            })

            if (response.ok) {
                const booking = await response.json()

                // 1. Update room status
                await fetch(`/api/rooms/${checkInFormData.room_id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'occupied' })
                })



                setIsCheckInSheetOpen(false)
                setCheckInFormData({
                    guest_name: '',
                    phone: '',
                    persons: 1,
                    room_id: '',
                    check_in_time: new Date().toISOString(),
                    status: 'active',
                    total_amount: 0,
                    paid_amount: 0,
                    payment_status: 'pending'
                })
                fetchData()
            } else {
                const err = await response.json()
                alert('Error: ' + err.error)
            }
        } catch (error) {
            console.error('Error creating booking:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleTypeSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const url = editingType ? `/api/room-types/${editingType.id}` : '/api/room-types'
            const method = editingType ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...typeFormData,
                    base_price: parseFloat(typeFormData.base_price)
                })
            })

            if (response.ok) {
                setTypeFormData({ name: '', base_price: '', description: '' })
                setEditingType(null)
                fetchData() // Refresh list
            }
        } catch (error) {
            console.error('Error saving room type:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteType = async (id) => {
        if (!confirm('Are you sure? Rooms using this type might be affected.')) return
        try {
            const response = await fetch(`/api/room-types/${id}`, { method: 'DELETE' })
            if (response.ok) fetchData()
        } catch (error) {
            console.error('Error deleting room type:', error)
        }
    }

    const handleEditClick = (room) => {
        setEditingRoomId(room.id)
        setFormData({
            room_number: room.room_number,
            floor: room.floor,
            type_id: room.type_id,
            status: room.status,
            capacity: room.capacity || ''
        })
        setIsActionModalOpen(false)
        setIsAddModalOpen(true)
    }

    const handleRoomSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const url = editingRoomId ? `/api/rooms/${editingRoomId}` : '/api/rooms'
            const method = editingRoomId ? 'PUT' : 'POST'

            const payload = {
                ...formData,
                capacity: formData.capacity ? parseInt(formData.capacity) : null
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                setIsAddModalOpen(false)
                setEditingRoomId(null)
                setFormData({ room_number: '', floor: '', type_id: '', status: 'available', capacity: '' })
                fetchData()
            } else {
                const err = await response.json()
                alert(`Error ${editingRoomId ? 'updating' : 'adding'} room: ` + err.error)
            }
        } catch (error) {
            console.error(`Error ${editingRoomId ? 'updating' : 'adding'} room:`, error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRoomAction = async (roomId, newStatus) => {
        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/rooms/${roomId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                setIsActionModalOpen(false)
                fetchData()
            } else {
                const err = await response.json()
                alert('Error updating room: ' + err.error)
            }
        } catch (error) {
            console.error('Error updating room:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCheckOut = async (room) => {
        if (!confirm(`Are you sure you want to check out Room ${room.room_number}?`)) return

        // In a real app, you might create a bill here
        // For now, we move the room to 'cleaning' status
        await handleRoomAction(room.id, 'cleaning')
    }

    const handleDeleteRoom = async (room) => {
        if (!confirm(`CRITICAL: Are you sure you want to delete Room ${room.room_number}? This will remove it from the inventory permanently.`)) return

        setIsSubmitting(true)
        try {
            const response = await fetch(`/api/rooms/${room.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setIsActionModalOpen(false)
                fetchData()
            } else {
                const err = await response.json()
                alert('Error deleting room: ' + err.error)
            }
        } catch (error) {
            console.error('Error deleting room:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusConfig = (status) => {
        switch (status) {
            case 'available':
                return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle, label: 'Available' }
            case 'occupied':
                return { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: User, label: 'Occupied' }
            case 'booked':
                return { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Calendar, label: 'Booked' }
            case 'cleaning':
                return { color: 'bg-orange-50 text-orange-600 border-orange-100', icon: Clock, label: 'Cleaning' }
            case 'maintenance':
                return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertCircle, label: 'Maintenance' }
            default:
                return { color: 'bg-slate-50 text-slate-400 border-slate-100', icon: Bed, label: status }
        }
    }

    const handleRoomClick = (room) => {
        if (room.status === 'occupied') {
            router.push(`/rooms/${room.id}`)
            return
        }
        setSelectedRoom(room)
        setIsActionModalOpen(true)
    }

    // Group rooms by floor
    const roomsByFloor = rooms.reduce((acc, room) => {
        const floor = room.floor || 'Unassigned'
        if (!acc[floor]) acc[floor] = []
        acc[floor].push(room)
        return acc
    }, {})

    // Sort floors (e.g., 1st, 2nd, 3rd or numeric)
    const sortedFloors = Object.keys(roomsByFloor).sort((a, b) => {
        const floorA = parseInt(a) || 0
        const floorB = parseInt(b) || 0
        return floorA - floorB
    })

    return (
        <AuthGuard>
            <div className="flex h-screen bg-gray-50">
                <Sidebar />

                <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                    <Navbar />

                    <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                        <div className="max-w-7xl mx-auto">
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">Room Inventory</h1>
                                    <p className="text-sm text-slate-500 mt-1">Manage room status and check-ins</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                                    <Button variant="outline" onClick={fetchData} disabled={loading} className="h-10 sm:h-9 px-3 border-slate-200 text-slate-600 rounded-lg hover:bg-gray-50 shadow-sm w-full sm:w-auto">
                                        <Clock className="h-4 w-4 mr-2" />
                                        Refresh
                                    </Button>

                                    <Dialog open={isTypeModalOpen} onOpenChange={(open) => {
                                        setIsTypeModalOpen(open)
                                        if (!open) {
                                            setEditingType(null)
                                            setTypeFormData({ name: '', base_price: '', description: '' })
                                        }
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="h-10 sm:h-9 border-slate-200 text-slate-700 hover:bg-gray-50 rounded-lg w-full sm:w-auto">
                                                <Settings2 className="h-4 w-4 mr-2" />
                                                Room Types
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl font-bold">Manage Room Types</DialogTitle>
                                            </DialogHeader>

                                            <form onSubmit={handleTypeSubmit} className="space-y-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                                <h3 className="font-bold text-orange-900 text-sm">{editingType ? 'Edit Type' : 'Add New Type'}</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Type Name</Label>
                                                        <Input
                                                            placeholder="Deluxe Double"
                                                            value={typeFormData.name}
                                                            onChange={e => setTypeFormData({ ...typeFormData, name: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Base Price (₹)</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="2500"
                                                            value={typeFormData.base_price}
                                                            onChange={e => setTypeFormData({ ...typeFormData, base_price: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Description</Label>
                                                    <Input
                                                        placeholder="King bed, AC, Sea view..."
                                                        value={typeFormData.description}
                                                        onChange={e => setTypeFormData({ ...typeFormData, description: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button type="submit" className="flex-1 bg-black hover:bg-slate-900" disabled={isSubmitting}>
                                                        {editingType ? 'Update Type' : 'Create Type'}
                                                    </Button>
                                                    {editingType && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingType(null)
                                                                setTypeFormData({ name: '', base_price: '', description: '' })
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </form>

                                            <div className="mt-6 space-y-3">
                                                <h3 className="font-bold text-gray-900 text-sm px-1">Active Room Configurations</h3>
                                                <div className="grid gap-2">
                                                    {roomTypes.map(type => (
                                                        <div key={type.id} className="flex items-center justify-between p-4 bg-white border rounded-xl hover:border-orange-200 transition-colors">
                                                            <div>
                                                                <p className="font-bold text-gray-900">{type.name}</p>
                                                                <p className="text-xs text-orange-600 font-black">₹{type.base_price}/night</p>
                                                                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{type.description}</p>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                                    onClick={() => {
                                                                        setEditingType(type)
                                                                        setTypeFormData({
                                                                            name: type.name,
                                                                            base_price: type.base_price.toString(),
                                                                            description: type.description || ''
                                                                        })
                                                                    }}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                                                                    onClick={() => handleDeleteType(type.id)}
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <Dialog open={isAddModalOpen} onOpenChange={(open) => {
                                        setIsAddModalOpen(open)
                                        if (!open) {
                                            setEditingRoomId(null)
                                            setFormData({ room_number: '', floor: '', type_id: '', status: 'available', capacity: '' })
                                        }
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6 h-10 sm:h-9 rounded-lg w-full sm:w-auto">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Room
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[450px]">
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl font-bold">
                                                    {editingRoomId ? 'Update Room Configuration' : 'Configure New Room'}
                                                </DialogTitle>
                                            </DialogHeader>
                                            <form onSubmit={handleRoomSubmit} className="space-y-6 py-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="floor">Floor</Label>
                                                        <Select
                                                            value={formData.floor}
                                                            onValueChange={(val) => setFormData({ ...formData, floor: val })}
                                                            required
                                                        >
                                                            <SelectTrigger className="h-11 w-full">
                                                                <SelectValue placeholder="Select Floor" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Ground">Ground Floor</SelectItem>
                                                                <SelectItem value="1st">1st Floor</SelectItem>
                                                                <SelectItem value="2nd">2nd Floor</SelectItem>
                                                                <SelectItem value="3rd">3rd Floor</SelectItem>
                                                                <SelectItem value="4th">4th Floor</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="room_number">Room Number</Label>
                                                        <Input
                                                            id="room_number"
                                                            placeholder="e.g. 101"
                                                            value={formData.room_number}
                                                            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                                            required
                                                            className="h-11"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="type">Room Type</Label>
                                                        <Select
                                                            value={formData.type_id}
                                                            onValueChange={(val) => setFormData({ ...formData, type_id: val })}
                                                            required
                                                        >
                                                            <SelectTrigger className="h-11 w-full">
                                                                <SelectValue placeholder="Choose Configuration" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {roomTypes.map(type => (
                                                                    <SelectItem key={type.id} value={type.id}>
                                                                        {type.name} (₹{type.base_price})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="capacity">Capacity (Persons)</Label>
                                                        <Input
                                                            id="capacity"
                                                            type="number"
                                                            placeholder="e.g. 2"
                                                            value={formData.capacity}
                                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                                            className="h-11"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-6">
                                                    <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setIsAddModalOpen(false)}>
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" className="flex-1 bg-black hover:bg-slate-900 text-white h-11" disabled={isSubmitting}>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        {isSubmitting ? 'Saving...' : editingRoomId ? 'Update Room' : 'Register Room'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-8 p-3 sm:p-4 bg-white rounded-xl border border-slate-100">
                                <span className="text-xs font-semibold text-slate-500 w-full sm:w-auto">Status:</span>
                                <div className="flex flex-wrap items-center gap-4">
                                    {['available', 'occupied', 'booked', 'cleaning', 'maintenance'].map((status) => {
                                        const config = getStatusConfig(status)
                                        const Icon = config.icon
                                        return (
                                            <div key={status} className="flex items-center gap-2">
                                                <div className={cn("h-2 w-2 rounded-full", config.color.split(' ')[1].replace('text-', 'bg-'))} />
                                                <span className="text-xs text-slate-600 capitalize">{config.label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Floor-wise Displays */}
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                                    <p className="text-sm text-slate-500">Loading rooms...</p>
                                </div>
                            ) : rooms.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                                    <Layers className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold text-gray-900">No Rooms Found</h3>
                                    <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">Add your first room to get started.</p>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    {sortedFloors.map(floor => (
                                        <div key={floor} className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                    <Layers className="h-4 w-4 text-slate-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-semibold text-slate-900">{floor} Floor</h2>
                                                    <p className="text-xs text-slate-500">{roomsByFloor[floor].length} Units</p>
                                                </div>
                                                <div className="flex-1 h-px bg-slate-100 ml-2"></div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                                                {roomsByFloor[floor].sort((a, b) => a.room_number.localeCompare(b.room_number)).map((room) => {
                                                    const config = getStatusConfig(room.status)
                                                    const StatusIcon = config.icon
                                                    return (
                                                        <div
                                                            key={room.id}
                                                            className={cn(
                                                                "group relative min-h-[160px] rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer overflow-hidden",
                                                                room.status === 'available' ? "bg-white border-slate-200 hover:border-blue-400" : cn(config.color, "border-transparent shadow-sm")
                                                            )}
                                                            onClick={() => handleRoomClick(room)}
                                                        >
                                                            <div className="p-3 sm:p-5 pb-10 sm:pb-12 flex flex-col h-full relative z-10">
                                                                <div className="flex justify-between items-start">
                                                                    <span className="text-lg sm:text-2xl font-bold text-slate-900">{room.room_number}</span>
                                                                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-white/50", config.color.split(' ')[1])}>
                                                                        <StatusIcon className="h-4 w-4" />
                                                                    </div>
                                                                </div>

                                                                <div className="mt-auto space-y-1">
                                                                    <p className="text-xs text-slate-500 truncate">
                                                                        {room.room_types?.name}
                                                                    </p>
                                                                    <div className="flex items-center justify-between mt-1">
                                                                        <span className="text-sm sm:text-lg font-semibold text-slate-900">₹{room.price_per_night || room.room_types?.base_price}</span>
                                                                        {room.status === 'occupied' && (
                                                                            <div className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-100 text-[10px] text-slate-600 font-medium">
                                                                                ₹{room.active_stay?.bills?.reduce((s, b) => s + parseFloat(b.total_amount), 0) || 0}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="absolute inset-x-0 bottom-0 bg-slate-900 translate-y-full group-hover:translate-y-0 transition-transform py-2 text-center z-20">
                                                                <span className="text-xs font-semibold text-white">
                                                                    {room.status === 'occupied' ? 'View Details' : 'Manage Room'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>
                </div>

                {/* Room Detail/Action Modal */}
                <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
                    <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-xl rounded-xl">
                        <div className="bg-slate-900 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Room Management</p>
                                    <h2 className="text-2xl font-bold">Room {selectedRoom?.room_number}</h2>
                                </div>
                                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center bg-white/10", getStatusConfig(selectedRoom?.status).color.split(' ')[1])}>
                                    <Bed className="h-5 w-5" />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 bg-white">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-500">Current Status</p>
                                    <p className="text-base font-semibold capitalize mt-1 text-slate-900">{selectedRoom?.status}</p>
                                </div>
                                <Badge variant="outline" className={cn("px-2 py-0.5 rounded-md font-medium text-xs", getStatusConfig(selectedRoom?.status).color)}>
                                    {selectedRoom?.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="p-3 bg-white border border-slate-100 rounded-lg">
                                    <p className="text-slate-500 text-xs mb-1">Category</p>
                                    <p className="font-medium text-slate-900 truncate">{selectedRoom?.room_types?.name}</p>
                                </div>
                                <div className="p-3 bg-white border border-slate-100 rounded-lg">
                                    <p className="text-slate-500 text-xs mb-1">Floor</p>
                                    <p className="font-medium text-slate-900">{selectedRoom?.floor || 'Ground'}</p>
                                </div>

                                <div className="p-3 bg-white border border-slate-100 rounded-lg">
                                    <p className="text-slate-500 text-xs mb-1">Rate</p>
                                    <p className="font-semibold text-blue-600">₹{selectedRoom?.price_per_night || selectedRoom?.room_types?.base_price}</p>
                                </div>
                                <div className="p-3 bg-white border border-slate-100 rounded-lg">
                                    <p className="text-slate-500 text-xs mb-1">Capacity</p>
                                    <p className="font-medium text-slate-900">{selectedRoom?.capacity || selectedRoom?.room_types?.capacity || 2} Persons</p>
                                </div>
                                {selectedRoom?.status === 'occupied' && (
                                    <>
                                        <div className="p-3 bg-white border border-slate-100 rounded-lg">
                                            <p className="text-slate-500 text-xs mb-1">Advance Paid</p>
                                            <p className="font-semibold text-emerald-600">₹{selectedRoom?.active_stay?.paid_amount || 0}</p>
                                        </div>
                                        <div className="p-3 bg-white border border-slate-100 rounded-lg">
                                            <p className="text-slate-500 text-xs mb-1">Pending/Bill</p>
                                            <p className="font-semibold text-rose-600">₹{(selectedRoom?.active_stay?.bills?.reduce((s, b) => s + parseFloat(b.total_amount), 0) || 0).toFixed(2)}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-3 pt-2">
                                {selectedRoom?.status === 'available' && (
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-lg font-medium"
                                        onClick={() => {
                                            setCheckInFormData(prev => ({ ...prev, room_id: selectedRoom.id }))
                                            setIsActionModalOpen(false)
                                            setIsCheckInSheetOpen(true)
                                        }}
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Check-In Guest
                                    </Button>
                                )}
                                {selectedRoom?.status === 'occupied' && (
                                    <Button
                                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 h-11 rounded-lg font-medium border border-slate-200"
                                        onClick={() => router.push(`/rooms/${selectedRoom.id}`)}
                                    >
                                        <User className="h-4 w-4 mr-2" />
                                        Guest Details
                                    </Button>
                                )}
                                {(selectedRoom?.status === 'cleaning' || selectedRoom?.status === 'maintenance') && (
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-lg font-medium"
                                        onClick={() => handleRoomAction(selectedRoom.id, 'available')}
                                        disabled={isSubmitting}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {isSubmitting ? 'Updating...' : 'Mark as Available'}
                                    </Button>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-lg border-slate-200 text-slate-600"
                                        onClick={() => handleEditClick(selectedRoom)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-lg border-slate-200 text-slate-500"
                                        onClick={() => setIsActionModalOpen(false)}
                                    >
                                        Close
                                    </Button>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-xs py-2 h-auto"
                                    onClick={() => handleDeleteRoom(selectedRoom)}
                                    disabled={isSubmitting}
                                >
                                    <Trash className="h-3.5 w-3.5 mr-2" />
                                    Delete Room
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Sheet open={isCheckInSheetOpen} onOpenChange={setIsCheckInSheetOpen}>
                    <SheetContent className="sm:max-w-[500px] p-10 overflow-y-auto">
                        <SheetHeader className="mb-8 p-0">
                            <SheetTitle className="text-xl font-semibold">New Booking / Check-In</SheetTitle>
                            <SheetDescription>Register a new guest and assign Room {rooms.find(r => r.id === checkInFormData.room_id)?.room_number}</SheetDescription>
                        </SheetHeader>

                        <form onSubmit={handleCheckInSubmit} className="space-y-8 p-0">
                            {/* Guest Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Guest Details</h3>
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        placeholder="John Doe"
                                        value={checkInFormData.guest_name}
                                        onChange={e => setCheckInFormData({ ...checkInFormData, guest_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Phone Number</Label>
                                        <Input
                                            placeholder="+91..."
                                            value={checkInFormData.phone}
                                            onChange={e => setCheckInFormData({ ...checkInFormData, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Number of Persons</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={checkInFormData.persons}
                                            onChange={e => setCheckInFormData({ ...checkInFormData, persons: parseInt(e.target.value) || 1 })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Stay Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Stay Schedule</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label>Check-In Date & Time</Label>
                                        <Input
                                            type="datetime-local"
                                            value={getLocalTimeForInput(checkInFormData.check_in_time)}
                                            onChange={e => setCheckInFormData({ ...checkInFormData, check_in_time: new Date(e.target.value).toISOString() })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>



                            {/* Payment */}
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-lg border flex flex-col justify-center">
                                        <span className="text-xs font-medium text-gray-500 uppercase">Room Rate</span>
                                        <span className="text-xl font-bold text-gray-900">₹{checkInFormData.total_amount}</span>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg border flex flex-col justify-center">
                                        <span className="text-xs font-medium text-gray-500 uppercase">Balance Due</span>
                                        <span className={`text-xl font-bold ${checkInFormData.total_amount - checkInFormData.paid_amount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            ₹{Math.max(0, checkInFormData.total_amount - checkInFormData.paid_amount)}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Advance Paid</Label>
                                        <Input
                                            type="number"
                                            value={checkInFormData.paid_amount}
                                            onChange={e => setCheckInFormData({ ...checkInFormData, paid_amount: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={checkInFormData.payment_status}
                                            onValueChange={val => setCheckInFormData({ ...checkInFormData, payment_status: val })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="partial">Partial</SelectItem>
                                                <SelectItem value="paid">Fully Paid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium" disabled={isSubmitting}>
                                {isSubmitting ? 'Allocating...' : 'Allocate Room'}
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div >
        </AuthGuard >
    )
}
