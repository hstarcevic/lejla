-- Migration: Add updated_at columns for incremental sync
-- Run this in Supabase SQL Editor

-- 1. Add updated_at column to all content tables
ALTER TABLE timeline_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE letters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE flowers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 2. Backfill existing rows: set updated_at = created_at
UPDATE timeline_entries SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE letters SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE flowers SET updated_at = created_at WHERE updated_at IS NULL;

-- 3. Make NOT NULL with default after backfill
ALTER TABLE timeline_entries ALTER COLUMN updated_at SET DEFAULT NOW(), ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE letters ALTER COLUMN updated_at SET DEFAULT NOW(), ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE flowers ALTER COLUMN updated_at SET DEFAULT NOW(), ALTER COLUMN updated_at SET NOT NULL;

-- 4. Auto-update trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach trigger to each table
CREATE TRIGGER set_updated_at_timeline
  BEFORE UPDATE ON timeline_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_letters
  BEFORE UPDATE ON letters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_flowers
  BEFORE UPDATE ON flowers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Indexes for efficient delta queries
CREATE INDEX IF NOT EXISTS idx_timeline_entries_updated_at ON timeline_entries(updated_at);
CREATE INDEX IF NOT EXISTS idx_letters_updated_at ON letters(updated_at);
CREATE INDEX IF NOT EXISTS idx_flowers_updated_at ON flowers(updated_at);
