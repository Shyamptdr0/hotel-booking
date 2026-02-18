/*
-- Seed data for menu_items
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

-- Seed data for tables
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
*/
