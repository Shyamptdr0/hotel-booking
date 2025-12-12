'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChefHat, Utensils, Receipt, TrendingUp, ArrowRight } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const session = localStorage.getItem('supabase_session')
    if (session) {
      try {
        const parsedSession = JSON.parse(session)
        if (parsedSession.access_token) {
          router.push('/dashboard')
          return
        }
      } catch (error) {
        console.error('Session parse error:', error)
      }
    }
  }, [router])

  const features = [
    {
      icon: Receipt,
      title: 'Smart Billing',
      description: 'Create bills with automatic tax calculations and multiple payment options'
    },
    {
      icon: Utensils,
      title: 'Menu Management',
      description: 'Add, edit, and organize menu items with categories and pricing'
    },
    {
      icon: TrendingUp,
      title: 'Analytics Dashboard',
      description: 'Track sales, revenue, and business performance with real-time insights'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-bold text-gray-900">Restaurant POS</span>
            </div>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Restaurant Billing System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your restaurant operations with our modern POS system. 
            Manage billing, menu items, and track your business performance all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="flex items-center">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quick Demo Access
          </h2>
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              Try the demo with these credentials:
            </p>
            <div className="inline-block bg-gray-100 rounded-lg p-4 text-left">
              <p className="font-mono text-sm">Email: demo@restaurant.com</p>
              <p className="font-mono text-sm">Password: password</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button className="flex-1 sm:flex-none">
                Login to Dashboard
              </Button>
            </Link>
            <Link href="/billing/create">
              <Button variant="outline" className="flex-1 sm:flex-none">
                Try Billing Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 mt-16 border-t">
          <p className="text-gray-600">
            Built with Next.js, Tailwind CSS, and Supabase
          </p>
        </footer>
      </main>
    </div>
  )
}
