import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorialOverlay from '../TutorialOverlay';

describe('TutorialOverlay', () => {
  it('renders when open', () => {
    render(<TutorialOverlay isOpen={true} onDismiss={() => {}} />);
    expect(screen.getByText('Welcome to Kaeva')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<TutorialOverlay isOpen={false} onDismiss={() => {}} />);
    expect(screen.queryByText('Welcome to Kaeva')).not.toBeInTheDocument();
  });

  it('calls onDismiss when dismissed', () => {
    const mockDismiss = vi.fn();
    render(<TutorialOverlay isOpen={true} onDismiss={mockDismiss} />);

    const button = screen.getByText('Got it!');
    fireEvent.click(button);

    expect(mockDismiss).toHaveBeenCalled();
  });
});
