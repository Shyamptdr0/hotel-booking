import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get today's bills
    const { data: todayBills, error: todayError } = await supabase
      .from('bills')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    if (todayError) throw todayError

    // Get weekly sales data
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: weeklyBills, error: weeklyError } = await supabase
      .from('bills')
      .select('*')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: true })

    if (weeklyError) throw weeklyError

    // Calculate weekly sales by day
    const weeklySales = []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date()
      dayDate.setDate(dayDate.getDate() - (6 - i))
      dayDate.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayDate)
      dayEnd.setHours(23, 59, 59, 999)

      const dayBills = weeklyBills.filter(bill => {
        const billDate = new Date(bill.created_at)
        return billDate >= dayDate && billDate <= dayEnd
      })

      const daySales = dayBills.reduce((sum, bill) => sum + parseFloat(bill.subtotal || 0), 0)

      weeklySales.push({
        day: days[dayDate.getDay()],
        sales: daySales
      })
    }

    // Get total menu items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')

    if (menuError) throw menuError

    // Get recent bills
    const { data: recentBills, error: recentError } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) throw recentError

    // Calculate today's sales and bills
    const todaySales = todayBills.reduce((sum, bill) => sum + parseFloat(bill.subtotal || 0), 0)
    const todayBillsCount = todayBills.length

    // Get monthly revenue
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const { data: monthlyBills, error: monthlyError } = await supabase
      .from('bills')
      .select('subtotal')
      .gte('created_at', monthAgo.toISOString())

    if (monthlyError) throw monthlyError

    const monthlyRevenue = monthlyBills.reduce((sum, bill) => sum + parseFloat(bill.subtotal || 0), 0)

    // Calculate average order value
    const averageOrderValue = todayBillsCount > 0 ? todaySales / todayBillsCount : 0

    // Get payment statistics
    const paymentStats = todayBills.reduce((stats, bill) => {
      const paymentType = bill.payment_type.toLowerCase()
      stats[paymentType] = (stats[paymentType] || 0) + 1
      return stats
    }, {})

    const totalPayments = Object.values(paymentStats).reduce((sum, count) => sum + count, 0)
    const paymentPercentages = Object.keys(paymentStats).reduce((percentages, type) => {
      percentages[type] = totalPayments > 0 ? Math.round((paymentStats[type] / totalPayments) * 100) : 0
      return percentages
    }, {})

    // Get Room stats
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')

    if (roomsError) throw roomsError

    const totalRooms = rooms.length
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length
    const availableRooms = rooms.filter(r => r.status === 'available').length
    const cleaningRooms = rooms.filter(r => r.status === 'cleaning').length
    const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length

    // Get today's bookings
    const { data: todayBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .gte('check_in_date', today.toISOString())

    if (bookingsError) throw bookingsError

    // Get active guest stays for hotel stats
    const { data: activeStays, error: staysError } = await supabase
      .from('guest_stays')
      .select('*, rooms(id, price_per_night, room_types(id, base_price))')
      .eq('status', 'active')

    if (staysError) throw staysError

    // Split bills into Restaurant (Table) and Room Service
    const restaurantBills = todayBills.filter(bill => bill.table_id)
    const roomBills = todayBills.filter(bill => !bill.table_id) // Assumes if not table, it's room/direct

    const restaurantBillRevenue = restaurantBills.reduce((sum, bill) => sum + parseFloat(bill.subtotal || 0), 0)
    const roomBillRevenue = roomBills.reduce((sum, bill) => sum + parseFloat(bill.subtotal || 0), 0)

    // Get completed stays for today (checked out today) with their linked bills
    const { data: completedStays, error: completedStaysError } = await supabase
      .from('guest_stays')
      .select('total_amount, check_out_time, bills(total_amount)')
      .eq('status', 'completed')
      .gte('check_out_time', today.toISOString())

    if (completedStaysError) throw completedStaysError

    // Calculate ONLY Rent revenue from completed stays
    // Assumption: stay.total_amount includes Room Rent + Food Bills.
    // We subtract the food bills to isolate the rent.
    const completedStaysRentOnly = completedStays.reduce((sum, stay) => {
      const totalStayAmount = parseFloat(stay.total_amount || 0)

      // Sum up all bills linked to this stay (Food/Services)
      const stayFoodBills = stay.bills?.reduce((bSum, bill) => bSum + parseFloat(bill.total_amount || 0), 0) || 0

      const rentPortion = Math.max(0, totalStayAmount - stayFoodBills)
      return sum + rentPortion
    }, 0)

    // Calculate Hotel Daily Revenue (Room Rent from active stays)
    // For active stays, we calculate the daily run rate (1 night's price)
    const hotelActiveDailyRevenue = activeStays.reduce((sum, stay) => {
      const room = stay.rooms
      if (!room) return sum

      let rate = room.price_per_night

      // If no override price, check room type base price (handle array or object)
      if (!rate) {
        const type = Array.isArray(room.room_types) ? room.room_types[0] : room.room_types
        rate = type?.base_price
      }

      return sum + (parseFloat(rate) || 0)
    }, 0)

    // Total Rent Revenue = Revenue from completed stays (Rent only) + projected daily revenue from active stays
    const hotelDailyRentRevenue = completedStaysRentOnly + hotelActiveDailyRevenue

    const totalGuests = activeStays.reduce((sum, stay) => sum + (stay.persons || 1), 0)

    const dashboardData = {
      totalRevenue: restaurantBillRevenue + roomBillRevenue + hotelDailyRentRevenue,
      restaurant: {
        todayRevenue: restaurantBillRevenue,
        todayOrders: restaurantBills.length,
        averageOrderValue: restaurantBills.length > 0 ? restaurantBillRevenue / restaurantBills.length : 0,
        activeMenuItems: menuItems.filter(item => item.status === 'active').length,
        totalMenuItems: menuItems.length,
        recentBills: restaurantBills.slice(0, 5) // Only show restaurant bills in restaurant card
      },
      hotel: {
        totalRooms,
        occupiedRooms,
        availableRooms,
        cleaningRooms,
        maintenanceRooms,
        todayCheckIns: todayBookings.length,
        activeStays: activeStays.length,
        currentGuests: totalGuests,
        todayRevenue: hotelDailyRentRevenue + roomBillRevenue, // Rent + Room Service
        roomServiceRevenue: roomBillRevenue,
        rentRevenue: hotelDailyRentRevenue,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
      },
      monthlyRevenue,
      weeklySales,
      paymentStats: paymentPercentages // Added useful stats
    }

    return NextResponse.json({ data: dashboardData, error: null })
  } catch (error) {
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}
