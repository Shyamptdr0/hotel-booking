import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentType = searchParams.get('payment_type')
    const dateFilter = searchParams.get('date_filter')

    let query = supabase.from('bills').select('*').order('created_at', { ascending: false })

    if (paymentType && paymentType !== 'all') {
      query = query.eq('payment_type', paymentType)
    }

    const { data, error } = await query

    if (error) throw error

    // Apply date filtering if needed
    let filteredData = data
    if (dateFilter && dateFilter !== 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      filteredData = data.filter(bill => {
        const billDate = new Date(bill.created_at)
        
        switch (dateFilter) {
          case 'today':
            return billDate >= today
          case 'week':
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return billDate >= weekAgo
          case 'month':
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return billDate >= monthAgo
          default:
            return true
        }
      })
    }

    return NextResponse.json({ data: filteredData, error: null })
  } catch (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { subtotal, tax_amount, total_amount, payment_type, items } = body

    if (!subtotal || !total_amount || !payment_type || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create bill (remove service_tax_amount as it doesn't exist in schema)
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        subtotal: parseFloat(subtotal),
        tax_amount: parseFloat(tax_amount) || 0,
        total_amount: parseFloat(total_amount),
        payment_type
      })
      .select()
      .single()

    if (billError) throw billError

    // Create bill items with snapshots
    const billItems = items.map(item => ({
      bill_id: bill.id,
      item_id: item.id,
      item_name: item.name, // Store item name as snapshot
      item_category: item.category, // Store item category as snapshot
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }))

    const { data: itemsData, error: itemsError } = await supabase
      .from('bill_items')
      .insert(billItems)
      .select()

    if (itemsError) throw itemsError

    return NextResponse.json({ 
      data: { ...bill, items: itemsData }, 
      error: null 
    })
  } catch (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, payment_type } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Bill ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('bills')
      .update({ payment_type })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data, error: null })
  } catch (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}
