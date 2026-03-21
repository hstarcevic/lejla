import { supabase } from '../lib/supabase';
import { TimelineEntry, Letter, Flower } from '../types';
import { logger } from './logger';

// Keep auth in localStorage since it's session-specific
const AUTH_KEY = 'lejla_authenticated';

// Local cache keys
const CACHE_TIMELINE = 'lejla_cache_timeline';
const CACHE_LETTERS = 'lejla_cache_letters';
const CACHE_FLOWERS = 'lejla_cache_flowers';

interface SyncCache<T> {
  data: T[];
  lastSyncTime: string;
}

function getSyncCache<T>(key: string): SyncCache<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Handle old cache format (plain array) — treat as no lastSyncTime
    if (Array.isArray(parsed)) {
      return { data: parsed as T[], lastSyncTime: '' };
    }
    return parsed as SyncCache<T>;
  } catch {
    return null;
  }
}

function setSyncCache<T>(key: string, data: T[], lastSyncTime: string): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, lastSyncTime }));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

function getCachedData<T>(key: string): T[] | null {
  const cache = getSyncCache<T>(key);
  return cache ? cache.data : null;
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

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

async function uploadPhoto(entryId: string, base64: string): Promise<string> {
  const blob = base64ToBlob(base64);
  const path = `${entryId}.jpg`;

  const { error } = await supabase.storage
    .from('photos')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });

  if (error) {
    logger.error('photo.upload', 'Failed to upload photo to Storage', { entryId, error: error.message });
    // Fall back to base64 in DB if Storage upload fails
    return base64;
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return data.publicUrl;
}

async function deletePhoto(entryId: string): Promise<void> {
  await supabase.storage.from('photos').remove([`${entryId}.jpg`]);
}

