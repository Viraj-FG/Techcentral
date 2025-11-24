import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import VoiceOnboarding from '../VoiceOnboarding';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  },
}));

// Mock hooks
vi.mock('@/hooks/useOnboardingConversation', () => ({
  useOnboardingConversation: () => ({
    conversation: { status: 'disconnected' },
    startConversation: vi.fn(),
    stopConversation: vi.fn(),
    processUserMessage: vi.fn(),
    isProcessing: false,
  }),
}));

// Mock child components to simplify testing
vi.mock('../PermissionRequest', () => ({
  default: ({ onPermissionsGranted }: any) => (
    <button onClick={onPermissionsGranted}>Grant Permissions Mock</button>
  ),
}));

vi.mock('../TutorialOverlay', () => ({
  default: ({ isOpen, onDismiss }: any) => (
    isOpen ? <button onClick={onDismiss}>Tutorial Mock</button> : null
  ),
}));

describe('VoiceOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Default Supabase mocks
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { is_admin: false },
    });
  });

  it('renders tutorial initially', () => {
    render(<VoiceOnboarding onComplete={() => {}} />);
    expect(screen.getByText('Tutorial Mock')).toBeInTheDocument();
  });

  it('shows permission request after tutorial is dismissed', async () => {
    render(<VoiceOnboarding onComplete={() => {}} />);
    
    // Dismiss tutorial
    fireEvent.click(screen.getByText('Tutorial Mock'));
    
    await waitFor(() => {
      expect(screen.getByText('Grant Permissions Mock')).toBeInTheDocument();
    });
  });

  it('renders permission request immediately if tutorial already seen', () => {
    localStorage.setItem('kaeva_tutorial_seen', 'true');
    render(<VoiceOnboarding onComplete={() => {}} />);
    expect(screen.getByText('Grant Permissions Mock')).toBeInTheDocument();
  });
});
