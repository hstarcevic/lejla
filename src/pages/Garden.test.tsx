import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { Flower } from '../types';

const { mockHook } = vi.hoisted(() => ({
  mockHook: {
    flowers: [] as Array<{ id: string; message: string; isBloomed: boolean; type: string }>,
    isLoading: false,
    isSyncing: false,
    addFlower: vi.fn(async () => {}),
    updateFlower: vi.fn(async () => {}),
    deleteFlower: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
  },
}));

vi.mock('../hooks/useLocalStorage', () => ({
  useFlowers: () => mockHook,
}));

vi.mock('../utils/storage', () => ({
  generateId: () => 'mock-flower-id',
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

import Garden from './Garden';

beforeEach(() => {
  vi.clearAllMocks();
  mockHook.flowers = [];
  mockHook.isLoading = false;
});

describe('Garden', () => {
  it('renders empty state', () => {
    render(<Garden />);
    expect(screen.getByText('Bašta je prazna')).toBeInTheDocument();
    expect(screen.getByText('Posadi prvi cvijet')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    mockHook.isLoading = true;
    render(<Garden />);
    expect(screen.getByText('Učitavanje bašte...')).toBeInTheDocument();
  });

  it('renders bloomed flower emoji', () => {
    mockHook.flowers = [
      { id: '1', message: 'love', isBloomed: true, type: 'rose' },
    ];
    render(<Garden />);
    expect(screen.getByText('🌹')).toBeInTheDocument();
  });

  it('opens plant form on Posadi click', async () => {
    const user = userEvent.setup();
    render(<Garden />);

    await user.click(screen.getByText('Posadi'));
    expect(screen.getByPlaceholderText('Razlog zašto te volim...')).toBeInTheDocument();
    // All flower type selector buttons visible
    expect(screen.getByText('🌹')).toBeInTheDocument();
    expect(screen.getByText('🌷')).toBeInTheDocument();
    expect(screen.getByText('🌼')).toBeInTheDocument();
    expect(screen.getByText('🌻')).toBeInTheDocument();
  });

  it('submits new flower with default type', async () => {
    const user = userEvent.setup();
    render(<Garden />);

    await user.click(screen.getByText('Posadi'));
    await user.type(screen.getByPlaceholderText('Razlog zašto te volim...'), 'Your smile');

    const form = screen.getByPlaceholderText('Razlog zašto te volim...').closest('form')!;
    const submitBtn = form.querySelector('button[type="submit"]')!;
    await user.click(submitBtn);

    expect(mockHook.addFlower).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'mock-flower-id',
        message: 'Your smile',
        isBloomed: false,
        type: 'rose',
      })
    );
  });

  it('selects different flower type before submitting', async () => {
    const user = userEvent.setup();
    render(<Garden />);

    await user.click(screen.getByText('Posadi'));
    await user.click(screen.getByText('🌻'));
    await user.type(screen.getByPlaceholderText('Razlog zašto te volim...'), 'Sunshine');

    const form = screen.getByPlaceholderText('Razlog zašto te volim...').closest('form')!;
    const submitBtn = form.querySelector('button[type="submit"]')!;
    await user.click(submitBtn);

    expect(mockHook.addFlower).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'sunflower' })
    );
  });

  it('blooms a flower on click', async () => {
    const user = userEvent.setup();
    mockHook.flowers = [
      { id: '1', message: 'love you', isBloomed: false, type: 'daisy' },
    ];
    render(<Garden />);

    // The unbloomed flower is inside the grid
    const grid = document.querySelector('.grid')!;
    const flowerCell = grid.firstElementChild as HTMLElement;
    await user.click(flowerCell);

    expect(mockHook.updateFlower).toHaveBeenCalledWith(
      expect.objectContaining({ id: '1', isBloomed: true })
    );
  });

  it('does not re-bloom already bloomed flower', async () => {
    const user = userEvent.setup();
    mockHook.flowers = [
      { id: '1', message: 'love', isBloomed: true, type: 'rose' },
    ];
    render(<Garden />);

    await user.click(screen.getByText('🌹'));
    expect(mockHook.updateFlower).not.toHaveBeenCalled();
  });
});
