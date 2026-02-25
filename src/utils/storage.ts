import { supabase } from '../lib/supabase';
import { TimelineEntry, Letter, Flower } from '../types';
import { logger } from './logger';

// Keep auth in localStorage since it's session-specific
const AUTH_KEY = 'lejla_authenticated';

// Local cache keys
const CACHE_TIMELINE = 'lejla_cache_timeline';
const CACHE_LETTERS = 'lejla_cache_letters';
const CACHE_FLOWERS = 'lejla_cache_flowers';

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

// IndexedDB photo cache (much larger storage than localStorage)
const PHOTO_DB_NAME = 'lejla_photos';
const PHOTO_STORE = 'photos';

function openPhotoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PHOTO_DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(PHOTO_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedPhoto(id: string): Promise<string | undefined> {
  try {
    const db = await openPhotoDB();
    return new Promise((resolve) => {
      const tx = db.transaction(PHOTO_STORE, 'readonly');
      const req = tx.objectStore(PHOTO_STORE).get(id);
      req.onsuccess = () => resolve(req.result || undefined);
      req.onerror = () => resolve(undefined);
    });
  } catch {
    return undefined;
  }
}

async function setCachedPhoto(id: string, photo: string): Promise<void> {
  try {
    const db = await openPhotoDB();
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).put(photo, id);
  } catch {
    // ignore cache failures
  }
}

