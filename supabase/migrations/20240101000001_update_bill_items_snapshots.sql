-- Migration to update bill_items table for item snapshots
-- This migration removes the foreign key constraint and adds snapshot fields

-- First, create a backup of existing bill_items
CREATE TABLE bill_items_backup AS SELECT * FROM bill_items;

-- Drop the existing bill_items table
DROP TABLE bill_items;

-- Recreate bill_items table with snapshot fields and no foreign key constraint
CREATE TABLE bill_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  item_id UUID, -- Remove foreign key constraint to allow menu item deletion
  item_name TEXT, -- Make temporarily nullable for migration
  item_category TEXT, -- Store item category as snapshot
  quantity INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL, -- Store price at time of billing
  total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restore data from backup (note: item_name and item_category will be NULL for existing records)
INSERT INTO bill_items (id, bill_id, item_id, quantity, price, total, created_at)
SELECT id, bill_id, item_id, quantity, price, total, created_at FROM bill_items_backup;

-- Update existing records to get item names and categories from menu_items where possible
UPDATE bill_items 
SET item_name = COALESCE(mi.name, 'Deleted Item'), 
    item_category = mi.category
FROM menu_items mi 
WHERE bill_items.item_id = mi.id AND bill_items.item_name IS NULL;

-- Update any remaining records that couldn't be linked to a menu item
UPDATE bill_items SET item_name = 'Deleted Item' WHERE item_name IS NULL;
UPDATE bill_items SET item_category = 'Others' WHERE item_category IS NULL;

-- Now make item_name NOT NULL for future records
ALTER TABLE bill_items ALTER COLUMN item_name SET NOT NULL;

-- Recreate indexes
CREATE INDEX idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX idx_bill_items_item_id ON bill_items(item_id);

-- Enable Row Level Security
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- Recreate policies for bill_items
DROP POLICY IF EXISTS "Users can view all bill items" ON bill_items;
CREATE POLICY "Users can view all bill items" ON bill_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert bill items" ON bill_items;
CREATE POLICY "Users can insert bill items" ON bill_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update bill items" ON bill_items;
CREATE POLICY "Users can update bill items" ON bill_items FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete bill items" ON bill_items;
CREATE POLICY "Users can delete bill items" ON bill_items FOR DELETE USING (true);

-- Drop the backup table
DROP TABLE bill_items_backup;
