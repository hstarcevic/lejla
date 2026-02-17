export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  photo?: string;
  hasPhoto?: boolean;
}

export interface Letter {
  id: string;
  title: string;
  content: string;
  isOpened: boolean;
  createdAt: string;
}

export interface Flower {
  id: string;
  message: string;
  isBloomed: boolean;
  type: 'rose' | 'tulip' | 'daisy' | 'lily' | 'sunflower';
}

export type Page = 'timeline' | 'letters' | 'garden';
