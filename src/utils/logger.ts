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
    const { error } = await supabase.from('app_logs').insert(
      batch.map((entry) => ({
        level: entry.level,
        action: entry.action,
        message: entry.message || null,
        details: entry.details || null,
        user_agent: navigator.userAgent,
      }))
    );
    if (error) {
      console.warn('[logger] Failed to flush logs to Supabase:', error.message);
    }
  } catch (e) {
    console.warn('[logger] Failed to flush logs:', e);
  }
  flushing = false;
}

function log(entry: LogEntry) {
  // Always write to console so errors are visible in devtools
  const prefix = `[${entry.action}]`;
  if (entry.level === 'error') {
    console.error(prefix, entry.message, entry.details);
  } else {
    console.log(prefix, entry.message, entry.details);
  }

  queue.push(entry);
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
