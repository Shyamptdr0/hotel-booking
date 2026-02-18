import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, email, password } = body

    if (action === 'signin') {
      // Check for Demo User credentials bypass
      if (email === process.env.DEMO_EMAIL && password === process.env.DEMO_PASSWORD) {
        return NextResponse.json({
          data: {
            user: {
              id: 'demo-user-123',
              email: email,
              role: 'authenticated'
            },
            session: {
              access_token: 'mock-demo-token',
              refresh_token: 'mock-refresh-token',
              user: {
                id: 'demo-user-123',
                email: email,
                role: 'authenticated'
              }
            }
          },
          error: null
        })
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return NextResponse.json(
          { data: null, error: error.message },
          { status: 401 }
        )
      }

      return NextResponse.json({
        data: data,
        error: null
      })
    } else if (action === 'signup') {
      // For now, signup via API is disabled or restricted if needed
      // But let's implement basic signup using supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return NextResponse.json(
          { data: null, error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({ data, error: null })

    } else if (action === 'signout') {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data: { success: true }, error: null })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}

