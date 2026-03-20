import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockInsert, mockFrom } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  return { mockInsert, mockFrom };
});

vi.mock('../lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { logger } from './logger';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockInsert.mockResolvedValue({ error: null });
});

describe('logger', () => {
  it('logger.info writes to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test.action', 'hello');
    expect(spy).toHaveBeenCalledWith('[test.action]', 'hello', undefined);
    spy.mockRestore();
  });

  it('logger.error writes to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test.error', 'bad thing', { code: '500' });
    expect(spy).toHaveBeenCalledWith('[test.error]', 'bad thing', { code: '500' });
    spy.mockRestore();
  });

  it('batches and flushes logs to supabase after timeout', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.info('action.1', 'msg1');
    logger.error('action.2', 'msg2', { detail: true });

    expect(mockFrom).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(600);

    expect(mockFrom).toHaveBeenCalledWith('app_logs');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ level: 'info', action: 'action.1', message: 'msg1' }),
        expect.objectContaining({ level: 'error', action: 'action.2', message: 'msg2', details: { detail: true } }),
      ])
    );

    vi.restoreAllMocks();
  });

  it('handles flush failure gracefully', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    mockInsert.mockResolvedValueOnce({ error: { message: 'db down' } });

    logger.info('test', 'msg');
    await vi.advanceTimersByTimeAsync(600);

    expect(warnSpy).toHaveBeenCalledWith('[logger] Failed to flush logs to Supabase:', 'db down');
    vi.restoreAllMocks();
  });
});
