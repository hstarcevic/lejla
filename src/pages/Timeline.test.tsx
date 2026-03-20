import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const { mockHook } = vi.hoisted(() => ({
  mockHook: {
    entries: [] as Array<{ id: string; date: string; title: string; description: string; photo?: string; hasPhoto?: boolean }>,
    isLoading: false,
    isSyncing: false,
    addEntry: vi.fn(async () => {}),
    updateEntry: vi.fn(async () => {}),
    deleteEntry: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
  },
}));

vi.mock('../hooks/useLocalStorage', () => ({
  useTimeline: () => mockHook,
}));

vi.mock('../utils/storage', () => ({
  generateId: () => 'mock-id-123',
  storage: { getTimelineEntryPhoto: vi.fn(async () => undefined) },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) =>
      <div ref={ref} {...props}>{children}</div>
    ),
    form: ({ children, onSubmit, className }: React.PropsWithChildren<{ onSubmit?: React.FormEventHandler; className?: string }>) =>
      <form onSubmit={onSubmit} className={className}>{children}</form>,
    span: ({ children, className }: React.PropsWithChildren<{ className?: string }>) =>
      <span className={className}>{children}</span>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

import Timeline from './Timeline';

beforeEach(() => {
  vi.clearAllMocks();
  mockHook.entries = [];
  mockHook.isLoading = false;
  mockHook.isSyncing = false;
});

describe('Timeline', () => {
  it('renders empty state', () => {
    render(<Timeline />);
    expect(screen.getByText('Još nema uspomena')).toBeInTheDocument();
    expect(screen.getByText('Dodaj prvu uspomenu')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    mockHook.isLoading = true;
    render(<Timeline />);
    expect(screen.getByText('Učitavanje uspomena...')).toBeInTheDocument();
  });

  it('renders entries', () => {
    mockHook.entries = [
      { id: '1', date: '2024-06-15', title: 'First Date', description: 'Amazing day' },
      { id: '2', date: '2024-07-20', title: 'Beach Trip', description: '' },
    ];
    render(<Timeline />);
    expect(screen.getByText('First Date')).toBeInTheDocument();
    expect(screen.getByText('Beach Trip')).toBeInTheDocument();
    expect(screen.getByText('Amazing day')).toBeInTheDocument();
  });

  it('opens add form on Dodaj click', async () => {
    const user = userEvent.setup();
    render(<Timeline />);

    await user.click(screen.getByText('Dodaj'));
    expect(screen.getByPlaceholderText('Prvi dejt, Prvi poljubac...')).toBeInTheDocument();
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
  });

  it('submits new entry', async () => {
    const user = userEvent.setup();
    render(<Timeline />);

    await user.click(screen.getByText('Dodaj'));

    // Find date input by type
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, '2024-03-15');

    const titleInput = screen.getByPlaceholderText('Prvi dejt, Prvi poljubac...');
    await user.type(titleInput, 'Our Anniversary');

    // Click submit button
    const form = titleInput.closest('form')!;
    const submitBtn = form.querySelector('button[type="submit"]')!;
    await user.click(submitBtn);

    expect(mockHook.addEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mock-id-123',
        title: 'Our Anniversary',
        date: '2024-03-15',
      })
    );
  });

  it('shows syncing indicator', () => {
    mockHook.isSyncing = true;
    render(<Timeline />);
    const header = screen.getByText('Naša priča').parentElement;
    expect(header?.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('calls deleteEntry when delete button clicked', async () => {
    const user = userEvent.setup();
    mockHook.entries = [
      { id: 'del-1', date: '2024-06-15', title: 'To Delete', description: '' },
    ];
    render(<Timeline />);

    // Find all buttons inside the entry, delete is the second icon button
    const buttons = document.querySelectorAll('.flex.gap-1 button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    await user.click(buttons[1]); // delete button

    expect(mockHook.deleteEntry).toHaveBeenCalledWith('del-1');
  });
});
