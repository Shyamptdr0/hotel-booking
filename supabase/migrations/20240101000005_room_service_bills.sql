-- Add room service support to bills
ALTER TABLE bills ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id);

-- Update status check if needed
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bills_status_check' AND conrelid = 'bills'::regclass) THEN
        ALTER TABLE bills DROP CONSTRAINT bills_status_check;
    END IF;
END $$;

-- Policies for room_id and booking_id (RLS is already enabled)
-- The existing policies allow insertion/select for all users
