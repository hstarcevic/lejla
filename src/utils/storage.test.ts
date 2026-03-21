import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockChain, mockFrom, mockLogger } = vi.hoisted(() => {
  const mockChain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    not: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
  };
  for (const key of Object.keys(mockChain)) {
    mockChain[key].mockReturnValue(mockChain);
  }
  const mockFrom = vi.fn(() => mockChain);
  const mockLogger = { info: vi.fn(), error: vi.fn() };
  return { mockChain, mockFrom, mockLogger };
});

const mockStorageBucket = {
  upload: vi.fn().mockResolvedValue({ error: null }),
  getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://storage.test/photo.jpg' } }),
  remove: vi.fn().mockResolvedValue({ error: null }),
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    storage: { from: () => mockStorageBucket },
  },
}));

vi.mock('./logger', () => ({
  logger: mockLogger,
}));

import { storage, generateId } from './storage';

const MOCK_KEYS = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'not', 'order', 'limit', 'single'];

function resetChain() {
  delete (mockChain as Record<string, unknown>).then;
  for (const key of MOCK_KEYS) {
    mockChain[key].mockReturnValue(mockChain);
  }
}

function resolveChain(data: unknown = null, error: unknown = null) {
  resetChain();
  Object.assign(mockChain, {
    then: (resolve: (v: unknown) => void) => {
      const result = { data, error };
      resolve(result);
      return Promise.resolve(result);
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetChain();
});

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 10 }, generateId));
    expect(ids.size).toBe(10);
  });
});

describe('storage.isAuthenticated / setAuthenticated / logout', () => {
  it('defaults to not authenticated', () => {
    expect(storage.isAuthenticated()).toBe(false);
  });

  it('sets authenticated state', () => {
    storage.setAuthenticated(true);
    expect(storage.isAuthenticated()).toBe(true);
  });

  it('logout clears auth', () => {
    storage.setAuthenticated(true);
    storage.logout();
    expect(storage.isAuthenticated()).toBe(false);
  });
});

describe('storage - Timeline CRUD', () => {
  const entry = {
    id: 'entry-1',
    date: '2024-01-01',
    title: 'Test',
    description: 'desc',
    photo: 'data:image/jpeg;base64,abc',
  };

  it('addTimelineEntry calls supabase insert', async () => {
    resolveChain(null, null);
    await storage.addTimelineEntry(entry);

    expect(mockFrom).toHaveBeenCalledWith('timeline_entries');
    expect(mockChain.insert).toHaveBeenCalledWith({
      id: 'entry-1',
      date: '2024-01-01',
      title: 'Test',
      description: 'desc',
      photo: 'https://storage.test/photo.jpg',
    });
    expect(mockLogger.info).toHaveBeenCalledWith('timeline.add', expect.any(String), expect.objectContaining({ id: 'entry-1' }));
  });

  it('addTimelineEntry throws on error', async () => {
    resolveChain(null, { message: 'insert failed', code: '23505' });
    await expect(storage.addTimelineEntry(entry)).rejects.toThrow('Failed to add timeline entry');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('updateTimelineEntry calls supabase update + eq', async () => {
    resolveChain(null, null);
    await storage.updateTimelineEntry(entry);

    expect(mockChain.update).toHaveBeenCalledWith({
      date: '2024-01-01',
      title: 'Test',
      description: 'desc',
      photo: 'https://storage.test/photo.jpg',
    });
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'entry-1');
  });

  it('updateTimelineEntry throws on error', async () => {
    resolveChain(null, { message: 'update failed', code: '' });
    await expect(storage.updateTimelineEntry(entry)).rejects.toThrow('Failed to update timeline entry');
  });

  it('deleteTimelineEntry calls supabase delete + eq', async () => {
    resolveChain(null, null);
    await storage.deleteTimelineEntry('entry-1');

    expect(mockChain.delete).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'entry-1');
  });

  it('deleteTimelineEntry throws on error', async () => {
    resolveChain(null, { message: 'delete failed', code: '' });
    await expect(storage.deleteTimelineEntry('entry-1')).rejects.toThrow('Failed to delete timeline entry');
  });

  it('addTimelineEntry stores null when no photo', async () => {
    resolveChain(null, null);
    await storage.addTimelineEntry({ ...entry, photo: undefined });
    expect(mockChain.insert).toHaveBeenCalledWith(expect.objectContaining({ photo: null }));
  });
});

