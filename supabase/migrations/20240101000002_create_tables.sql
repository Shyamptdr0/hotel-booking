-- Create tables table
CREATE TABLE tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'Unassigned',
  status TEXT NOT NULL DEFAULT 'blank',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tables_section ON tables(section);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_created_at ON tables(created_at);

-- Enable Row Level Security
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Create policies for tables
CREATE POLICY "Users can view all tables" ON tables FOR SELECT USING (true);
CREATE POLICY "Users can insert tables" ON tables FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update tables" ON tables FOR UPDATE USING (true);
CREATE POLICY "Users can delete tables" ON tables FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
