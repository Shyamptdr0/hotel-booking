import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // 1. Fetch Rooms
        const { data: rooms, error: roomsError } = await supabase
            .from('rooms')
            .select(`
                *,
                room_types (
                    name,
                    base_price,
                    capacity
                )
            `)
            .order('room_number', { ascending: true })

        if (roomsError) throw roomsError

        // 2. Try to fetch active stays (graceful fallback if table doesn't exist yet)
        let stays = []
        try {
            const { data: staysData, error: staysError } = await supabase
                .from('guest_stays')
                .select('*, bills(total_amount)')
                .eq('status', 'active')

            if (!staysError) {
                stays = staysData
            }
        } catch (e) {
            console.warn('guest_stays table might be missing. Run npm run migrate.')
        }

        // 3. Map stays to rooms
        const processedRooms = rooms.map(room => ({
            ...room,
            active_stay: stays?.find(s => s.room_id === room.id) || null
        }))

        return NextResponse.json(processedRooms)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const { data: room, error } = await supabase
            .from('rooms')
            .insert([body])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(room)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
