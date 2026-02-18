'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthGuard } from '@/components/auth-guard'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import {
    TrendingUp,
    Users,
    Bed,
    Utensils,
    DollarSign,
    Clock,
    Hotel,
    Calendar,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/dashboard')
            if (response.ok) {
                const result = await response.json()
                setData(result.data)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const StatCard = ({ title, value, icon: Icon, subValue, trend }) => (
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-slate-100 p-2">
                        <Icon className="h-5 w-5 text-slate-700" />
                    </div>
                    {trend && (
                        <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            {trend}
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <h3 className="text-lg sm:text-2xl font-bold text-slate-900">{value}</h3>
                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">{title}</p>
                    {subValue && <p className="text-[10px] sm:text-xs text-slate-400 mt-2">{subValue}</p>}
                </div>
            </CardContent>
        </Card>
    )

    const StatusBox = ({ count, label, colorClass }) => (
        <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <span className={cn("text-2xl font-bold mb-1", colorClass)}>{count}</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        </div>
    )

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center space-y-4 text-center">
                <div className="h-16 w-16 bg-black rounded-2xl flex items-center justify-center shadow-lg mb-2">
                    <span className="text-2xl font-black text-orange-500 italic">MP</span>
                </div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        </div>
    )

    return (
        <AuthGuard>
            <div className="flex h-screen bg-gray-50/50">
                <Sidebar />

                <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                    <Navbar />

                    <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                        <div className="max-w-7xl mx-auto space-y-8">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
                                    <p className="text-slate-500 mt-1">Welcome back to Moon Palace Hotel management.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-slate-900 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                                <StatCard
                                    title="Hotel & Room Service"
                                    value={`₹${data?.hotel?.todayRevenue?.toLocaleString() || 0}`}
                                    icon={Bed}
                                    subValue={`Rent: ₹${data?.hotel?.rentRevenue?.toLocaleString() || 0} | Food: ₹${data?.hotel?.roomServiceRevenue?.toLocaleString() || 0}`}
                                    trend="+8%"
                                />
                                <StatCard
                                    title="Restaurant Dining"
                                    value={`₹${data?.restaurant?.todayRevenue?.toLocaleString() || 0}`}
                                    icon={Utensils}
                                    subValue={`Table Orders: ${data?.restaurant?.todayOrders || 0}`}
                                    trend="+15%"
                                />
                                <StatCard
                                    title="Hotel Occupancy"
                                    value={`${data?.hotel?.occupancyRate || 0}%`}
                                    icon={Hotel}
                                    subValue={`${data?.hotel?.occupiedRooms || 0}/${data?.hotel?.totalRooms || 0} Rooms Active`}
                                />
                                <StatCard
                                    title="Avg Order Value"
                                    value={`₹${Math.round(data?.restaurant?.averageOrderValue || 0)}`}
                                    icon={DollarSign}
                                    subValue="Per Restaurant Table"
                                />
                                <StatCard
                                    title="Active Guests"
                                    value={data?.hotel?.currentGuests || 0}
                                    icon={Users}
                                    subValue={`${data?.hotel?.activeStays || 0} Active Stays`}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Hotel Operations */}
                                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
                                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-6">
                                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <Bed className="h-5 w-5 text-slate-500" />
                                            Hotel Status & Stays
                                        </CardTitle>
                                        <Link href="/rooms" className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center transition-colors">
                                            Manage Rooms <ChevronRight className="h-4 w-4 ml-1" />
                                        </Link>
                                    </CardHeader>
                                    <CardContent className="p-6 flex-1">
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <StatusBox
                                                count={data?.hotel?.availableRooms || 0}
                                                label="Available"
                                                colorClass="text-emerald-600"
                                            />
                                            <StatusBox
                                                count={data?.hotel?.occupiedRooms || 0}
                                                label="Occupied"
                                                colorClass="text-rose-600"
                                            />
                                            <StatusBox
                                                count={data?.hotel?.cleaningRooms || 0}
                                                label="Maintenance"
                                                colorClass="text-amber-600"
                                            />
                                            <StatusBox
                                                count={data?.hotel?.todayCheckIns || 0}
                                                label="Today's Checkins"
                                                colorClass="text-blue-600"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Restaurant Operations */}
                                <Card className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
                                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-6">
                                        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <Utensils className="h-5 w-5 text-slate-500" />
                                            Restaurant Status & Orders
                                        </CardTitle>
                                        <Link href="/billing/history" className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center transition-colors">
                                            Order History <ChevronRight className="h-4 w-4 ml-1" />
                                        </Link>
                                    </CardHeader>
                                    <CardContent className="p-6 flex-1">
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase">Today's Revenue</p>
                                                    <p className="text-xl font-bold text-slate-900">₹{data?.restaurant?.todayRevenue || 0}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase">Total Orders</p>
                                                    <p className="text-xl font-bold text-slate-900">{data?.restaurant?.todayOrders || 0}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 mb-3">Recent Restaurant Orders</h4>
                                                <div className="space-y-3">
                                                    {data?.restaurant?.recentBills?.slice(0, 3).map((bill, i) => (
                                                        <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                                            <div>
                                                                <span className="font-semibold text-slate-700">Order #{bill.bill_no}</span>
                                                                <span className="text-slate-400 text-xs ml-2">{new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <span className="font-medium text-slate-900">₹{bill.total_amount}</span>
                                                        </div>
                                                    ))}
                                                    {(!data?.restaurant?.recentBills || data?.restaurant?.recentBills.length === 0) && (
                                                        <p className="text-xs text-slate-400 italic">No orders yet today.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Bottom Support Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <Card className="lg:col-span-3 rounded-xl border border-slate-900 bg-slate-900 text-white shadow-lg overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Users className="h-48 w-48" />
                                    </div>
                                    <CardContent className="p-8 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Support System</h4>
                                            <h3 className="text-2xl font-bold mt-2 text-white">Need help with Hotel Management?</h3>
                                            <p className="text-sm text-slate-400 mt-2 max-w-xl">
                                                Our technical support team is available 24/7 to assist you with billing, room management, or restaurant configuration issues.
                                            </p>
                                        </div>
                                        <button className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-900 px-6 py-3 rounded-lg text-sm font-bold transition-colors shadow-lg">
                                            Contact Support
                                        </button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </AuthGuard>
    )
}
