'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthGuard } from '@/components/auth-guard'
import { Sidebar } from '@/components/sidebar'
import { Navbar } from '@/components/navbar'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-100">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex h-full w-64 flex-col bg-gray-50 border-r flex-shrink-0">
          <Sidebar />
        </div>

        <div className="flex flex-1 flex-col min-w-0">
          <Navbar />

          <main className="flex-1 overflow-auto bg-white">
            <div className="flex items-center justify-center min-h-full p-4">
              <Card className="w-full max-w-md border-0 shadow-xl">
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Page Not Found
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-gray-600">
                    Oops! The page you're looking for doesn't exist or has been moved.
                  </p>
                  
                  <div className="space-y-3 pt-4">
                    <Button 
                      onClick={() => router.back()}
                      variant="outline"
                      className="w-full"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Go Back
                    </Button>
                    
                    <Button 
                      onClick={() => router.push('/dashboard')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Go to Dashboard
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-3">Quick Links:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push('/tables')}
                      >
                        Tables
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push('/billing')}
                      >
                        Billing
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push('/menu')}
                      >
                        Menu
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                      >
                        Dashboard
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
