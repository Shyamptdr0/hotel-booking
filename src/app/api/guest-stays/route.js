import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const roomId = searchParams.get('room_id')
        const status = searchParams.get('status')
        const id = searchParams.get('id')

        console.log('API Guest-Stays GET:', { id, roomId, status })

        let query = supabase
            .from('guest_stays')
            .select(`
                *,
                rooms (
                    room_number,
                    price_per_night,
                    room_types (name, base_price)
                ),
                bills (
                    *,
                    bill_items (*)
                )
            `)

        if (id) query = query.eq('id', id)
        if (roomId) query = query.eq('room_id', roomId)
        if (status) query = query.eq('status', status)

        // Remove default active filter to allow fetching history
        // if (!id && !roomId && !status) we return all

        const { data: stays, error } = await query.order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json(stays)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { data: stay, error } = await supabase
            .from('guest_stays')
            .insert([body])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(stay)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
