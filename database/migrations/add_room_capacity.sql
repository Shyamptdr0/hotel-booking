DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'capacity') THEN
        ALTER TABLE rooms ADD COLUMN capacity INTEGER DEFAULT 2;
    END IF;
END $$;