export const storage = {
  // Timeline - now using Supabase
  getCachedTimeline: (): TimelineEntry[] | null => {
    return getCache<TimelineEntry[]>(CACHE_TIMELINE);
  },

  getTimeline: async (): Promise<TimelineEntry[]> => {
    const { data, error } = await supabase
      .from('timeline_entries')
      .select('id, date, title, description')
      .order('date', { ascending: true });

    if (error) {
      logger.error('timeline.fetch', 'Failed to fetch timeline', { error: error.message, code: error.code });
      return getCache<TimelineEntry[]>(CACHE_TIMELINE) || [];
    }

    // Also check which entries have photos (without fetching the actual data)
    const { data: photoData } = await supabase
      .from('timeline_entries')
      .select('id')
      .not('photo', 'is', null);

    const idsWithPhotos = new Set((photoData || []).map((p) => p.id));

    const entries = (data || []).map((entry) => ({
      id: entry.id,
      date: entry.date,
      title: entry.title,
      description: entry.description,
      hasPhoto: idsWithPhotos.has(entry.id),
    }));

    setCache(CACHE_TIMELINE, entries);
    return entries;
  },

  getTimelineEntryPhoto: async (id: string): Promise<string | undefined> => {
    // Check IndexedDB cache first
    const cached = await getCachedPhoto(id);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('timeline_entries')
      .select('photo')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    const photo = data.photo || undefined;

    if (photo) {
      setCachedPhoto(id, photo);
    }

    return photo;
  },

  setTimeline: async (entries: TimelineEntry[]): Promise<void> => {
    // Delete all existing entries
    await supabase.from('timeline_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new entries
    if (entries.length > 0) {
      const { error } = await supabase.from('timeline_entries').insert(
        entries.map((entry) => ({
          id: entry.id,
          date: entry.date,
          title: entry.title,
          description: entry.description,
          photo: entry.photo || null,
        }))
      );

      if (error) {
        logger.error('timeline.set', 'Failed to save timeline', { error: error.message, code: error.code });
      }
    }
  },

  addTimelineEntry: async (entry: TimelineEntry): Promise<void> => {
    logger.info('timeline.add', 'Adding timeline entry', { id: entry.id, title: entry.title, hasPhoto: !!entry.photo });

    const { error } = await supabase.from('timeline_entries').insert({
      id: entry.id,
      date: entry.date,
      title: entry.title,
      description: entry.description,
      photo: entry.photo || null,
    });

    if (error) {
      logger.error('timeline.add', 'Failed to add timeline entry', { id: entry.id, error: error.message, code: error.code });
    }
  },

  updateTimelineEntry: async (entry: TimelineEntry): Promise<void> => {
    logger.info('timeline.update', 'Updating timeline entry', { id: entry.id, title: entry.title });

    const { error } = await supabase
      .from('timeline_entries')
      .update({
        date: entry.date,
        title: entry.title,
        description: entry.description,
        photo: entry.photo || null,
      })
      .eq('id', entry.id);

    if (error) {
      logger.error('timeline.update', 'Failed to update timeline entry', { id: entry.id, error: error.message, code: error.code });
    }
  },

  deleteTimelineEntry: async (id: string): Promise<void> => {
    logger.info('timeline.delete', 'Deleting timeline entry', { id });

    const { error } = await supabase.from('timeline_entries').delete().eq('id', id);

    if (error) {
      logger.error('timeline.delete', 'Failed to delete timeline entry', { id, error: error.message, code: error.code });
    }
  },

  // Letters - now using Supabase
  getCachedLetters: (): Letter[] | null => {
    return getCache<Letter[]>(CACHE_LETTERS);
  },

  getLetters: async (): Promise<Letter[]> => {
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('letters.fetch', 'Failed to fetch letters', { error: error.message, code: error.code });
      return getCache<Letter[]>(CACHE_LETTERS) || [];
    }

    const letters = (data || []).map((letter) => ({
      id: letter.id,
      title: letter.title,
      content: letter.content,
      isOpened: letter.is_opened,
      createdAt: letter.created_at,
    }));

    setCache(CACHE_LETTERS, letters);
    return letters;
  },

  setLetters: async (letters: Letter[]): Promise<void> => {
    // Delete all existing letters
    await supabase.from('letters').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new letters
    if (letters.length > 0) {
      const { error } = await supabase.from('letters').insert(
        letters.map((letter) => ({
          id: letter.id,
          title: letter.title,
          content: letter.content,
          is_opened: letter.isOpened,
          created_at: letter.createdAt,
        }))
      );

      if (error) {
        logger.error('letters.set', 'Failed to save letters', { error: error.message, code: error.code });
      }
    }
  },

  addLetter: async (letter: Letter): Promise<void> => {
    logger.info('letter.add', 'Adding letter', { id: letter.id, title: letter.title });

    const { error } = await supabase.from('letters').insert({
      id: letter.id,
      title: letter.title,
      content: letter.content,
      is_opened: letter.isOpened,
      created_at: letter.createdAt,
    });

    if (error) {
      logger.error('letter.add', 'Failed to add letter', { id: letter.id, error: error.message, code: error.code });
    }
  },

  updateLetter: async (letter: Letter): Promise<void> => {
    logger.info('letter.update', 'Updating letter', { id: letter.id });

    const { error } = await supabase
      .from('letters')
      .update({
        title: letter.title,
        content: letter.content,
        is_opened: letter.isOpened,
      })
      .eq('id', letter.id);

    if (error) {
      logger.error('letter.update', 'Failed to update letter', { id: letter.id, error: error.message, code: error.code });
    }
  },

  deleteLetter: async (id: string): Promise<void> => {
    logger.info('letter.delete', 'Deleting letter', { id });

    const { error } = await supabase.from('letters').delete().eq('id', id);

    if (error) {
      logger.error('letter.delete', 'Failed to delete letter', { id, error: error.message, code: error.code });
    }
  },

  // Flowers - now using Supabase
  getCachedFlowers: (): Flower[] | null => {
    return getCache<Flower[]>(CACHE_FLOWERS);
  },

  getFlowers: async (): Promise<Flower[]> => {
    const { data, error } = await supabase
      .from('flowers')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('flowers.fetch', 'Failed to fetch flowers', { error: error.message, code: error.code });
      return getCache<Flower[]>(CACHE_FLOWERS) || [];
    }

    const flowers = (data || []).map((flower) => ({
      id: flower.id,
      message: flower.message,
      isBloomed: flower.is_bloomed,
      type: flower.type as Flower['type'],
    }));

    setCache(CACHE_FLOWERS, flowers);
    return flowers;
  },

  setFlowers: async (flowers: Flower[]): Promise<void> => {
    // Delete all existing flowers
    await supabase.from('flowers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new flowers
    if (flowers.length > 0) {
      const { error } = await supabase.from('flowers').insert(
        flowers.map((flower) => ({
          id: flower.id,
          message: flower.message,
          is_bloomed: flower.isBloomed,
          type: flower.type,
        }))
      );

      if (error) {
        logger.error('flowers.set', 'Failed to save flowers', { error: error.message, code: error.code });
      }
    }
  },

  addFlower: async (flower: Flower): Promise<void> => {
    logger.info('flower.add', 'Adding flower', { id: flower.id, type: flower.type });

    const { error } = await supabase.from('flowers').insert({
      id: flower.id,
      message: flower.message,
      is_bloomed: flower.isBloomed,
      type: flower.type,
    });

    if (error) {
      logger.error('flower.add', 'Failed to add flower', { id: flower.id, error: error.message, code: error.code });
    }
  },

  updateFlower: async (flower: Flower): Promise<void> => {
    logger.info('flower.update', 'Updating flower', { id: flower.id });

    const { error } = await supabase
      .from('flowers')
      .update({
        message: flower.message,
        is_bloomed: flower.isBloomed,
        type: flower.type,
      })
      .eq('id', flower.id);

    if (error) {
      logger.error('flower.update', 'Failed to update flower', { id: flower.id, error: error.message, code: error.code });
    }
  },

  deleteFlower: async (id: string): Promise<void> => {
    logger.info('flower.delete', 'Deleting flower', { id });

    const { error } = await supabase.from('flowers').delete().eq('id', id);

    if (error) {
      logger.error('flower.delete', 'Failed to delete flower', { id, error: error.message, code: error.code });
    }
  },

  // Password - using Supabase
  getPassword: async (): Promise<string> => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('password_hash')
      .limit(1)
      .single();

    if (error || !data) {
      return '';
    }

    return data.password_hash;
  },

  setPassword: async (password: string): Promise<void> => {
    // Delete existing password
    await supabase.from('app_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new password
    const { error } = await supabase.from('app_settings').insert({
      password_hash: password,
    });

    if (error) {
      logger.error('password.set', 'Failed to save password', { error: error.message, code: error.code });
    }
  },

  // Auth - keep in localStorage (session-specific)
  isAuthenticated: (): boolean => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  },

  setAuthenticated: (value: boolean) => {
    localStorage.setItem(AUTH_KEY, value.toString());
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },
};

export const generateId = (): string => {
  return crypto.randomUUID();
};
