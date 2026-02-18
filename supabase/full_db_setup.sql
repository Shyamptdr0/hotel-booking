-- 1. Base Schema
-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  tax NUMERIC(5,2) NOT NULL DEFAULT 0,
  sgst NUMERIC(5,2) DEFAULT 2.5,
  cgst NUMERIC(5,2) DEFAULT 2.5,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_no SERIAL UNIQUE,
  subtotal NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bill_items table (Initial version)
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  item_id UUID,
  item_name TEXT NOT NULL,
  item_category TEXT,
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_status ON menu_items(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_item_id ON bill_items(item_id);

-- RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view all menu items" ON menu_items FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert menu items" ON menu_items FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update menu items" ON menu_items FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete menu items" ON menu_items FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view all bills" ON bills FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert bills" ON bills FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update bills" ON bills FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete bills" ON bills FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view all bill items" ON bill_items FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert bill items" ON bill_items FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update bill items" ON bill_items FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete bill items" ON bill_items FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 2. Update Bill Items (Migration 001)
-- Drop the existing bill_items table to recreate with correct structure
DROP TABLE IF EXISTS bill_items CASCADE;

CREATE TABLE bill_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  item_id UUID, 
  item_name TEXT, 
  item_category TEXT, 
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL, 
  total NUMERIC(10,2) NOT NULL, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies for new bill_items
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users can view all bill items" ON bill_items FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert bill items" ON bill_items FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update bill items" ON bill_items FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete bill items" ON bill_items FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 3. Create Tables Table (Migration 002)
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'Unassigned',
  status TEXT NOT NULL DEFAULT 'blank',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tables_section ON tables(section);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_created_at ON tables(created_at);

ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users can view all tables" ON tables FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert tables" ON tables FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update tables" ON tables FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete tables" ON tables FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_tables_updated_at ON tables;
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 4. Restaurant Workflow (Migration 003)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES tables(id);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS table_name TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'running';

CREATE TABLE IF NOT EXISTS kots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kot_no SERIAL UNIQUE,
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id),
  table_name TEXT NOT NULL,
  section TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraints
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tables_status_check' AND conrelid = 'tables'::regclass) THEN
        ALTER TABLE tables DROP CONSTRAINT tables_status_check;
    END IF;
END $$;
ALTER TABLE tables ADD CONSTRAINT tables_status_check CHECK (status IN ('blank', 'running', 'printed', 'paid', 'running_kot'));

-- Indexes for KOT
CREATE INDEX IF NOT EXISTS idx_kots_bill_id ON kots(bill_id);
CREATE INDEX IF NOT EXISTS idx_kots_table_id ON kots(table_id);
CREATE INDEX IF NOT EXISTS idx_kots_status ON kots(status);
CREATE INDEX IF NOT EXISTS idx_kots_created_at ON kots(created_at);

ALTER TABLE kots ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Users can view all KOTs" ON kots FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can insert KOTs" ON kots FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can update KOTs" ON kots FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Users can delete KOTs" ON kots FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_kots_updated_at ON kots;
CREATE TRIGGER update_kots_updated_at BEFORE UPDATE ON kots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_table_status_on_bill()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS update_table_status_on_bill_change ON bills;
CREATE TRIGGER update_table_status_on_bill_change
  AFTER INSERT OR UPDATE OR DELETE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_table_status_on_bill();


-- 5. Seed Data
INSERT INTO menu_items (name, category, price, tax, status) VALUES
('Chicken Biryani', 'Main Course', 250.00, 5.00, 'active'),
('Paneer Butter Masala', 'Main Course', 220.00, 5.00, 'active'),
('Butter Naan', 'Breads', 40.00, 5.00, 'active'),
('Tandoori Roti', 'Breads', 30.00, 5.00, 'active'),
('Veg Fried Rice', 'Chinese', 180.00, 5.00, 'active'),
('Chicken Manchurian', 'Chinese', 200.00, 5.00, 'active'),
('Coca Cola', 'Beverages', 40.00, 18.00, 'active'),
('Mineral Water', 'Beverages', 20.00, 18.00, 'active')
ON CONFLICT DO NOTHING;

INSERT INTO tables (name, section, status) VALUES
('T1', 'AC', 'blank'),
('T2', 'AC', 'blank'),
('T3', 'AC', 'blank'),
('T4', 'AC', 'blank'),
('O1', 'Outdoor', 'blank'),
('O2', 'Outdoor', 'blank'),
('O3', 'Outdoor', 'blank'),
('O4', 'Outdoor', 'blank')
ON CONFLICT DO NOTHING;
