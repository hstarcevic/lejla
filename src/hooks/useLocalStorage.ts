import { useState, useEffect } from 'react';
import { TimelineEntry, Letter, Flower } from '../types';
import { storage } from '../utils/storage';
import { logger } from '../utils/logger';
import { showToast, showSuccessToast } from '../components/Toast';

const TIMELINE_PAGE_SIZE = 20;

export function useTimeline() {
  const [allEntries, setAllEntries] = useState<TimelineEntry[]>(() => storage.getCachedTimeline() || []);
  const [isLoading, setIsLoading] = useState(() => !storage.getCachedTimeline());
  const [isSyncing, setIsSyncing] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const hasCache = allEntries.length > 0;
    if (!hasCache) setIsLoading(true);
    if (hasCache) setIsSyncing(true);
    const synced = await storage.syncTimeline();
    setAllEntries(synced);
    setIsLoading(false);
    setIsSyncing(false);
  };

  const totalPages = Math.max(1, Math.ceil(allEntries.length / TIMELINE_PAGE_SIZE));
  const entries = allEntries.slice(page * TIMELINE_PAGE_SIZE, (page + 1) * TIMELINE_PAGE_SIZE);

  const addEntry = async (entry: TimelineEntry) => {
    setAllEntries(prev => [...prev, entry].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));

    try {
      await storage.addTimelineEntry(entry);
      showSuccessToast('Uspomena sačuvana!');
    } catch (error) {
      logger.error('hook.timeline.add', 'Optimistic add failed, reverting', { id: entry.id, error: String(error) });
      await loadEntries();
      showToast('Nije uspjelo sačuvati uspomenu.', () => addEntry(entry));
    }
  };

  const updateEntry = async (entry: TimelineEntry) => {
    setAllEntries(prev => prev.map(e => e.id === entry.id ? entry : e));

    try {
      await storage.updateTimelineEntry(entry);
    } catch (error) {
      logger.error('hook.timeline.update', 'Optimistic update failed, reverting', { id: entry.id, error: String(error) });
      await loadEntries();
      showToast('Nije uspjelo ažurirati uspomenu.', () => updateEntry(entry));
    }
  };

  const deleteEntry = async (id: string) => {
    setAllEntries(prev => prev.filter(e => e.id !== id));

    try {
      await storage.deleteTimelineEntry(id);
    } catch (error) {
      logger.error('hook.timeline.delete', 'Optimistic delete failed, reverting', { id, error: String(error) });
      await loadEntries();
      showToast('Nije uspjelo obrisati uspomenu.', () => deleteEntry(id));
    }
  };

  return { entries, isLoading, isSyncing, addEntry, updateEntry, deleteEntry, refresh: loadEntries, page, setPage, totalPages };
}

const LETTERS_PAGE_SIZE = 20;

export function useLetters() {
  const [allLetters, setAllLetters] = useState<Letter[]>(() => storage.getCachedLetters() || []);
  const [isLoading, setIsLoading] = useState(() => !storage.getCachedLetters());
  const [isSyncing, setIsSyncing] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async () => {
    const hasCache = allLetters.length > 0;
    if (!hasCache) setIsLoading(true);
    if (hasCache) setIsSyncing(true);
    const synced = await storage.syncLetters();
    setAllLetters(synced);
    setIsLoading(false);
    setIsSyncing(false);
  };

  const totalPages = Math.max(1, Math.ceil(allLetters.length / LETTERS_PAGE_SIZE));
  const letters = allLetters.slice(page * LETTERS_PAGE_SIZE, (page + 1) * LETTERS_PAGE_SIZE);

  const addLetter = async (letter: Letter) => {
    setAllLetters(prev => [letter, ...prev]);

    try {
      await storage.addLetter(letter);
    } catch (error) {
      logger.error('hook.letter.add', 'Optimistic add failed, reverting', { id: letter.id, error: String(error) });
      await loadLetters();
      showToast('Nije uspjelo sačuvati pismo.', () => addLetter(letter));
    }
  };

  const updateLetter = async (letter: Letter) => {
    setAllLetters(prev => prev.map(l => l.id === letter.id ? letter : l));

    try {
      await storage.updateLetter(letter);
    } catch (error) {
      logger.error('hook.letter.update', 'Optimistic update failed, reverting', { id: letter.id, error: String(error) });
      await loadLetters();
      showToast('Nije uspjelo ažurirati pismo.', () => updateLetter(letter));
    }
  };

  const deleteLetter = async (id: string) => {
    setAllLetters(prev => prev.filter(l => l.id !== id));

    try {
      await storage.deleteLetter(id);
    } catch (error) {
      logger.error('hook.letter.delete', 'Optimistic delete failed, reverting', { id, error: String(error) });
      await loadLetters();
      showToast('Nije uspjelo obrisati pismo.', () => deleteLetter(id));
    }
  };

  return { letters, isLoading, isSyncing, addLetter, updateLetter, deleteLetter, refresh: loadLetters, page, setPage, totalPages };
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
    const data = await storage.syncFlowers();
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
      showToast('Nije uspjelo posaditi cvijet.', () => addFlower(flower));
    }
  };

  const updateFlower = async (flower: Flower) => {
    setFlowers(prev => prev.map(f => f.id === flower.id ? flower : f));

    try {
      await storage.updateFlower(flower);
    } catch (error) {
      logger.error('hook.flower.update', 'Optimistic update failed, reverting', { id: flower.id, error: String(error) });
      await loadFlowers();
      showToast('Nije uspjelo ažurirati cvijet.', () => updateFlower(flower));
    }
  };

  const deleteFlower = async (id: string) => {
    setFlowers(prev => prev.filter(f => f.id !== id));

    try {
      await storage.deleteFlower(id);
    } catch (error) {
      logger.error('hook.flower.delete', 'Optimistic delete failed, reverting', { id, error: String(error) });
      await loadFlowers();
      showToast('Nije uspjelo obrisati cvijet.', () => deleteFlower(id));
    }
  };

  return { flowers, isLoading, isSyncing, addFlower, updateFlower, deleteFlower, refresh: loadFlowers };
}
