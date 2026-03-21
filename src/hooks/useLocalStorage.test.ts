import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { mockStorage, mockLogger } = vi.hoisted(() => {
  const mockStorage = {
    getCachedTimeline: vi.fn(() => null),
    getTimeline: vi.fn(async () => []),
    getTimelinePage: vi.fn(async () => ({ data: [], total: 0 })),
    addTimelineEntry: vi.fn(async () => {}),
    updateTimelineEntry: vi.fn(async () => {}),
    deleteTimelineEntry: vi.fn(async () => {}),
    getCachedLetters: vi.fn(() => null),
    getLetters: vi.fn(async () => []),
    getLettersPage: vi.fn(async () => ({ data: [], total: 0 })),
    addLetter: vi.fn(async () => {}),
    updateLetter: vi.fn(async () => {}),
    deleteLetter: vi.fn(async () => {}),
    getCachedFlowers: vi.fn(() => null),
    getFlowers: vi.fn(async () => []),
    addFlower: vi.fn(async () => {}),
    updateFlower: vi.fn(async () => {}),
    deleteFlower: vi.fn(async () => {}),
  };
  const mockLogger = { info: vi.fn(), error: vi.fn() };
  return { mockStorage, mockLogger };
});

vi.mock('../utils/storage', () => ({
  storage: mockStorage,
}));

vi.mock('../utils/logger', () => ({
  logger: mockLogger,
}));

vi.mock('../components/Toast', () => ({
  showToast: vi.fn(),
}));

import { useTimeline, useLetters, useFlowers } from './useLocalStorage';

beforeEach(() => {
  vi.clearAllMocks();
  mockStorage.getCachedTimeline.mockReturnValue(null);
  mockStorage.getTimelinePage.mockResolvedValue({ data: [], total: 0 });
  mockStorage.getCachedLetters.mockReturnValue(null);
  mockStorage.getLettersPage.mockResolvedValue({ data: [], total: 0 });
  mockStorage.getCachedFlowers.mockReturnValue(null);
  mockStorage.getFlowers.mockResolvedValue([]);
});

// Helper: render hook and flush the initial load
async function renderAndFlush<T>(hookFn: () => T) {
  const result = renderHook(hookFn);
  await act(async () => {});
  return result;
}