describe('storage - Letters CRUD', () => {
  const letter = {
    id: 'letter-1',
    title: 'Love',
    content: 'I love you',
    isOpened: false,
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('addLetter calls supabase insert', async () => {
    resolveChain(null, null);
    await storage.addLetter(letter);

    expect(mockFrom).toHaveBeenCalledWith('letters');
    expect(mockChain.insert).toHaveBeenCalledWith({
      id: 'letter-1',
      title: 'Love',
      content: 'I love you',
      is_opened: false,
      created_at: '2024-01-01T00:00:00Z',
    });
  });

  it('addLetter throws on error', async () => {
    resolveChain(null, { message: 'fail', code: '' });
    await expect(storage.addLetter(letter)).rejects.toThrow('Failed to add letter');
  });

  it('updateLetter calls supabase update', async () => {
    resolveChain(null, null);
    await storage.updateLetter({ ...letter, isOpened: true });

    expect(mockChain.update).toHaveBeenCalledWith({
      title: 'Love',
      content: 'I love you',
      is_opened: true,
    });
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'letter-1');
  });

  it('deleteLetter calls supabase delete', async () => {
    resolveChain(null, null);
    await storage.deleteLetter('letter-1');
    expect(mockChain.delete).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'letter-1');
  });

  it('deleteLetter throws on error', async () => {
    resolveChain(null, { message: 'fail', code: '' });
    await expect(storage.deleteLetter('letter-1')).rejects.toThrow('Failed to delete letter');
  });
});

describe('storage - Flowers CRUD', () => {
  const flower = {
    id: 'flower-1',
    message: 'You are beautiful',
    isBloomed: false,
    type: 'rose' as const,
  };

  it('addFlower calls supabase insert', async () => {
    resolveChain(null, null);
    await storage.addFlower(flower);

    expect(mockFrom).toHaveBeenCalledWith('flowers');
    expect(mockChain.insert).toHaveBeenCalledWith({
      id: 'flower-1',
      message: 'You are beautiful',
      is_bloomed: false,
      type: 'rose',
    });
  });

  it('addFlower throws on error', async () => {
    resolveChain(null, { message: 'fail', code: '' });
    await expect(storage.addFlower(flower)).rejects.toThrow('Failed to add flower');
  });

  it('updateFlower calls supabase update', async () => {
    resolveChain(null, null);
    await storage.updateFlower({ ...flower, isBloomed: true });

    expect(mockChain.update).toHaveBeenCalledWith({
      message: 'You are beautiful',
      is_bloomed: true,
      type: 'rose',
    });
  });

  it('deleteFlower calls supabase delete', async () => {
    resolveChain(null, null);
    await storage.deleteFlower('flower-1');
    expect(mockChain.delete).toHaveBeenCalled();
  });

  it('deleteFlower throws on error', async () => {
    resolveChain(null, { message: 'fail', code: '' });
    await expect(storage.deleteFlower('flower-1')).rejects.toThrow('Failed to delete flower');
  });
});

describe('storage - Password', () => {
  it('getPassword returns password from supabase', async () => {
    resolveChain({ password_hash: 'secret123' }, null);
    const pw = await storage.getPassword();
    expect(pw).toBe('secret123');
  });

  it('getPassword returns empty string on error', async () => {
    resolveChain(null, { message: 'not found' });
    const pw = await storage.getPassword();
    expect(pw).toBe('');
  });

  it('setPassword deletes old and inserts new', async () => {
    resolveChain(null, null);
    await storage.setPassword('newpass');

    expect(mockFrom).toHaveBeenCalledWith('app_settings');
    expect(mockChain.insert).toHaveBeenCalledWith({ password_hash: 'newpass' });
  });
});

describe('storage - Caching', () => {
  it('getCachedTimeline returns null when empty', () => {
    expect(storage.getCachedTimeline()).toBeNull();
  });

  it('getCachedLetters returns null when empty', () => {
    expect(storage.getCachedLetters()).toBeNull();
  });

  it('getCachedFlowers returns null when empty', () => {
    expect(storage.getCachedFlowers()).toBeNull();
  });

  it('getTimeline caches results in localStorage', async () => {
    const entries = [{ id: '1', date: '2024-01-01', title: 'T', description: '' }];
    resolveChain(entries, null);
    await storage.getTimeline();
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('getTimeline falls back to cache on error', async () => {
    localStorage.setItem('lejla_cache_timeline', JSON.stringify([{ id: 'cached' }]));
    resolveChain(null, { message: 'network error', code: '' });
    const result = await storage.getTimeline();
    expect(result).toEqual([{ id: 'cached' }]);
  });
});
