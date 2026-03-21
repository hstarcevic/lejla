-- Migration: Enable Supabase Realtime on content tables
-- Run this in Supabase SQL Editor

-- Add tables to the realtime publication so INSERT/UPDATE/DELETE events are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE letters;
ALTER PUBLICATION supabase_realtime ADD TABLE flowers;
