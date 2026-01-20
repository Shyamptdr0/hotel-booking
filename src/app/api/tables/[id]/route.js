import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        'Connection': 'keep-alive'
      }
    }
  }
)

// Helper function for retry logic
async function withRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      // Check if it's a connection timeout error
      if (error.message?.includes('Connect Timeout Error') || 
          error.message?.includes('UND_ERR_CONNECT_TIMEOUT') ||
          error.message?.includes('fetch failed')) {
        
        if (attempt === maxRetries) {
          throw new Error('Database connection failed after multiple attempts. Please check your internet connection.')
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        continue
      }
      
      // For non-timeout errors, throw immediately
      throw error
    }
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, section, status } = body

    if (!name || !section) {
      return new Response(JSON.stringify({ error: 'Name and section are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('tables')
        .update({
          name,
          section,
          status: status || 'blank',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
    })

    if (error) {
      console.error('Supabase error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Table not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    // First check if there are any bills associated with this table
    const { data: bills, error: billsError } = await withRetry(async () => {
      return await supabase
        .from('bills')
        .select('id')
        .eq('table_id', id)
    })

    if (billsError) {
      console.error('Supabase error checking bills:', billsError)
      return new Response(JSON.stringify({ error: billsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // If there are bills, don't allow deletion
    if (bills && bills.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Cannot delete table with associated bills. Please settle or delete all bills first.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // If no bills, proceed with table deletion
    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('tables')
        .delete()
        .eq('id', id)
        .select()
        .single()
    })

    if (error) {
      console.error('Supabase error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Table not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: 'Table deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
