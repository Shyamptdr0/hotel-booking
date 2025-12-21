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
          tax,
          sgst,
          cgst
        )
      `)
      .eq('bill_id', id)

    if (itemsError) throw itemsError

    // Calculate SGST and CGST for each item
    const itemsWithTaxes = (items || []).map(item => {
      const itemTotal = item.price * item.quantity;
      const sgstRate = item.menu_items?.sgst || 0;
      const cgstRate = item.menu_items?.cgst || 0;
      const sgstAmount = itemTotal * (sgstRate / 100);
      const cgstAmount = itemTotal * (cgstRate / 100);
      
      return {
        ...item,
        sgst_amount: sgstAmount,
        cgst_amount: cgstAmount,
        total_tax: sgstAmount + cgstAmount,
        total_amount: itemTotal + sgstAmount + cgstAmount
      };
    });

    return NextResponse.json({ 
      data: { 
        ...bill, 
        items: itemsWithTaxes,
        total_sgst: itemsWithTaxes.reduce((sum, item) => sum + (item.sgst_amount || 0), 0),
        total_cgst: itemsWithTaxes.reduce((sum, item) => sum + (item.cgst_amount || 0), 0)
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
