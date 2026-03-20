import { useState, useEffect } from 'react';
import { TimelineEntry, Letter, Flower } from '../types';
import { storage } from '../utils/storage';
import { logger } from '../utils/logger';

export function useTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>(() => storage.getCachedTimeline() || []);
  const [isLoading, setIsLoading] = useState(() => !storage.getCachedTimeline());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const hasCache = entries.length > 0;
    if (!hasCache) setIsLoading(true);
    if (hasCache) setIsSyncing(true);
    const data = await storage.getTimeline();
    setEntries(data);
    setIsLoading(false);
    setIsSyncing(false);
  };

  const addEntry = async (entry: TimelineEntry) => {
    setEntries(prev => [...prev, entry].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));

    try {
      await storage.addTimelineEntry(entry);
    } catch (error) {
      logger.error('hook.timeline.add', 'Optimistic add failed, reverting', { id: entry.id, error: String(error) });
      await loadEntries();
    }
  };

  const updateEntry = async (entry: TimelineEntry) => {
    setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));

    try {
      await storage.updateTimelineEntry(entry);
    } catch (error) {
      logger.error('hook.timeline.update', 'Optimistic update failed, reverting', { id: entry.id, error: String(error) });
      await loadEntries();
    }
  };

  const deleteEntry = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));

    try {
      await storage.deleteTimelineEntry(id);
    } catch (error) {
      logger.error('hook.timeline.delete', 'Optimistic delete failed, reverting', { id, error: String(error) });
      await loadEntries();
    }
  };

  return { entries, isLoading, isSyncing, addEntry, updateEntry, deleteEntry, refresh: loadEntries };
}

export function useLetters() {
  const [letters, setLetters] = useState<Letter[]>(() => storage.getCachedLetters() || []);
  const [isLoading, setIsLoading] = useState(() => !storage.getCachedLetters());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async () => {
    const hasCache = letters.length > 0;
    if (!hasCache) setIsLoading(true);
    if (hasCache) setIsSyncing(true);
    const data = await storage.getLetters();
    setLetters(data);
    setIsLoading(false);
    setIsSyncing(false);
  };

  const addLetter = async (letter: Letter) => {
    setLetters(prev => [letter, ...prev]);

    try {
      await storage.addLetter(letter);
    } catch (error) {
      logger.error('hook.letter.add', 'Optimistic add failed, reverting', { id: letter.id, error: String(error) });
      await loadLetters();
    }
  };

  const updateLetter = async (letter: Letter) => {
    setLetters(prev => prev.map(l => l.id === letter.id ? letter : l));

    try {
      await storage.updateLetter(letter);
    } catch (error) {
      logger.error('hook.letter.update', 'Optimistic update failed, reverting', { id: letter.id, error: String(error) });
      await loadLetters();
    }
  };

  const deleteLetter = async (id: string) => {
    setLetters(prev => prev.filter(l => l.id !== id));

    try {
      await storage.deleteLetter(id);
    } catch (error) {
      logger.error('hook.letter.delete', 'Optimistic delete failed, reverting', { id, error: String(error) });
      await loadLetters();
    }
  };

  return { letters, isLoading, isSyncing, addLetter, updateLetter, deleteLetter, refresh: loadLetters };
}

export function useFlowers() {
  const [flowers, setFlowers] = useState<Flower[]>(() => storage.getCachedFlowers() || []);
  const [isLoading, setIsLoading] = useState(() => !storage.getCachedFlowers());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadFlowers();
  }, []);

  const loadFlowers = async () => {
    const hasCache = flowers.length > 0;
    if (!hasCache) setIsLoading(true);
    if (hasCache) setIsSyncing(true);
    const data = await storage.getFlowers();
    setFlowers(data);
    setIsLoading(false);
    setIsSyncing(false);
  };

  const addFlower = async (flower: Flower) => {
    setFlowers(prev => [...prev, flower]);

    try {
      await storage.addFlower(flower);
    } catch (error) {
      logger.error('hook.flower.add', 'Optimistic add failed, reverting', { id: flower.id, error: String(error) });
      await loadFlowers();
    }
  };

  const updateFlower = async (flower: Flower) => {
    setFlowers(prev => prev.map(f => f.id === flower.id ? flower : f));

    try {
      await storage.updateFlower(flower);
    } catch (error) {
      logger.error('hook.flower.update', 'Optimistic update failed, reverting', { id: flower.id, error: String(error) });
      await loadFlowers();
    }
  };

  const deleteFlower = async (id: string) => {
    setFlowers(prev => prev.filter(f => f.id !== id));

    try {
      await storage.deleteFlower(id);
    } catch (error) {
      logger.error('hook.flower.delete', 'Optimistic delete failed, reverting', { id, error: String(error) });
      await loadFlowers();
    }
  };

  return { flowers, isLoading, isSyncing, addFlower, updateFlower, deleteFlower, refresh: loadFlowers };
}
