import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    const { id } = await params
    try {
        const { data, error } = await supabase
            .from('rooms')
            .select('*, room_types(*)')
            .eq('id', id)
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request, { params }) {
    const { id } = await params
    try {
        const body = await request.json()
        const { data, error } = await supabase
            .from('rooms')
            .update(body)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request, { params }) {
    const { id } = await params
    try {
        const body = await request.json()
        const { data, error } = await supabase
            .from('rooms')
            .update(body)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params
    try {
        // First delete associated bookings to satisfy foreign key constraint
        const { error: bookingError } = await supabase
            .from('bookings')
            .delete()
            .eq('room_id', id)

        if (bookingError) throw bookingError

        // Now delete the room
        const { error } = await supabase
            .from('rooms')
            .delete()
            .eq('id', id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
