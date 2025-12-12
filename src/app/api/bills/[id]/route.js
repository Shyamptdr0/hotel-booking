import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request, { params }) {
  try {
    const { id } = await params

    // Fetch bill details
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .single()

    if (billError) throw billError

    // Fetch bill items with menu item details
    const { data: items, error: itemsError } = await supabase
      .from('bill_items')
      .select(`
        *,
        menu_items (
          name,
          tax
        )
      `)
      .eq('bill_id', id)

    if (itemsError) throw itemsError

    return NextResponse.json({ 
      data: { ...bill, items: items || [] }, 
      error: null 
    })
  } catch (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}
