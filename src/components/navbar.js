'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LogOut, User, Clock, Menu, LayoutDashboard, Utensils, CirclePlus, IndianRupee, History, Settings, ChefHat, Table } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet.jsx'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const hotelNavigation = [
  { name: 'Room Status', href: '/rooms', icon: Table },
  { name: 'Bookings', href: '/bookings', icon: History },
]

const restaurantNavigation = [
  { name: 'Tables', href: '/tables', icon: Utensils },
  { name: 'Add Menu Item', href: '/menu/add', icon: CirclePlus },
  { name: 'Menu List', href: '/menu/list', icon: ChefHat },
  { name: 'Bill History', href: '/billing/history', icon: History },
]

const generalNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
]

export function Navbar() {
  const [user, setUser] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const pathname = usePathname()

  useEffect(() => {
    const getUser = () => {
      const session = localStorage.getItem('supabase_session')
      if (session) {
        try {
          const parsedSession = JSON.parse(session)
          setUser(parsedSession.user || { email: 'user@hotel.com' })
        } catch (error) {
          console.error('Session parse error:', error)
        }
      }
    }

    getUser()

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

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
    <div className="mb-4">
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
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )

  const MobileMenu = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex h-20 items-center px-6 border-b mb-4">
        <div className="flex items-center space-x-3">
          <ChefHat className="h-10 w-10 text-orange-600" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 leading-tight">Moon Palace Hotel</span>
            <span className="text-xs font-medium text-orange-600 uppercase tracking-widest">Hotel & Restaurant</span>
          </div>
        </div>
      </div>

      <nav className="flex-1">
        <NavGroup title="General" items={generalNavigation} />
        <NavGroup title="Hotel" items={hotelNavigation} />
        <NavGroup title="Restaurant" items={restaurantNavigation} />
      </nav>

      <Separator className="mx-3" />

      <div className="p-3">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-gray-900 py-3 text-sm font-medium"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center space-x-2 lg:space-x-4">
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white shadow-md h-10 w-10 p-0 flex items-center justify-center"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <MobileMenu />
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden sm:block text-sm text-gray-600 whitespace-nowrap">
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}
        </div>
        <div className="flex items-center text-sm text-gray-600 whitespace-nowrap">
          <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
            <span className="text-xs font-black text-orange-500 italic">MP</span>
          </div>
          <span className="hidden sm:inline text-sm font-black tracking-tighter text-slate-900 uppercase">Moon Palace Hotel</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 lg:space-x-4">
        <div className="hidden sm:flex items-center space-x-2 text-sm min-w-0">
          <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-700 truncate max-w-24 lg:max-w-none">
            {user?.email || 'Guest'}
          </span>
        </div>
        <Separator orientation="vertical" className="hidden sm:block h-6" />
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2 flex-shrink-0"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}
