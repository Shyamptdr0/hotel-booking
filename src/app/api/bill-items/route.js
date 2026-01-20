import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const { bill_id, items } = body

    if (!bill_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Bill ID and items are required' },
        { status: 400 }
      )
    }

    // Create bill items
    const billItems = items.map(item => ({
      bill_id,
      item_id: item.item_id,
      item_name: item.item_name,
      item_category: item.item_category,
      quantity: item.quantity,
      price: item.price,
      total: item.total
    }))

    const { data, error } = await supabase
      .from('bill_items')
      .insert(billItems)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Return proper JSON response
    return NextResponse.json({ 
      data: data || [], 
      error: null 
    })
  } catch (error) {
    console.error('Error adding bill items:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      status: 500 
    })
  }
}
