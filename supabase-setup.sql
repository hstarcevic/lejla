-- Create timeline_entries table
CREATE TABLE IF NOT EXISTS timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create letters table
CREATE TABLE IF NOT EXISTS letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_opened BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create flowers table
CREATE TABLE IF NOT EXISTS flowers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  is_bloomed BOOLEAN DEFAULT FALSE,
  type TEXT NOT NULL CHECK (type IN ('rose', 'tulip', 'daisy', 'lily', 'sunflower')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_settings table (for password)
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE flowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since we're using password in app)
CREATE POLICY "Allow all operations on timeline_entries" ON timeline_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on letters" ON letters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on flowers" ON flowers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timeline_entries_date ON timeline_entries(date);
CREATE INDEX IF NOT EXISTS idx_letters_created_at ON letters(created_at);
CREATE INDEX IF NOT EXISTS idx_flowers_created_at ON flowers(created_at);
