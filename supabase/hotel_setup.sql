-- Hotel Management Schema

-- 1. Create room_types table
CREATE TABLE IF NOT EXISTS room_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- e.g., 'Single', 'Double', 'Suite', 'Deluxe'
  description TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  amenities TEXT[], -- e.g., ['AC', 'TV', 'WiFi']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL UNIQUE,
  type_id UUID REFERENCES room_types(id),
  floor TEXT,
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'occupied', 'cleaning', 'maintenance', 'booked'
  price_per_night NUMERIC(10,2), -- Override base_price if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_no SERIAL UNIQUE,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT NOT NULL,
  guest_id_proof TEXT, -- Type of ID
  guest_id_number TEXT, -- ID Number
  room_id UUID REFERENCES rooms(id),
  check_in_date TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_date TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_check_in TIMESTAMP WITH TIME ZONE,
  actual_check_out TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'checked_in', 'checked_out', 'cancelled'
  total_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'partial', 'paid'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);

-- 5. RLS
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Users can view all room_types" ON room_types FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert room_types" ON room_types FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update room_types" ON room_types FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete room_types" ON room_types FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "Users can view all rooms" ON rooms FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert rooms" ON rooms FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update rooms" ON rooms FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete rooms" ON rooms FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "Users can view all bookings" ON bookings FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert bookings" ON bookings FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update bookings" ON bookings FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete bookings" ON bookings FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Triggers
DROP TRIGGER IF EXISTS update_room_types_updated_at ON room_types;
CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON room_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Seed Data
/*
INSERT INTO room_types (name, description, base_price, capacity, amenities) VALUES
('Standard Single', 'A cozy room for one person.', 1200.00, 1, ARRAY['WiFi', 'TV', 'AC']),
('Standard Double', 'Comfortable room for two people.', 1800.00, 2, ARRAY['WiFi', 'TV', 'AC', 'Mini Fridge']),
('Deluxe Suite', 'Spacious suite with living area.', 3500.00, 3, ARRAY['WiFi', 'TV', 'AC', 'Mini Fridge', 'Kitchenette'])
ON CONFLICT (name) DO NOTHING;

-- Map room types to rooms
INSERT INTO rooms (room_number, type_id, floor, status, price_per_night)
SELECT '101', id, '1st', 'available', 1200.00 FROM room_types WHERE name = 'Standard Single' UNION ALL
SELECT '102', id, '1st', 'available', 1200.00 FROM room_types WHERE name = 'Standard Single' UNION ALL
SELECT '201', id, '2nd', 'available', 1800.00 FROM room_types WHERE name = 'Standard Double' UNION ALL
SELECT '202', id, '2nd', 'available', 1800.00 FROM room_types WHERE name = 'Standard Double' UNION ALL
SELECT '301', id, '3rd', 'available', 3500.00 FROM room_types WHERE name = 'Deluxe Suite'
ON CONFLICT (room_number) DO NOTHING;
*/
