import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Auth from '../Auth';
import { mockSupabase } from '../../test/mocks/supabase';
import { Toaster } from '@/components/ui/toaster';

// Mock components that might cause issues
vi.mock('@/components/AuroraBackground', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const renderAuth = () => {
  return render(
    <BrowserRouter>
      <Auth />
      <Toaster />
    </BrowserRouter>
  );
};

describe('Auth Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign in form by default', () => {
    renderAuth();
    expect(screen.getByText(/Your Multi-Vertical Digital Twin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
  });

  it('toggles to sign up form', () => {
    renderAuth();
    const toggleButton = screen.getByText(/sign up/i, { selector: 'span' });
    fireEvent.click(toggleButton);

    expect(screen.getByText(/create account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('handles sign in submission', async () => {
    renderAuth();
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    // Use getAllByRole because there are multiple buttons, pick the submit one
    const submitButton = screen.getByRole('button', { name: /sign in$/i }); // $ for exact end match to avoid "Sign in with Google"

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { user: { id: '123' } } },
      error: null
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('handles sign up submission', async () => {
    renderAuth();
    
    // Switch to sign up - check for the span text inside the button
    const toggleButton = screen.getByText(/sign up/i, { selector: 'span' });
    fireEvent.click(toggleButton);

    expect(screen.getByText(/create account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/email/i);
    // Use getAllByLabelText and pick the first one (Password) or be more specific
    const passwordInput = screen.getByLabelText(/^password$/i); // Exact match
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: '123' } },
      error: null
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: expect.any(Object)
      });
    });
  });

  it('displays error on failed login', async () => {
    renderAuth();
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /sign in$/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Invalid login credentials', status: 401 }
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      // The error message might be transformed by errorHandler
      // Based on previous output, it seems to show "Invalid email or password" or similar
      // It appears in both the alert and the toast, so we use getAllByText
      const errorMessages = screen.getAllByText(/invalid email or password|invalid login credentials/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });
});
