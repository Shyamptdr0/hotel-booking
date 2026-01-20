-- Add table relationships to bills
ALTER TABLE bills ADD COLUMN table_id UUID REFERENCES tables(id);
ALTER TABLE bills ADD COLUMN table_name TEXT;
ALTER TABLE bills ADD COLUMN section TEXT;
ALTER TABLE bills ADD COLUMN status TEXT NOT NULL DEFAULT 'running';

-- Create KOT (Kitchen Order Ticket) table
CREATE TABLE kots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kot_no SERIAL UNIQUE,
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id),
  table_name TEXT NOT NULL,
  section TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, printed, completed
  items JSONB NOT NULL, -- Store items as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing constraint if it exists (using proper PostgreSQL syntax)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tables_status_check' 
        AND conrelid = 'tables'::regclass
    ) THEN
        ALTER TABLE tables DROP CONSTRAINT tables_status_check;
    END IF;
END $$;

-- Add new constraint for tables status
ALTER TABLE tables ADD CONSTRAINT tables_status_check CHECK (status IN ('blank', 'running', 'printed', 'paid', 'running_kot'));

-- Create indexes for KOT
CREATE INDEX idx_kots_bill_id ON kots(bill_id);
CREATE INDEX idx_kots_table_id ON kots(table_id);
CREATE INDEX idx_kots_status ON kots(status);
CREATE INDEX idx_kots_created_at ON kots(created_at);

-- Enable RLS for KOT
ALTER TABLE kots ENABLE ROW LEVEL SECURITY;

-- Create policies for KOT
CREATE POLICY "Users can view all KOTs" ON kots FOR SELECT USING (true);
CREATE POLICY "Users can insert KOTs" ON kots FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update KOTs" ON kots FOR UPDATE USING (true);
CREATE POLICY "Users can delete KOTs" ON kots FOR DELETE USING (true);

-- Create trigger for updated_at on KOT
CREATE TRIGGER update_kots_updated_at BEFORE UPDATE ON kots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update table status when bill is created/updated
CREATE OR REPLACE FUNCTION update_table_status_on_bill()
RETURNS TRIGGER AS $$
BEGIN
  -- Update table status based on bill status
  IF TG_OP = 'INSERT' THEN
    UPDATE tables SET status = 'running' WHERE id = NEW.table_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      CASE NEW.status
        WHEN 'printed' THEN UPDATE tables SET status = 'printed' WHERE id = NEW.table_id;
        WHEN 'paid' THEN UPDATE tables SET status = 'blank' WHERE id = NEW.table_id;
        ELSE UPDATE tables SET status = 'running' WHERE id = NEW.table_id;
      END CASE;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE tables SET status = 'blank' WHERE id = OLD.table_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for table status updates
CREATE TRIGGER update_table_status_on_bill_change
  AFTER INSERT OR UPDATE OR DELETE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_table_status_on_bill();
