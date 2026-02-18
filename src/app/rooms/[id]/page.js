'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AuthGuard } from '@/components/auth-guard'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import {
    User, Phone, Clock, Utensils, CreditCard,
    ArrowLeft, Plus, Minus, Trash2, Receipt,
    Flame, Coffee, Pizza, Beef, Wine, Pencil, Users,
    ChevronRight, ChevronDown, LogOut, Loader2, Search
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function RoomDetailsPage({ params }) {
    const { id } = use(params)
    const router = useRouter()
    const [room, setRoom] = useState(null)
    const [stay, setStay] = useState(null)
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [cart, setCart] = useState([])
    const [filterCategory, setFilterCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedBills, setExpandedBills] = useState({})
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
    const [isClearRoomModalOpen, setIsClearRoomModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editForm, setEditForm] = useState({
        guest_name: '',
        phone: '',
        persons: 1
    })

    const toggleBill = (billId) => {
        setExpandedBills(prev => ({
            ...prev,
            [billId]: !prev[billId]
        }))
    }

    useEffect(() => {
        fetchData()
        fetchMenu()
    }, [id])

    const fetchData = async () => {
        try {
            setLoading(true)
            const roomRes = await fetch(`/api/rooms/${id}`)
            if (roomRes.ok) {
                const roomData = await roomRes.json()
                setRoom(roomData)

                // Fetch active stay for this room
                const stayRes = await fetch(`/api/guest-stays?room_id=${id}&status=active`)
                if (stayRes.ok) {
                    const stayData = await stayRes.json()
                    if (stayData && stayData.length > 0) {
                        setStay(stayData[0])
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching room data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchMenu = async () => {
        try {
            const res = await fetch('/api/menu-items')
            if (res.ok) {
                const data = await res.json()
                setMenuItems(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching menu:', error)
        }
    }

    const categories = ['All', ...new Set(menuItems.map(item => item.category))]

    const filteredMenu = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory
        return matchesSearch && matchesCategory
    })

    const addToCart = (item) => {
        const existing = cart.find(i => i.id === item.id)
        if (existing) {
            setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        } else {
            setCart([...cart, { ...item, quantity: 1 }])
        }
    }

    const updateCartQty = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const removeFromCart = (id) => {
        setCart(cart.filter(i => i.id !== id))
    }

    const saveOrder = async () => {
        if (cart.length === 0) return
        setIsSubmitting(true)
        try {
            const billTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            const res = await fetch('/api/bills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subtotal: billTotal,
                    total_amount: billTotal,
                    payment_type: 'room_service',
                    items: cart.map(i => ({ ...i, item_id: i.id, item_name: i.name })),
                    room_id: id,
                    stay_id: stay.id,
                    status: 'running'
                })
            })

            if (res.ok) {
                setCart([])
                fetchData() // Refresh bill history
                alert('Order saved successfully!')
            }
        } catch (error) {
            console.error('Error saving order:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCheckOut = () => {
        setIsCheckoutModalOpen(true)
    }

    const confirmCheckOut = async () => {
        setIsCheckoutModalOpen(false)
        router.push(`/checkout/${stay.id}`)
    }

    const handleClearRoom = () => {
        setIsClearRoomModalOpen(true)
    }

    const confirmClearRoom = async () => {
        setIsClearRoomModalOpen(false)
        setIsSubmitting(true)
        try {
            // 1. Delete the stay completely so it doesn't show in history
            await fetch(`/api/guest-stays/${stay.id}`, {
                method: 'DELETE'
            })

            // 2. Mark room as available immediately
            await fetch(`/api/rooms/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'available' })
            })

            router.push('/rooms')
        } catch (error) {
            console.error('Error clearing room:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditClick = () => {
        if (!stay) return
        setEditForm({
            guest_name: stay.guest_name || '',
            phone: stay.phone || '',
            persons: stay.persons || 1
        })
        setIsEditModalOpen(true)
    }

    const handleUpdateStay = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/guest-stays/${stay.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            })

            if (res.ok) {
                const updatedStay = await res.json()
                setStay(prev => ({ ...prev, ...updatedStay }))
                setIsEditModalOpen(false)
                // Optionally refresh full data
                // fetchData() 
            }
        } catch (error) {
            console.error('Error updating stay:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const calculateRoomCharges = () => {
        if (!stay || !room) return 0
        const checkIn = new Date(stay.check_in_time)
        const now = new Date()
        const diffMs = now - checkIn
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
        const diffDays = Math.ceil(diffHours / 24)
        const dayRate = room.price_per_night || room.room_types?.base_price || 0
        // Simple day calculation (min 1 day)
        return Math.max(1, diffDays) * dayRate
    }

    const foodCharges = stay?.bills?.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0) || 0
    const roomCharges = calculateRoomCharges()
    const totalBill = roomCharges + foodCharges + (cart.reduce((sum, i) => sum + (i.price * i.quantity), 0))

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
            </div>
        )
    }

    return (
        <AuthGuard>
            <div className="flex h-screen bg-slate-50">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Navbar />
                    <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                        <div className="max-w-7xl mx-auto space-y-6">

                            {/* Top Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="icon" onClick={() => router.push('/rooms')} className="rounded-full bg-white shadow-sm border border-slate-100 hover:bg-slate-50">
                                        <ArrowLeft className="h-4 w-4 text-slate-600" />
                                    </Button>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                                                <h2 className="text-lg font-bold">{room?.room_number}</h2>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">{stay?.guest_name}</h1>
                                                    <Badge variant="outline" className="bg-slate-100 text-slate-900 border-slate-200 px-2 py-0 h-5 text-[10px] font-semibold uppercase">
                                                        Active
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                    <User className="h-3 w-3" />
                                                    <span>Guest Stay</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-slate-900 hover:bg-black text-white rounded-lg px-4 h-10 font-medium"
                                        onClick={() => router.push(`/billing/create?stayId=${stay?.id}&roomNumber=${room?.room_number}&roomId=${id}`)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Order
                                    </Button>

                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                                {/* Left Sidebar: Info & Bill */}
                                <div className="lg:col-span-4 space-y-6">

                                    {/* Professional Info Card */}
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase">Information</h3>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleEditClick}>
                                                <Pencil className="h-3.5 w-3.5 text-slate-500 cursor-pointer hover:text-orange-500" />
                                            </Button>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <Phone className="h-3.5 w-3.5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Phone</p>
                                                    <p className="text-sm font-medium text-slate-900">{stay?.phone}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <User className="h-3.5 w-3.5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Guests In Room</p>
                                                    <p className="text-sm font-medium text-slate-900">{stay?.persons || 0}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <Users className="h-3.5 w-3.5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Room Capacity</p>
                                                    <p className="text-sm font-medium text-slate-900">Max {room?.room_types?.capacity}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <Clock className="h-3.5 w-3.5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Check-in</p>
                                                    <p className="text-sm font-medium text-slate-900">{new Date(stay?.check_in_time).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Dashboard Card */}
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                                            <h3 className="text-xs font-semibold text-slate-500 uppercase">Billing Summary</h3>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-semibold text-slate-500">Room Rent</span>
                                                    <span className="text-sm font-bold text-slate-900">₹{roomCharges.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-sm font-semibold text-slate-500">Food & Services</span>
                                                    <span className="text-sm font-bold text-slate-900">₹{foodCharges.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-sm font-semibold text-emerald-600">Advance Paid</span>
                                                    <span className="text-sm font-bold text-emerald-700">- ₹{(stay?.paid_amount || 0).toFixed(2)}</span>
                                                </div>

                                                <div className="pt-4 border-t border-slate-100">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-900 uppercase">Remaining Balance</p>
                                                            <p className="text-3xl font-bold text-rose-600 leading-none">
                                                                ₹{Math.max(0, totalBill - (stay?.paid_amount || 0)).toFixed(2)}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 mt-1">Total Bill: ₹{totalBill.toFixed(2)}</p>
                                                        </div>
                                                        <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center">
                                                            <CreditCard className="h-5 w-5 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Button
                                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-12 rounded-lg"
                                                    onClick={handleCheckOut}
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
                                                    Checkout Guest
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium h-10 rounded-lg text-sm"
                                                    onClick={handleClearRoom}
                                                    disabled={isSubmitting}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Cancel / Clear Room
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Content: History */}
                                <div className="lg:col-span-8 flex flex-col gap-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <Utensils className="h-5 w-5 text-orange-500" />
                                            Service History
                                        </h3>
                                        <p className="text-xs text-slate-400 font-medium">{stay?.bills?.length || 0} Orders placed</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {stay?.bills?.length > 0 ? (
                                            stay.bills.map((bill, idx) => {
                                                const isExpanded = expandedBills[bill.id]
                                                return (
                                                    <div key={idx} className={cn(
                                                        "bg-white rounded-xl border border-slate-200 flex flex-col transition-all hover:border-slate-400 shadow-sm",
                                                        isExpanded ? "md:col-span-2 border-slate-900 shadow-md" : ""
                                                    )}>
                                                        <div
                                                            className="p-5 flex items-center justify-between cursor-pointer"
                                                            onClick={() => toggleBill(bill.id)}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                                    <Receipt className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-900">Order #{bill.bill_no}</p>
                                                                    <p className="text-xs text-slate-400">{new Date(bill.created_at).toLocaleTimeString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex items-center gap-4">
                                                                <div>
                                                                    <p className="text-base font-bold text-slate-900">₹{bill.total_amount}</p>
                                                                </div>
                                                                <div className="h-7 w-7 rounded-full hover:bg-slate-100 flex items-center justify-center">
                                                                    {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isExpanded && bill.bill_items && bill.bill_items.length > 0 && (
                                                            <div className="px-5 pb-5">
                                                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                                                        {bill.bill_items.map((item, iIdx) => (
                                                                            <div key={iIdx} className="flex justify-between items-center py-1 border-b border-white last:border-0">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[10px] text-slate-400 font-bold">{item.quantity}x</span>
                                                                                    <span className="text-sm text-slate-700">{item.item_name}</span>
                                                                                </div>
                                                                                <span className="text-sm font-semibold text-slate-900">₹{item.price * item.quantity}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="col-span-full py-20 bg-white rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                                <div className="h-16 w-16 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                                                    <Utensils className="h-8 w-8" />
                                                </div>
                                                <h4 className="text-slate-900 font-semibold">No orders yet</h4>
                                                <p className="text-slate-500 text-xs mt-1">Orders placed for this room will appear here.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Custom Checkout Confirmation Modal */}
            <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-xl rounded-xl">
                    <div className="bg-slate-900 p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                <LogOut className="h-5 w-5 text-slate-900" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Confirm Checkout</DialogTitle>
                                <p className="text-slate-400 text-xs mt-0.5">Final Settlement</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-6 bg-white">
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Are you sure you want to check out <span className="text-slate-900 font-semibold">{stay?.guest_name}</span>? This will finalize the bill and mark the room as ready for cleaning.
                            </p>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Total Bill</span>
                                    <span className="font-semibold text-slate-900">₹{totalBill.toFixed(2)}</span>
                                </div>
                                {(stay?.paid_amount || 0) > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-emerald-600">Advance Paid</span>
                                        <span className="font-semibold text-emerald-700">- ₹{stay.paid_amount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Remaining Payable</span>
                                    <span className="text-lg font-bold text-slate-900">₹{Math.max(0, totalBill - (stay?.paid_amount || 0)).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="h-11 rounded-lg border-slate-200 text-slate-500"
                                onClick={() => setIsCheckoutModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="h-11 rounded-lg bg-slate-900 hover:bg-black text-white font-medium"
                                onClick={confirmCheckOut}
                            >
                                Yes, Checkout
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Clear Room Confirmation Modal */}
            <Dialog open={isClearRoomModalOpen} onOpenChange={setIsClearRoomModalOpen}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-xl rounded-xl">
                    <div className="bg-rose-600 p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <Trash2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Clear Room</DialogTitle>
                                <p className="text-rose-100 text-xs mt-0.5">Cancel Stay & Make Available</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 space-y-6 bg-white">
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Are you sure you want to cancel this stay? The room will be immediately marked as <strong>Available</strong> and the current guest session will be cancelled.
                            </p>
                            <div className="p-4 bg-rose-50 rounded-lg border border-rose-100">
                                <p className="text-xs text-rose-800 font-medium">
                                    Warning: This action cannot be undone. Any unpaid bills associated with this stay should be voided manually if needed.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="h-11 rounded-lg border-slate-200 text-slate-500"
                                onClick={() => setIsClearRoomModalOpen(false)}
                            >
                                Keep Stay
                            </Button>
                            <Button
                                className="h-11 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium"
                                onClick={confirmClearRoom}
                            >
                                Yes, Clear Room
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Guest Details Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Guest Details</DialogTitle>
                        <DialogDescription>
                            Update the guest information for this stay.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateStay} className="space-y-4 py-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="edit-name">Guest Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.guest_name}
                                onChange={e => setEditForm({ ...editForm, guest_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="edit-phone">Phone Number</Label>
                            <Input
                                id="edit-phone"
                                value={editForm.phone}
                                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="edit-persons">Number of Persons</Label>
                            <Input
                                id="edit-persons"
                                type="number"
                                min="1"
                                value={editForm.persons}
                                onChange={e => setEditForm({ ...editForm, persons: parseInt(e.target.value) || 1 })}
                                required
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AuthGuard>
    )
}
