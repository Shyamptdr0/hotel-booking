-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
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

-- Create bill_items table
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  item_id UUID, -- Remove foreign key constraint to allow menu item deletion
  item_name TEXT NOT NULL, -- Store item name as snapshot
  item_category TEXT, -- Store item category as snapshot
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL, -- Store price at time of billing
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_status ON menu_items(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_item_id ON bill_items(item_id);

-- Enable Row Level Security
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- Create policies for menu_items
DROP POLICY IF EXISTS "Users can view all menu items" ON menu_items;
CREATE POLICY "Users can view all menu items" ON menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert menu items" ON menu_items;
CREATE POLICY "Users can insert menu items" ON menu_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update menu items" ON menu_items;
CREATE POLICY "Users can update menu items" ON menu_items FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete menu items" ON menu_items;
CREATE POLICY "Users can delete menu items" ON menu_items FOR DELETE USING (true);

-- Create policies for bills
DROP POLICY IF EXISTS "Users can view all bills" ON bills;
CREATE POLICY "Users can view all bills" ON bills FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert bills" ON bills;
CREATE POLICY "Users can insert bills" ON bills FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update bills" ON bills;
CREATE POLICY "Users can update bills" ON bills FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete bills" ON bills;
CREATE POLICY "Users can delete bills" ON bills FOR DELETE USING (true);

-- Create policies for bill_items
DROP POLICY IF EXISTS "Users can view all bill items" ON bill_items;
CREATE POLICY "Users can view all bill items" ON bill_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert bill items" ON bill_items;
CREATE POLICY "Users can insert bill items" ON bill_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update bill items" ON bill_items;
CREATE POLICY "Users can update bill items" ON bill_items FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete bill items" ON bill_items;
CREATE POLICY "Users can delete bill items" ON bill_items FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
