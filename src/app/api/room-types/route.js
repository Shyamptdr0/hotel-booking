import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const { data: types, error } = await supabase
            .from('room_types')
            .select('*')
            .order('name', { ascending: true })

        if (error) throw error

        return NextResponse.json(types)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
export async function POST(request) {
    try {
        const body = await request.json()
        const { data, error } = await supabase
            .from('room_types')
            .insert([body])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
