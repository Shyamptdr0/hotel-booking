'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const session = localStorage.getItem('supabase_session')

      if (!session) {
        router.push('/login')
        return
      }

      try {
        const parsedSession = JSON.parse(session)
        if (parsedSession.access_token) {
          setAuthenticated(true)
        } else {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="h-16 w-16 bg-black rounded-[1.5rem] flex items-center justify-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-transparent"></div>
            <span className="text-2xl font-black text-orange-500 italic relative z-10">MP</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-b-black"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing System</p>
          </div>
        </div>
      </div>
    )
  }

  return authenticated ? children : null
}
