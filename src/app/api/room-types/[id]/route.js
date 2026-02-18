import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
    const { id } = await params
    try {
        const { data, error } = await supabase
            .from('room_types')
            .select('*')
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
            .from('room_types')
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
        const { error } = await supabase
            .from('room_types')
            .delete()
            .eq('id', id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
