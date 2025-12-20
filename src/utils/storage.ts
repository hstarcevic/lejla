import { TimelineEntry, Letter, Flower } from '../types';

const STORAGE_KEYS = {
  TIMELINE: 'lejla_timeline',
  LETTERS: 'lejla_letters',
  FLOWERS: 'lejla_flowers',
  PASSWORD: 'lejla_password',
  AUTHENTICATED: 'lejla_authenticated',
};

export const storage = {
  // Timeline
  getTimeline: (): TimelineEntry[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TIMELINE);
    return data ? JSON.parse(data) : [];
  },

  setTimeline: (entries: TimelineEntry[]) => {
    localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(entries));
  },

  // Letters
  getLetters: (): Letter[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LETTERS);
    return data ? JSON.parse(data) : [];
  },

  setLetters: (letters: Letter[]) => {
    localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(letters));
  },

  // Flowers
  getFlowers: (): Flower[] => {
    const data = localStorage.getItem(STORAGE_KEYS.FLOWERS);
    return data ? JSON.parse(data) : [];
  },

  setFlowers: (flowers: Flower[]) => {
    localStorage.setItem(STORAGE_KEYS.FLOWERS, JSON.stringify(flowers));
  },

  // Password
  getPassword: (): string => {
    return localStorage.getItem(STORAGE_KEYS.PASSWORD) || '';
  },

  setPassword: (password: string) => {
    localStorage.setItem(STORAGE_KEYS.PASSWORD, password);
  },

  // Auth
  isAuthenticated: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.AUTHENTICATED) === 'true';
  },

  setAuthenticated: (value: boolean) => {
    localStorage.setItem(STORAGE_KEYS.AUTHENTICATED, value.toString());
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTHENTICATED);
  },
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