export const storage = {
  // Timeline - incremental sync
  getCachedTimeline: (): TimelineEntry[] | null => {
    return getCachedData<TimelineEntry>(CACHE_TIMELINE);
  },

  syncTimeline: async (): Promise<TimelineEntry[]> => {
    const cache = getSyncCache<TimelineEntry>(CACHE_TIMELINE);

    if (cache && cache.lastSyncTime) {
      // Fetch lightweight metadata: all IDs + updated_at
      const { data: meta, error: metaError } = await supabase
        .from('timeline_entries')
        .select('id, updated_at');

      if (metaError) {
        logger.error('timeline.sync.meta', 'Failed to fetch metadata', { error: metaError.message });
        return cache.data;
      }

      const currentIds = new Set((meta || []).map((r) => r.id));
      const maxUpdatedAt = (meta || []).reduce((max, r) => r.updated_at > max ? r.updated_at : max, '');
      const cachedIds = new Set(cache.data.map((e) => e.id));

      // Nothing changed — return cache as-is
      if (maxUpdatedAt <= cache.lastSyncTime && currentIds.size === cachedIds.size && [...currentIds].every((id) => cachedIds.has(id))) {
        logger.info('timeline.sync', 'No changes detected, using cache', { cachedCount: cache.data.length });
        return cache.data;
      }

      // Fetch only changed rows
      const { data: delta, error: deltaError } = await supabase
        .from('timeline_entries')
        .select('id, date, title, description')
        .gt('updated_at', cache.lastSyncTime);

      if (deltaError) {
        logger.error('timeline.sync.delta', 'Delta fetch failed, falling back to cache', { error: deltaError.message });
        return cache.data;
      }

      // Fetch photo IDs for changed entries + any new entries
      const { data: photoData } = await supabase
        .from('timeline_entries')
        .select('id')
        .not('photo', 'is', null);
      const idsWithPhotos = new Set((photoData || []).map((p) => p.id));

      // Build delta map
      const deltaMap = new Map((delta || []).map((e) => [e.id, {
        id: e.id, date: e.date, title: e.title, description: e.description,
        hasPhoto: idsWithPhotos.has(e.id),
      }]));

      // Merge: keep cached entries that still exist, apply updates
      let merged = cache.data
        .filter((e) => currentIds.has(e.id))
        .map((e) => deltaMap.get(e.id) || { ...e, hasPhoto: idsWithPhotos.has(e.id) });

      // Add new entries (in delta but not in old cache)
      const mergedIds = new Set(merged.map((e) => e.id));
      for (const entry of deltaMap.values()) {
        if (!mergedIds.has(entry.id)) merged.push(entry);
      }

      merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const syncTime = new Date().toISOString();
      setSyncCache(CACHE_TIMELINE, merged, syncTime);
      logger.info('timeline.sync', 'Incremental sync complete', { deltaCount: delta?.length || 0, total: merged.length });
      return merged;
    }

    // No cache or no lastSyncTime — full fetch
    const { data, error } = await supabase
      .from('timeline_entries')
      .select('id, date, title, description')
      .order('date', { ascending: true });

    if (error) {
      logger.error('timeline.fetch', 'Failed to fetch timeline', { error: error.message, code: error.code });
      return cache?.data || [];
    }

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

    const syncTime = new Date().toISOString();
    setSyncCache(CACHE_TIMELINE, entries, syncTime);
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

  addTimelineEntry: async (entry: TimelineEntry): Promise<void> => {
    logger.info('timeline.add', 'Adding timeline entry', { id: entry.id, title: entry.title, hasPhoto: !!entry.photo });

    let photoValue: string | null = null;
    if (entry.photo) {
      if (entry.photo.startsWith('data:')) {
        photoValue = await uploadPhoto(entry.id, entry.photo);
      } else {
        photoValue = entry.photo;
      }
    }

    const { error } = await supabase.from('timeline_entries').insert({
      id: entry.id,
      date: entry.date,
      title: entry.title,
      description: entry.description,
      photo: photoValue,
    });

    if (error) {
      logger.error('timeline.add', 'Failed to add timeline entry', { id: entry.id, error: error.message, code: error.code });
      throw new Error(`Failed to add timeline entry: ${error.message}`);
    }
  },

  updateTimelineEntry: async (entry: TimelineEntry): Promise<void> => {
    logger.info('timeline.update', 'Updating timeline entry', { id: entry.id, title: entry.title });

    let photoValue: string | null = null;
    if (entry.photo) {
      if (entry.photo.startsWith('data:')) {
        photoValue = await uploadPhoto(entry.id, entry.photo);
      } else {
        photoValue = entry.photo;
      }
    }

    const { error } = await supabase
      .from('timeline_entries')
      .update({
        date: entry.date,
        title: entry.title,
        description: entry.description,
        photo: photoValue,
      })
      .eq('id', entry.id);

    if (error) {
      logger.error('timeline.update', 'Failed to update timeline entry', { id: entry.id, error: error.message, code: error.code });
      throw new Error(`Failed to update timeline entry: ${error.message}`);
    }
  },

  deleteTimelineEntry: async (id: string): Promise<void> => {
    logger.info('timeline.delete', 'Deleting timeline entry', { id });

    const { error } = await supabase.from('timeline_entries').delete().eq('id', id);
    // Also clean up photo from Storage (ignore errors)
    deletePhoto(id);

    if (error) {
      logger.error('timeline.delete', 'Failed to delete timeline entry', { id, error: error.message, code: error.code });
      throw new Error(`Failed to delete timeline entry: ${error.message}`);
    }
  },

  // Letters - incremental sync
  getCachedLetters: (): Letter[] | null => {
    return getCachedData<Letter>(CACHE_LETTERS);
  },

  syncLetters: async (): Promise<Letter[]> => {
    const cache = getSyncCache<Letter>(CACHE_LETTERS);

    if (cache && cache.lastSyncTime) {
      const { data: meta, error: metaError } = await supabase
        .from('letters')
        .select('id, updated_at');

      if (metaError) {
        logger.error('letters.sync.meta', 'Failed to fetch metadata', { error: metaError.message });
        return cache.data;
      }

      const currentIds = new Set((meta || []).map((r) => r.id));
      const maxUpdatedAt = (meta || []).reduce((max, r) => r.updated_at > max ? r.updated_at : max, '');
      const cachedIds = new Set(cache.data.map((e) => e.id));

      if (maxUpdatedAt <= cache.lastSyncTime && currentIds.size === cachedIds.size && [...currentIds].every((id) => cachedIds.has(id))) {
        logger.info('letters.sync', 'No changes detected, using cache', { cachedCount: cache.data.length });
        return cache.data;
      }

      const { data: delta, error: deltaError } = await supabase
        .from('letters')
        .select('*')
        .gt('updated_at', cache.lastSyncTime);

      if (deltaError) {
        logger.error('letters.sync.delta', 'Delta fetch failed, falling back to cache', { error: deltaError.message });
        return cache.data;
      }

      const deltaMap = new Map((delta || []).map((l) => [l.id, {
        id: l.id, title: l.title, content: l.content,
        isOpened: l.is_opened, createdAt: l.created_at,
      }]));

      let merged = cache.data
        .filter((l) => currentIds.has(l.id))
        .map((l) => deltaMap.get(l.id) || l);

      const mergedIds = new Set(merged.map((l) => l.id));
      for (const letter of deltaMap.values()) {
        if (!mergedIds.has(letter.id)) merged.push(letter);
      }

      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const syncTime = new Date().toISOString();
      setSyncCache(CACHE_LETTERS, merged, syncTime);
      logger.info('letters.sync', 'Incremental sync complete', { deltaCount: delta?.length || 0, total: merged.length });
      return merged;
    }

    // Full fetch
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('letters.fetch', 'Failed to fetch letters', { error: error.message, code: error.code });
      return cache?.data || [];
    }

    const letters = (data || []).map((letter) => ({
      id: letter.id,
      title: letter.title,
      content: letter.content,
      isOpened: letter.is_opened,
      createdAt: letter.created_at,
    }));

    const syncTime = new Date().toISOString();
    setSyncCache(CACHE_LETTERS, letters, syncTime);
    return letters;
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
      throw new Error(`Failed to add letter: ${error.message}`);
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
      throw new Error(`Failed to update letter: ${error.message}`);
    }
  },

  deleteLetter: async (id: string): Promise<void> => {
    logger.info('letter.delete', 'Deleting letter', { id });

    const { error } = await supabase.from('letters').delete().eq('id', id);

    if (error) {
      logger.error('letter.delete', 'Failed to delete letter', { id, error: error.message, code: error.code });
      throw new Error(`Failed to delete letter: ${error.message}`);
    }
  },

  // Flowers - incremental sync
  getCachedFlowers: (): Flower[] | null => {
    return getCachedData<Flower>(CACHE_FLOWERS);
  },

  syncFlowers: async (): Promise<Flower[]> => {
    const cache = getSyncCache<Flower>(CACHE_FLOWERS);

    if (cache && cache.lastSyncTime) {
      const { data: meta, error: metaError } = await supabase
        .from('flowers')
        .select('id, updated_at');

      if (metaError) {
        logger.error('flowers.sync.meta', 'Failed to fetch metadata', { error: metaError.message });
        return cache.data;
      }

      const currentIds = new Set((meta || []).map((r) => r.id));
      const maxUpdatedAt = (meta || []).reduce((max, r) => r.updated_at > max ? r.updated_at : max, '');
      const cachedIds = new Set(cache.data.map((e) => e.id));

      if (maxUpdatedAt <= cache.lastSyncTime && currentIds.size === cachedIds.size && [...currentIds].every((id) => cachedIds.has(id))) {
        logger.info('flowers.sync', 'No changes detected, using cache', { cachedCount: cache.data.length });
        return cache.data;
      }

      const { data: delta, error: deltaError } = await supabase
        .from('flowers')
        .select('*')
        .gt('updated_at', cache.lastSyncTime);

      if (deltaError) {
        logger.error('flowers.sync.delta', 'Delta fetch failed, falling back to cache', { error: deltaError.message });
        return cache.data;
      }

      const deltaMap = new Map((delta || []).map((f) => [f.id, {
        id: f.id, message: f.message, isBloomed: f.is_bloomed, type: f.type as Flower['type'],
      }]));

      let merged = cache.data
        .filter((f) => currentIds.has(f.id))
        .map((f) => deltaMap.get(f.id) || f);

      const mergedIds = new Set(merged.map((f) => f.id));
      for (const flower of deltaMap.values()) {
        if (!mergedIds.has(flower.id)) merged.push(flower);
      }

      const syncTime = new Date().toISOString();
      setSyncCache(CACHE_FLOWERS, merged, syncTime);
      logger.info('flowers.sync', 'Incremental sync complete', { deltaCount: delta?.length || 0, total: merged.length });
      return merged;
    }

    // Full fetch
    const { data, error } = await supabase
      .from('flowers')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('flowers.fetch', 'Failed to fetch flowers', { error: error.message, code: error.code });
      return cache?.data || [];
    }

    const flowers = (data || []).map((flower) => ({
      id: flower.id,
      message: flower.message,
      isBloomed: flower.is_bloomed,
      type: flower.type as Flower['type'],
    }));

    const syncTime = new Date().toISOString();
    setSyncCache(CACHE_FLOWERS, flowers, syncTime);
    return flowers;
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
      throw new Error(`Failed to add flower: ${error.message}`);
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
      throw new Error(`Failed to update flower: ${error.message}`);
    }
  },

  deleteFlower: async (id: string): Promise<void> => {
    logger.info('flower.delete', 'Deleting flower', { id });

    const { error } = await supabase.from('flowers').delete().eq('id', id);

    if (error) {
      logger.error('flower.delete', 'Failed to delete flower', { id, error: error.message, code: error.code });
      throw new Error(`Failed to delete flower: ${error.message}`);
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
