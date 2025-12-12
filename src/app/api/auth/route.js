import { NextResponse } from 'next/server'

// Mock authentication for development
const MOCK_USERS = {
  [process.env.DEMO_EMAIL]: {
    email: process.env.DEMO_EMAIL,
    password: process.env.DEMO_PASSWORD,
    name: process.env.DEMO_USER_NAME,
    session: {
      access_token: 'mock-access-token-demo',
      refresh_token: 'mock-refresh-token-demo',
      user: {
        id: 'demo-user-id',
        email: process.env.DEMO_EMAIL,
        name: process.env.DEMO_USER_NAME
      }
    }
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, email, password } = body

    if (action === 'signin') {
      // Check if it's the demo user
      if (email === process.env.DEMO_EMAIL && password === process.env.DEMO_PASSWORD) {
        return NextResponse.json({ 
          data: MOCK_USERS[process.env.DEMO_EMAIL], 
          error: null 
        })
      }
      
      return NextResponse.json(
        { data: null, error: 'Invalid login credentials' },
        { status: 401 }
      )
    } else if (action === 'signup') {
      return NextResponse.json(
        { data: null, error: 'Signup not available in demo mode' },
        { status: 400 }
      )
    } else if (action === 'signout') {
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (token === 'mock-access-token-demo') {
      return NextResponse.json({ 
        data: MOCK_USERS[process.env.DEMO_EMAIL].session.user, 
        error: null 
      })
    }

    return NextResponse.json(
      { data: null, error: 'Invalid token' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}
