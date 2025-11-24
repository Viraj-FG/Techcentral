import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Splash from '../Splash';

describe('Splash', () => {
  it('renders splash screen', () => {
    render(<Splash onComplete={() => {}} />);
    expect(screen.getByText('K')).toBeInTheDocument();
    expect(screen.getAllByText('A')).toHaveLength(2);
    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.getByText('V')).toBeInTheDocument();
  });

  it('calls onComplete after interaction', () => {
    vi.useFakeTimers();
    const mockComplete = vi.fn();
    render(<Splash onComplete={mockComplete} />);

    // Fast forward loading timer
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    const button = screen.getByText('Get Started');
    fireEvent.click(button);

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(mockComplete).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
