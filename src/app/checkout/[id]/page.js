'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Printer, ArrowLeft, Building2, User, Calendar, Home, CreditCard, Receipt, Hash } from 'lucide-react'
import { AuthGuard } from '@/components/auth-guard'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { cn } from '@/lib/utils'

export default function CheckoutInvoicePage({ params }) {
    const { id } = use(params)
    const router = useRouter()
    const [stay, setStay] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStayDetails()
    }, [id])

    const fetchStayDetails = async () => {
        try {
            setLoading(true)
            console.log('Fetching stay details for ID:', id)
            // Use the direct singular endpoint
            const res = await fetch(`/api/guest-stays/${id}`)
            if (res.ok) {
                const data = await res.json()
                console.log('Stay data received:', data)
                if (data && !data.error) {
                    setStay(data)
                } else {
                    console.error('No stay record found for this ID')
                }
            } else {
                console.error('Fetch failed with status:', res.status)
            }
        } catch (error) {
            console.error('Error fetching stay details:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateRoomCharges = () => {
        if (!stay || !stay.rooms) return { days: 0, rate: 0, total: 0 }
        const checkIn = new Date(stay.check_in_time)
        const checkOut = stay.status === 'completed' ? new Date(stay.check_out_time) : new Date()
        const diffMs = checkOut - checkIn
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
        const diffDays = Math.max(1, Math.ceil(diffHours / 24))
        const dayRate = stay.rooms.price_per_night || stay.rooms.room_types?.base_price || 0
        return {
            days: diffDays,
            rate: dayRate,
            total: diffDays * dayRate
        }
    }

    const roomChargeDetails = calculateRoomCharges()
    const foodCharges = stay?.bills?.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0) || 0
    const totalPayable = roomChargeDetails.total + foodCharges

    // Flatten and aggregate food items from all bills
    const rawFoodItems = stay?.bills?.flatMap(bill =>
        bill.bill_items?.map(item => ({
            ...item,
            price: parseFloat(item.price),
            quantity: parseFloat(item.quantity)
        }))
    ) || []

    const allFoodItems = Object.values(rawFoodItems.reduce((acc, item) => {
        // Group by item name and price to merge identical items
        const key = `${item.item_name}-${item.price}`
        if (!acc[key]) {
            acc[key] = {
                ...item,
                quantity: 0
            }
        }
        acc[key].quantity += item.quantity
        return acc
    }, {}))

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        )
    }

    if (!stay) {
        return (
            <div className="flex flex-col h-screen items-center justify-center gap-4">
                <p className="text-slate-500 font-bold">Stay record not found.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <AuthGuard>
            <div className="flex h-screen bg-slate-50 overflow-hidden">
                <div className="no-print w-64 h-full border-r bg-white shrink-0">
                    <Sidebar />
                </div>

                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="no-print">
                        <Navbar />
                    </div>

                    <main className="flex-1 overflow-y-auto p-4 lg:p-10">
                        {/* Action Bar */}
                        <div className="no-print max-w-4xl mx-auto flex items-center justify-between mb-8">
                            <Button
                                variant="ghost"
                                className="font-bold text-slate-500 hover:text-black"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <div className="flex gap-3">
                                <Button
                                    className="bg-slate-900 hover:bg-black text-white font-medium rounded-lg px-6 h-10 transition-all"
                                    onClick={handlePrint}
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Invoice
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-slate-200 font-medium rounded-lg"
                                    onClick={() => router.push('/rooms')}
                                >
                                    Inventory
                                </Button>
                            </div>
                        </div>

                        {/* POS 80mm Thermal Receipt Template */}
                        <div className="invoice-container bg-white p-2 mx-auto shadow-sm border border-gray-200 flex flex-col" style={{ width: '80mm', minHeight: 'fit-content' }}>

                            {/* Header */}
                            <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-2">
                                <h1 className="text-xl font-bold text-black uppercase">MOON PALACE</h1>
                                <p className="text-xs font-bold text-gray-600">HOTEL & RESTAURANT</p>
                            </div>

                            {/* Info */}
                            <div className="text-[10px] text-black mb-2 space-y-0.5 border-b-2 border-dashed border-gray-400 pb-2">
                                <div className="flex justify-between">
                                    <span>Invoice No:</span>
                                    <span className="font-bold">#{stay.id.slice(0, 8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Date:</span>
                                    <span>{new Date().toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Guest:</span>
                                    <span className="font-bold">{stay.guest_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Room:</span>
                                    <span>{stay.rooms?.room_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Check In:</span>
                                    <span>{new Date(stay.check_in_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Check Out:</span>
                                    <span>{stay.check_out_time ? new Date(stay.check_out_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Active'}</span>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="border-b-2 border-dashed border-gray-400 pb-2 mb-2">
                                <table className="w-full text-[10px] text-black">
                                    <thead>
                                        <tr className="border-b border-gray-400 border-dashed">
                                            <th className="text-left font-bold py-1">Item</th>
                                            <th className="text-center font-bold py-1 w-8">Qty</th>
                                            <th className="text-right font-bold py-1 w-12">Amt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dashed divide-gray-200">
                                        {/* Room Rent */}
                                        <tr>
                                            <td className="py-1 align-top">
                                                <div className="font-semibold">Room Charges</div>
                                                <div className="text-[9px] text-gray-500">Days: {roomChargeDetails.days} x {roomChargeDetails.rate}</div>
                                            </td>
                                            <td className="text-center py-1 align-top">{roomChargeDetails.days}</td>
                                            <td className="text-right py-1 align-top">{roomChargeDetails.total.toFixed(0)}</td>
                                        </tr>

                                        {/* Food Items */}
                                        {allFoodItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="py-1 align-top">
                                                    <div>{item.item_name}</div>
                                                </td>
                                                <td className="text-center py-1 align-top">{item.quantity}</td>
                                                <td className="text-right py-1 align-top">{(item.price * item.quantity).toFixed(0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="flex flex-col items-end text-[10px] border-b-2 border-dashed border-gray-400 pb-2 mb-2 space-y-1">
                                <div className="flex justify-between w-full">
                                    <span>Subtotal:</span>
                                    <span className="font-bold">₹{totalPayable.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between w-full">
                                    <span>GST:</span>
                                    <span>₹0.00</span>
                                </div>
                                <div className="flex justify-between w-full text-base font-bold text-black border-t border-dashed border-gray-400 pt-1 mt-1">
                                    <span>Total:</span>
                                    <span>₹{totalPayable.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center text-[9px] text-gray-500">
                                <p>Thank you for visiting!<br />Please come again.</p>
                                <p className="mt-2 text-[8px] uppercase">Powered by HotelSoft</p>
                            </div>

                        </div>
                    </main>
                </div>

                <style jsx global>{`
                    @media print {
                        @page {
                            margin: 0;
                            size: 80mm auto; 
                        }
                        body * {
                            visibility: hidden;
                        }
                        .invoice-container, .invoice-container * {
                            visibility: visible;
                        }
                        .invoice-container {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 80mm !important;
                            margin: 0 !important;
                            padding: 5mm !important;
                            border: none !important;
                            box-shadow: none !important;
                            background: white;
                        }
                        html, body {
                            width: 80mm;
                            height: auto !important;
                            overflow: visible !important;
                            background: white !important;
                        }
                    }
                `}</style>
            </div>
        </AuthGuard>
    )
}
