import { supabase } from '../lib/supabase';
import { TimelineEntry, Letter, Flower } from '../types';

// Keep auth in localStorage since it's session-specific
const AUTH_KEY = 'lejla_authenticated';

export const storage = {
  // Timeline - now using Supabase
  getTimeline: async (): Promise<TimelineEntry[]> => {
    const { data, error } = await supabase
      .from('timeline_entries')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching timeline:', error);
      return [];
    }

    return (data || []).map((entry) => ({
      id: entry.id,
      date: entry.date,
      title: entry.title,
      description: entry.description,
      photo: entry.photo || undefined,
    }));
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
        console.error('Error saving timeline:', error);
      }
    }
  },

  addTimelineEntry: async (entry: TimelineEntry): Promise<void> => {
    const { error } = await supabase.from('timeline_entries').insert({
      id: entry.id,
      date: entry.date,
      title: entry.title,
      description: entry.description,
      photo: entry.photo || null,
    });

    if (error) {
      console.error('Error adding timeline entry:', error);
    }
  },

  updateTimelineEntry: async (entry: TimelineEntry): Promise<void> => {
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
      console.error('Error updating timeline entry:', error);
    }
  },

  deleteTimelineEntry: async (id: string): Promise<void> => {
    const { error } = await supabase.from('timeline_entries').delete().eq('id', id);

    if (error) {
      console.error('Error deleting timeline entry:', error);
    }
  },

  // Letters - now using Supabase
  getLetters: async (): Promise<Letter[]> => {
    const { data, error } = await supabase
      .from('letters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching letters:', error);
      return [];
    }

    return (data || []).map((letter) => ({
      id: letter.id,
      title: letter.title,
      content: letter.content,
      isOpened: letter.is_opened,
      createdAt: letter.created_at,
    }));
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
        console.error('Error saving letters:', error);
      }
    }
  },

  addLetter: async (letter: Letter): Promise<void> => {
    const { error } = await supabase.from('letters').insert({
      id: letter.id,
      title: letter.title,
      content: letter.content,
      is_opened: letter.isOpened,
      created_at: letter.createdAt,
    });

    if (error) {
      console.error('Error adding letter:', error);
    }
  },

  updateLetter: async (letter: Letter): Promise<void> => {
    const { error } = await supabase
      .from('letters')
      .update({
        title: letter.title,
        content: letter.content,
        is_opened: letter.isOpened,
      })
      .eq('id', letter.id);

    if (error) {
      console.error('Error updating letter:', error);
    }
  },

  deleteLetter: async (id: string): Promise<void> => {
    const { error } = await supabase.from('letters').delete().eq('id', id);

    if (error) {
      console.error('Error deleting letter:', error);
    }
  },

  // Flowers - now using Supabase
  getFlowers: async (): Promise<Flower[]> => {
    const { data, error } = await supabase
      .from('flowers')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching flowers:', error);
      return [];
    }

    return (data || []).map((flower) => ({
      id: flower.id,
      message: flower.message,
      isBloomed: flower.is_bloomed,
      type: flower.type as Flower['type'],
    }));
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
        console.error('Error saving flowers:', error);
      }
    }
  },

  addFlower: async (flower: Flower): Promise<void> => {
    const { error } = await supabase.from('flowers').insert({
      id: flower.id,
      message: flower.message,
      is_bloomed: flower.isBloomed,
      type: flower.type,
    });

    if (error) {
      console.error('Error adding flower:', error);
    }
  },

  updateFlower: async (flower: Flower): Promise<void> => {
    const { error } = await supabase
      .from('flowers')
      .update({
        message: flower.message,
        is_bloomed: flower.isBloomed,
        type: flower.type,
      })
      .eq('id', flower.id);

    if (error) {
      console.error('Error updating flower:', error);
    }
  },

  deleteFlower: async (id: string): Promise<void> => {
    const { error } = await supabase.from('flowers').delete().eq('id', id);

    if (error) {
      console.error('Error deleting flower:', error);
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
      console.error('Error saving password:', error);
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
