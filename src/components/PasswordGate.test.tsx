import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: {
    getPassword: vi.fn(async () => ''),
    setPassword: vi.fn(async () => {}),
    isAuthenticated: vi.fn(() => false),
    setAuthenticated: vi.fn(),
  },
}));

vi.mock('../utils/storage', () => ({
  storage: mockStorage,
}));

// Mock framer-motion to render plain elements
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) =>
      <div ref={ref} {...props}>{children}</div>
    ),
    p: ({ children, initial, animate, exit, transition, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

import PasswordGate from './PasswordGate';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PasswordGate', () => {
  it('renders login form when password exists', () => {
    render(<PasswordGate onAuthenticate={vi.fn()} hasExistingPassword={true} />);
    expect(screen.getByPlaceholderText('Lozinka')).toBeInTheDocument();
    expect(screen.getByText('Uđi')).toBeInTheDocument();
  });

  it('renders create password form when no password exists', () => {
    render(<PasswordGate onAuthenticate={vi.fn()} hasExistingPassword={false} />);
    expect(screen.getByPlaceholderText('Kreiraj lozinku')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Potvrdi lozinku')).toBeInTheDocument();
    expect(screen.getByText('Postavi lozinku')).toBeInTheDocument();
  });

  it('shows error for short password during creation', async () => {
    const user = userEvent.setup();
    render(<PasswordGate onAuthenticate={vi.fn()} hasExistingPassword={false} />);

    await user.type(screen.getByPlaceholderText('Kreiraj lozinku'), 'abc');
    await user.type(screen.getByPlaceholderText('Potvrdi lozinku'), 'abc');
    await user.click(screen.getByText('Postavi lozinku'));

    expect(screen.getByText('Lozinka mora imati najmanje 4 znaka')).toBeInTheDocument();
  });

  it('shows error for mismatched passwords', async () => {
    const user = userEvent.setup();
    render(<PasswordGate onAuthenticate={vi.fn()} hasExistingPassword={false} />);

    await user.type(screen.getByPlaceholderText('Kreiraj lozinku'), 'test1234');
    await user.type(screen.getByPlaceholderText('Potvrdi lozinku'), 'different');
    await user.click(screen.getByText('Postavi lozinku'));

    expect(screen.getByText('Lozinke se ne podudaraju')).toBeInTheDocument();
  });

  it('creates password and authenticates on valid creation', async () => {
    const onAuth = vi.fn();
    const user = userEvent.setup();
    render(<PasswordGate onAuthenticate={onAuth} hasExistingPassword={false} />);

    await user.type(screen.getByPlaceholderText('Kreiraj lozinku'), 'test1234');
    await user.type(screen.getByPlaceholderText('Potvrdi lozinku'), 'test1234');
    await user.click(screen.getByText('Postavi lozinku'));

    expect(mockStorage.setPassword).toHaveBeenCalledWith('test1234');
    expect(onAuth).toHaveBeenCalled();
  });

  it('authenticates with correct password', async () => {
    mockStorage.getPassword.mockResolvedValue('secret');
    const onAuth = vi.fn();
    const user = userEvent.setup();
    render(<PasswordGate onAuthenticate={onAuth} hasExistingPassword={true} />);

    await user.type(screen.getByPlaceholderText('Lozinka'), 'secret');
    await user.click(screen.getByText('Uđi'));

    expect(onAuth).toHaveBeenCalled();
  });

  it('shows error on wrong password', async () => {
    mockStorage.getPassword.mockResolvedValue('secret');
    const user = userEvent.setup();
    render(<PasswordGate onAuthenticate={vi.fn()} hasExistingPassword={true} />);

    await user.type(screen.getByPlaceholderText('Lozinka'), 'wrong');
    await user.click(screen.getByText('Uđi'));

    expect(screen.getByText('Netačna lozinka')).toBeInTheDocument();
  });
});