describe('useTimeline', () => {
  it('loads entries on mount', async () => {
    const entries = [{ id: '1', date: '2024-01-01', title: 'First', description: '' }];
    mockStorage.getTimelinePage.mockResolvedValue({ data: entries, total: 1 });

    const { result } = renderHook(() => useTimeline());

    await waitFor(() => {
      expect(result.current.entries).toEqual(entries);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('shows cached data immediately', () => {
    const cached = [{ id: '1', date: '2024-01-01', title: 'Cached', description: '' }];
    mockStorage.getCachedTimeline.mockReturnValue(cached);

    const { result } = renderHook(() => useTimeline());
    expect(result.current.entries).toEqual(cached);
    expect(result.current.isLoading).toBe(false);
  });

  it('addEntry optimistically adds and sorts by date', async () => {
    const existing = [{ id: '1', date: '2024-06-01', title: 'Later', description: '' }];
    mockStorage.getCachedTimeline.mockReturnValue(existing);
    mockStorage.getTimelinePage.mockResolvedValue({ data: existing, total: 1 });

    const { result } = await renderAndFlush(() => useTimeline());

    const newEntry = { id: '2', date: '2024-01-01', title: 'Earlier', description: '' };
    await act(async () => {
      await result.current.addEntry(newEntry);
    });

    expect(result.current.entries[0].id).toBe('2');
    expect(result.current.entries[1].id).toBe('1');
    expect(mockStorage.addTimelineEntry).toHaveBeenCalledWith(newEntry);
  });

  it('reverts on add failure', async () => {
    const existing = [{ id: '1', date: '2024-01-01', title: 'Existing', description: '' }];
    mockStorage.getCachedTimeline.mockReturnValue(existing);
    mockStorage.getTimelinePage.mockResolvedValue({ data: existing, total: 1 });
    mockStorage.addTimelineEntry.mockRejectedValue(new Error('fail'));

    const { result } = await renderAndFlush(() => useTimeline());

    await act(async () => {
      await result.current.addEntry({ id: '2', date: '2024-02-01', title: 'New', description: '' });
    });

    await waitFor(() => {
      expect(result.current.entries).toEqual(existing);
    });
    expect(mockLogger.error).toHaveBeenCalledWith('hook.timeline.add', expect.any(String), expect.any(Object));
  });

  it('updateEntry optimistically updates', async () => {
    const entries = [{ id: '1', date: '2024-01-01', title: 'Old', description: '' }];
    mockStorage.getCachedTimeline.mockReturnValue(entries);
    mockStorage.getTimelinePage.mockResolvedValue({ data: entries, total: 1 });

    const { result } = await renderAndFlush(() => useTimeline());

    const updated = { id: '1', date: '2024-01-01', title: 'New', description: 'updated' };
    await act(async () => {
      await result.current.updateEntry(updated);
    });

    expect(result.current.entries[0].title).toBe('New');
  });

  it('deleteEntry optimistically removes', async () => {
    const entries = [
      { id: '1', date: '2024-01-01', title: 'A', description: '' },
      { id: '2', date: '2024-02-01', title: 'B', description: '' },
    ];
    mockStorage.getCachedTimeline.mockReturnValue(entries);
    mockStorage.getTimelinePage.mockResolvedValue({ data: entries, total: 2 });

    const { result } = await renderAndFlush(() => useTimeline());

    await act(async () => {
      await result.current.deleteEntry('1');
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].id).toBe('2');
  });
});

describe('useLetters', () => {
  it('loads letters on mount', async () => {
    const letters = [{ id: '1', title: 'Love', content: 'xo', isOpened: false, createdAt: '2024-01-01' }];
    mockStorage.getLettersPage.mockResolvedValue({ data: letters, total: 1 });

    const { result } = renderHook(() => useLetters());

    await waitFor(() => {
      expect(result.current.letters).toEqual(letters);
    });
  });

  it('addLetter optimistically prepends', async () => {
    mockStorage.getCachedLetters.mockReturnValue([]);
    mockStorage.getLettersPage.mockResolvedValue({ data: [], total: 0 });

    const { result } = await renderAndFlush(() => useLetters());

    const letter = { id: '1', title: 'New', content: 'hi', isOpened: false, createdAt: '2024-01-01' };
    await act(async () => {
      await result.current.addLetter(letter);
    });

    expect(result.current.letters[0]).toEqual(letter);
    expect(mockStorage.addLetter).toHaveBeenCalledWith(letter);
  });

  it('reverts on add failure', async () => {
    mockStorage.getCachedLetters.mockReturnValue([]);
    mockStorage.getLettersPage.mockResolvedValue({ data: [], total: 0 });
    mockStorage.addLetter.mockRejectedValue(new Error('fail'));

    const { result } = await renderAndFlush(() => useLetters());

    await act(async () => {
      await result.current.addLetter({ id: '1', title: 'X', content: 'x', isOpened: false, createdAt: '' });
    });

    await waitFor(() => {
      expect(result.current.letters).toEqual([]);
    });
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('deleteLetter optimistically removes', async () => {
    const letters = [{ id: '1', title: 'A', content: 'a', isOpened: false, createdAt: '' }];
    mockStorage.getCachedLetters.mockReturnValue(letters);
    mockStorage.getLettersPage.mockResolvedValue({ data: letters, total: 1 });

    const { result } = await renderAndFlush(() => useLetters());

    await act(async () => {
      await result.current.deleteLetter('1');
    });

    expect(result.current.letters).toHaveLength(0);
  });
});

describe('useFlowers', () => {
  it('loads flowers on mount', async () => {
    const flowers = [{ id: '1', message: 'love', isBloomed: false, type: 'rose' as const }];
    mockStorage.getFlowers.mockResolvedValue(flowers);

    const { result } = renderHook(() => useFlowers());

    await waitFor(() => {
      expect(result.current.flowers).toEqual(flowers);
    });
  });

  it('addFlower optimistically appends', async () => {
    mockStorage.getCachedFlowers.mockReturnValue([]);
    mockStorage.getFlowers.mockResolvedValue([]);

    const { result } = await renderAndFlush(() => useFlowers());

    const flower = { id: '1', message: 'beautiful', isBloomed: false, type: 'tulip' as const };
    await act(async () => {
      await result.current.addFlower(flower);
    });

    expect(result.current.flowers).toEqual([flower]);
  });

  it('updateFlower optimistically updates', async () => {
    const flowers = [{ id: '1', message: 'love', isBloomed: false, type: 'rose' as const }];
    mockStorage.getCachedFlowers.mockReturnValue(flowers);
    mockStorage.getFlowers.mockResolvedValue(flowers);

    const { result } = await renderAndFlush(() => useFlowers());

    await act(async () => {
      await result.current.updateFlower({ ...flowers[0], isBloomed: true });
    });

    expect(result.current.flowers[0].isBloomed).toBe(true);
  });

  it('reverts on add failure', async () => {
    mockStorage.getCachedFlowers.mockReturnValue([]);
    mockStorage.getFlowers.mockResolvedValue([]);
    mockStorage.addFlower.mockRejectedValue(new Error('fail'));

    const { result } = await renderAndFlush(() => useFlowers());

    await act(async () => {
      await result.current.addFlower({ id: '1', message: 'x', isBloomed: false, type: 'daisy' });
    });

    await waitFor(() => {
      expect(result.current.flowers).toEqual([]);
    });
  });

  it('deleteFlower optimistically removes', async () => {
    const flowers = [{ id: '1', message: 'love', isBloomed: true, type: 'rose' as const }];
    mockStorage.getCachedFlowers.mockReturnValue(flowers);
    mockStorage.getFlowers.mockResolvedValue(flowers);

    const { result } = await renderAndFlush(() => useFlowers());

    await act(async () => {
      await result.current.deleteFlower('1');
    });

    expect(result.current.flowers).toHaveLength(0);
  });
});
