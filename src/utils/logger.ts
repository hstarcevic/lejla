import { supabase } from '../lib/supabase';

type LogLevel = 'info' | 'error';

interface LogEntry {
  level: LogLevel;
  action: string;
  message?: string;
  details?: Record<string, unknown>;
}

const queue: LogEntry[] = [];
let flushing = false;

async function flush() {
  if (flushing || queue.length === 0) return;
  flushing = true;

  const batch = queue.splice(0, queue.length);
  try {
    await supabase.from('app_logs').insert(
      batch.map((entry) => ({
        level: entry.level,
        action: entry.action,
        message: entry.message || null,
        details: entry.details || null,
      }))
    );
  } catch {
    // If logging itself fails, don't crash the app
  }
  flushing = false;
}

function log(entry: LogEntry) {
  queue.push(entry);
  // Debounce: flush after a short delay to batch nearby logs
  setTimeout(flush, 500);
}

export const logger = {
  info(action: string, message?: string, details?: Record<string, unknown>) {
    log({ level: 'info', action, message, details });
  },

  error(action: string, message?: string, details?: Record<string, unknown>) {
    log({ level: 'error', action, message, details });
  },
};
