-- Create GuestStay table
CREATE TABLE IF NOT EXISTS guest_stays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  persons INTEGER DEFAULT 1,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  total_amount NUMERIC(10,2) DEFAULT 0,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE guest_stays ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE guest_stays ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE guest_stays ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add stay_id to bills (which will act as our Orders)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS stay_id UUID REFERENCES guest_stays(id) ON DELETE CASCADE;

-- Ensure rooms status matches requirements
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rooms_status_check' AND conrelid = 'rooms'::regclass) THEN
        ALTER TABLE rooms DROP CONSTRAINT rooms_status_check;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rooms_status_check' AND conrelid = 'rooms'::regclass) THEN
        ALTER TABLE rooms ADD CONSTRAINT rooms_status_check CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance'));
    END IF;
END $$;

-- Enable RLS for guest_stays
ALTER TABLE guest_stays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all guest_stays" ON guest_stays;
CREATE POLICY "Users can view all guest_stays" ON guest_stays FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert guest_stays" ON guest_stays;
CREATE POLICY "Users can insert guest_stays" ON guest_stays FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update guest_stays" ON guest_stays;
CREATE POLICY "Users can update guest_stays" ON guest_stays FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete guest_stays" ON guest_stays;
CREATE POLICY "Users can delete guest_stays" ON guest_stays FOR DELETE USING (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_guest_stays_updated_at ON guest_stays;
CREATE TRIGGER update_guest_stays_updated_at BEFORE UPDATE ON guest_stays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
