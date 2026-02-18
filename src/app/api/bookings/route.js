import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select(`
        *,
        rooms (
          room_number,
          room_types (name)
        )
      `)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json(bookings)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { data: booking, error } = await supabase
            .from('bookings')
            .insert([body])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(booking)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
