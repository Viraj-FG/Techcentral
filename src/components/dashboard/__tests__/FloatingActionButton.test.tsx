import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FloatingActionButton from '../FloatingActionButton';
import { BrowserRouter } from 'react-router-dom';

// Mock hooks
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Mock VisionSpotlight to avoid complex children rendering
vi.mock('../VisionSpotlight', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? <div data-testid="vision-spotlight">Vision Spotlight <button onClick={onClose}>Close</button></div> : null
  ),
}));

describe('FloatingActionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the floating action button', () => {
    render(
      <BrowserRouter>
        <FloatingActionButton />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /kaeva aperture/i })).toBeInTheDocument();
  });

  it('opens spotlight on click', async () => {
    render(
      <BrowserRouter>
        <FloatingActionButton />
      </BrowserRouter>
    );
    
    const button = screen.getByRole('button', { name: /kaeva aperture/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByTestId('vision-spotlight')).toBeInTheDocument();
    });
  });

  it('opens spotlight on keyboard shortcut (Cmd+Shift+V)', async () => {
    render(
      <BrowserRouter>
        <FloatingActionButton />
      </BrowserRouter>
    );

    fireEvent.keyDown(document, { key: 'v', metaKey: true, shiftKey: true });

    await waitFor(() => {
      expect(screen.getByTestId('vision-spotlight')).toBeInTheDocument();
    });
  });
});
