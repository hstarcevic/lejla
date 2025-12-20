import { useState, useEffect } from 'react';
import { TimelineEntry, Letter, Flower } from '../types';
import { storage } from '../utils/storage';

export function useTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    setEntries(storage.getTimeline());
  }, []);

  const updateEntries = (newEntries: TimelineEntry[]) => {
    const sorted = [...newEntries].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setEntries(sorted);
    storage.setTimeline(sorted);
  };

  return { entries, setEntries: updateEntries };
}

export function useLetters() {
  const [letters, setLetters] = useState<Letter[]>([]);

  useEffect(() => {
    setLetters(storage.getLetters());
  }, []);

  const updateLetters = (newLetters: Letter[]) => {
    setLetters(newLetters);
    storage.setLetters(newLetters);
  };

  return { letters, setLetters: updateLetters };
}

export function useFlowers() {
  const [flowers, setFlowers] = useState<Flower[]>([]);

  useEffect(() => {
    setFlowers(storage.getFlowers());
  }, []);

  const updateFlowers = (newFlowers: Flower[]) => {
    setFlowers(newFlowers);
    storage.setFlowers(newFlowers);
  };

  return { flowers, setFlowers: updateFlowers };
}
