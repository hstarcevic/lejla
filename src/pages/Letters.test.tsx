import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const { mockHook } = vi.hoisted(() => ({
  mockHook: {
    letters: [] as Array<{ id: string; title: string; content: string; isOpened: boolean; createdAt: string }>,
    isLoading: false,
    isSyncing: false,
    addLetter: vi.fn(async () => {}),
    updateLetter: vi.fn(async () => {}),
    deleteLetter: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
  },
}));

vi.mock('../hooks/useLocalStorage', () => ({
  useLetters: () => mockHook,
}));

vi.mock('../utils/storage', () => ({
  generateId: () => 'mock-letter-id',
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) =>
      <div ref={ref} {...props}>{children}</div>
    ),
    form: ({ children, onSubmit, className }: React.PropsWithChildren<{ onSubmit?: React.FormEventHandler; className?: string }>) =>
      <form onSubmit={onSubmit} className={className}>{children}</form>,
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <p>{children}</p>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

import Letters from './Letters';

beforeEach(() => {
  vi.clearAllMocks();
  mockHook.letters = [];
  mockHook.isLoading = false;
});

describe('Letters', () => {
  it('renders empty state', () => {
    render(<Letters />);
    expect(screen.getByText('Još nema pisama')).toBeInTheDocument();
    expect(screen.getByText('Napiši prvo ljubavno pismo')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    mockHook.isLoading = true;
    render(<Letters />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders letter cards', () => {
    mockHook.letters = [
      { id: '1', title: 'My Love', content: 'xo', isOpened: false, createdAt: '2024-01-01' },
      { id: '2', title: 'Forever', content: 'always', isOpened: true, createdAt: '2024-01-02' },
    ];
    render(<Letters />);
    expect(screen.getByText('My Love')).toBeInTheDocument();
    expect(screen.getByText('Forever')).toBeInTheDocument();
  });

  it('opens add form on Dodaj click', async () => {
    const user = userEvent.setup();
    render(<Letters />);

    await user.click(screen.getByText('Dodaj'));
    expect(screen.getByPlaceholderText('Pismo za tebe...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Piši od srca...')).toBeInTheDocument();
  });

  it('submits new letter', async () => {
    const user = userEvent.setup();
    render(<Letters />);

    await user.click(screen.getByText('Dodaj'));
    await user.type(screen.getByPlaceholderText('Pismo za tebe...'), 'Dear Lejla');
    await user.type(screen.getByPlaceholderText('Piši od srca...'), 'I love you so much');

    const form = screen.getByPlaceholderText('Pismo za tebe...').closest('form')!;
    const submitBtn = form.querySelector('button[type="submit"]')!;
    await user.click(submitBtn);

    expect(mockHook.addLetter).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mock-letter-id',
        title: 'Dear Lejla',
        content: 'I love you so much',
        isOpened: false,
      })
    );
  });

  it('opens letter modal on click and marks as opened', async () => {
    const user = userEvent.setup();
    mockHook.letters = [
      { id: '1', title: 'Secret', content: 'I love you', isOpened: false, createdAt: '2024-01-01' },
    ];
    render(<Letters />);

    await user.click(screen.getByText('Secret'));

    expect(mockHook.updateLetter).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', isOpened: true })
    );
  });

  it('does not re-mark already opened letter', async () => {
    const user = userEvent.setup();
    mockHook.letters = [
      { id: '1', title: 'Opened', content: 'hello', isOpened: true, createdAt: '2024-01-01' },
    ];
    render(<Letters />);

    await user.click(screen.getByText('Opened'));
    expect(mockHook.updateLetter).not.toHaveBeenCalled();
  });
});
