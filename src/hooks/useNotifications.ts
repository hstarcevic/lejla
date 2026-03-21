import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// Track IDs we wrote ourselves so we don't self-notify
const ownWrites = new Set<string>();
const OWN_WRITE_TTL = 10_000; // forget after 10s

export function trackOwnWrite(id: string) {
  ownWrites.add(id);
  setTimeout(() => ownWrites.delete(id), OWN_WRITE_TTL);
}

function getNotificationText(table: string): { title: string; body: string } {
  switch (table) {
    case 'timeline_entries':
      return { title: 'Nova uspomena!', body: 'Dodana je nova uspomena na timeline.' };
    case 'letters':
      return { title: 'Novo pismo!', body: 'Stiglo ti je novo pismo.' };
    case 'flowers':
      return { title: 'Novi cvijet!', body: 'Novi cvijet je posađen u vrtu.' };
    default:
      return { title: 'Novo!', body: 'Nešto novo je dodano.' };
  }
}

function showNotification(table: string) {
  const { title, body } = getNotificationText(table);

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/lejla/pwa-192x192.png',
      badge: '/lejla/pwa-192x192.png',
      tag: `lejla-${table}`,
    });
  }
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((perm) => {
      logger.info('notifications.permission', `Permission: ${perm}`);
    });
  }
}

export function useNotifications(enabled: boolean) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('app-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'timeline_entries' }, (payload) => {
        if (!ownWrites.has(payload.new.id)) showNotification('timeline_entries');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'letters' }, (payload) => {
        if (!ownWrites.has(payload.new.id)) showNotification('letters');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'flowers' }, (payload) => {
        if (!ownWrites.has(payload.new.id)) showNotification('flowers');
      })
      .subscribe((status) => {
        logger.info('realtime.status', `Realtime channel: ${status}`);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [enabled]);
}
