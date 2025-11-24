import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the message', () => {
    render(<LoadingState message="Please wait..." />);
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('calls onTimeout after the specified duration', () => {
    const onTimeout = vi.fn();
    render(<LoadingState timeout={1000} onTimeout={onTimeout} />);

    expect(onTimeout).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onTimeout).toHaveBeenCalled();
  });
});
