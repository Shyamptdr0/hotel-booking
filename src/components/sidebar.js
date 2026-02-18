'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Utensils,
  CirclePlus,
  IndianRupee,
  History,
  LogOut,
  ChefHat,
  Settings,
  X,
  Table
} from 'lucide-react'

const hotelNavigation = [
  { name: 'Room Status', href: '/rooms', icon: Table },
  { name: 'Bookings', href: '/bookings', icon: History },
]

const restaurantNavigation = [
  { name: 'Restaurant Tables', href: '/tables', icon: Utensils },
  { name: 'Add Menu Item', href: '/menu/add', icon: CirclePlus },
  { name: 'Menu List', href: '/menu/list', icon: ChefHat },
  { name: 'Bill History', href: '/billing/history', icon: History },
]

const generalNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
]

export function Sidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'signout' }),
      })
    } catch (error) {
      console.error('Logout error:', error)
    }

    localStorage.removeItem('supabase_session')
    window.location.href = '/login'
  }

  const NavGroup = ({ title, items }) => (
    <div className="mb-6">
      <h3 className="px-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1 px-3">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm lg:text-base font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5 lg:h-6 lg:w-6" />
              {item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex h-20 items-center px-6 border-b mb-6">
        <div className="flex items-center space-x-3">
          <ChefHat className="h-10 w-10 text-orange-600" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 leading-tight">Moon Palace Hotel</span>
            <span className="text-xs font-medium text-orange-600 uppercase tracking-widest">Hotel & Restaurant</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <NavGroup title="General" items={generalNavigation} />
        <NavGroup title="Hotel Management" items={hotelNavigation} />
        <NavGroup title="Restaurant" items={restaurantNavigation} />
      </nav>

      <Separator className="mx-3" />

      <div className="p-3">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 py-3 text-sm lg:text-base font-medium"
        >
          <LogOut className="mr-3 h-5 w-5 lg:h-6 lg:w-6" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full w-64 flex-col bg-gray-50 border-r flex-shrink-0">
        <NavContent />
      </div>
    </>
  )
}
