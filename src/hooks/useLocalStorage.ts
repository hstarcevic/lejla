import { useState, useEffect } from 'react';
import { TimelineEntry, Letter, Flower } from '../types';
import { storage } from '../utils/storage';

export function useTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    const data = await storage.getTimeline();
    setEntries(data);
    setIsLoading(false);
  };

  const addEntry = async (entry: TimelineEntry) => {
    // Optimistic update
    setEntries(prev => [...prev, entry].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));

    try {
      await storage.addTimelineEntry(entry);
      await loadEntries(); // Refresh from server
    } catch (error) {
      console.error('Failed to add entry:', error);
      await loadEntries(); // Revert on error
    }
  };

  const updateEntry = async (entry: TimelineEntry) => {
    await storage.updateTimelineEntry(entry);
    await loadEntries();
  };

  const deleteEntry = async (id: string) => {
    await storage.deleteTimelineEntry(id);
    await loadEntries();
  };

  return { entries, isLoading, addEntry, updateEntry, deleteEntry, refresh: loadEntries };
}

export function useLetters() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLetters();
  }, []);

  const loadLetters = async () => {
    setIsLoading(true);
    const data = await storage.getLetters();
    setLetters(data);
    setIsLoading(false);
  };

  const addLetter = async (letter: Letter) => {
    // Optimistic update
    setLetters(prev => [letter, ...prev]);

    try {
      await storage.addLetter(letter);
      await loadLetters(); // Refresh from server
    } catch (error) {
      console.error('Failed to add letter:', error);
      await loadLetters(); // Revert on error
    }
  };

  const updateLetter = async (letter: Letter) => {
    await storage.updateLetter(letter);
    await loadLetters();
  };

  const deleteLetter = async (id: string) => {
    await storage.deleteLetter(id);
    await loadLetters();
  };

  return { letters, isLoading, addLetter, updateLetter, deleteLetter, refresh: loadLetters };
}

export function useFlowers() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFlowers();
  }, []);

  const loadFlowers = async () => {
    setIsLoading(true);
    const data = await storage.getFlowers();
    setFlowers(data);
    setIsLoading(false);
  };

  const addFlower = async (flower: Flower) => {
    // Optimistic update
    setFlowers(prev => [...prev, flower]);

    try {
      await storage.addFlower(flower);
      await loadFlowers(); // Refresh from server
    } catch (error) {
      console.error('Failed to add flower:', error);
      await loadFlowers(); // Revert on error
    }
  };

  const updateFlower = async (flower: Flower) => {
    await storage.updateFlower(flower);
    await loadFlowers();
  };

  const deleteFlower = async (id: string) => {
    await storage.deleteFlower(id);
    await loadFlowers();
  };

  return { flowers, isLoading, addFlower, updateFlower, deleteFlower, refresh: loadFlowers };
}
