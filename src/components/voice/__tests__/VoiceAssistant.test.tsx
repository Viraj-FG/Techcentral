import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VoiceAssistant from '../VoiceAssistant';
import { useVoiceConversation } from '@/hooks/useVoiceConversation';

// Mock useVoiceConversation
vi.mock('@/hooks/useVoiceConversation', () => ({
  useVoiceConversation: vi.fn(),
}));

// Mock ConversationOverlay
vi.mock('../ConversationOverlay', () => ({
  default: ({ isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="conversation-overlay">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

describe('VoiceAssistant', () => {
  const mockEndConversation = vi.fn();
  const mockStartConversation = vi.fn();
  const mockUserProfile = { id: 'user1', name: 'Test User' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when conversation is hidden', () => {
    vi.mocked(useVoiceConversation).mockReturnValue({
      showConversation: false,
      startConversation: mockStartConversation,
      endConversation: mockEndConversation,
      apertureState: 'idle',
      audioAmplitude: 0,
      userTranscript: '',
      aiTranscript: '',
    } as any);

    render(<VoiceAssistant userProfile={mockUserProfile} />);
    expect(screen.queryByTestId('conversation-overlay')).not.toBeInTheDocument();
  });

  it('renders overlay when conversation is shown', () => {
    vi.mocked(useVoiceConversation).mockReturnValue({
      showConversation: true,
      startConversation: mockStartConversation,
      endConversation: mockEndConversation,
      apertureState: 'listening',
      audioAmplitude: 0.5,
      userTranscript: 'Hello',
      aiTranscript: 'Hi',
    } as any);

    render(<VoiceAssistant userProfile={mockUserProfile} />);
    expect(screen.getByTestId('conversation-overlay')).toBeInTheDocument();
  });

  it('closes conversation on ESC key', () => {
    vi.mocked(useVoiceConversation).mockReturnValue({
      showConversation: true,
      startConversation: mockStartConversation,
      endConversation: mockEndConversation,
      apertureState: 'listening',
      audioAmplitude: 0.5,
      userTranscript: '',
      aiTranscript: '',
    } as any);

    render(<VoiceAssistant userProfile={mockUserProfile} />);
    
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockEndConversation).toHaveBeenCalled();
  });
});
