-- Add GST columns to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sgst NUMERIC(5,2) DEFAULT 2.5;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS cgst NUMERIC(5,2) DEFAULT 2.5;

-- Update existing items to have default GST if they don't
UPDATE menu_items SET sgst = 2.5 WHERE sgst IS NULL;
UPDATE menu_items SET cgst = 2.5 WHERE cgst IS NULL;
