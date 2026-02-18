import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    try {
        const { id } = await params
        const { data: stay, error } = await supabase
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
            .eq('id', id)
            .single()

        if (error) throw error

        return NextResponse.json(stay)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request, { params }) {
    try {
        const { id } = await params
        const body = await request.json()
        const { data: stay, error } = await supabase
            .from('guest_stays')
            .update(body)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(stay)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params
        const { error } = await supabase
            .from('guest_stays')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
