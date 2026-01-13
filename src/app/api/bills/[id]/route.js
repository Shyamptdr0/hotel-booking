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

    // Fetch bill items using stored snapshot data
    const { data: items, error: itemsError } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', id)

    if (itemsError) throw itemsError

    // Calculate SGST and CGST for each item using bill data directly
    const itemsWithTaxes = (items || []).map(item => {
      const itemTotal = item.price * item.quantity;
      // Use default GST rates since menu item might be inactive
      const sgstAmount = itemTotal * 0.025; // 2.5% of item total
      const cgstAmount = itemTotal * 0.025; // 2.5% of item total
      
      return {
        ...item,
        name: item.item_name || `Item ${item.id}`,
        sgst_amount: sgstAmount,
        cgst_amount: cgstAmount,
        total_tax: sgstAmount + cgstAmount,
        total_amount: itemTotal + sgstAmount + cgstAmount
      };
    });

    // Calculate SGST and CGST amounts from subtotal (since they're not stored in DB)
    const subtotal = bill.subtotal || 0;
    const totalSgst = subtotal * 0.025; // 2.5% of subtotal
    const totalCgst = subtotal * 0.025; // 2.5% of subtotal

    return NextResponse.json({ 
      data: { 
        ...bill, 
        items: itemsWithTaxes,
        total_sgst: totalSgst,
        total_cgst: totalCgst
      }, 
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
