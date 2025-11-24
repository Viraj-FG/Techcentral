import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SleepingKaeva from '../SleepingKaeva';

describe('SleepingKaeva', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders aperture', () => {
    render(<SleepingKaeva onWake={() => {}} />);
    // KaevaAperture renders a div with size classes.
    // We can check if it renders.
    // Or mock KaevaAperture.
  });

  it('wakes up on timeout fallback', async () => {
    vi.useFakeTimers();
    const mockWake = vi.fn();
    
    // Ensure SpeechRecognition is undefined to trigger fallback
    (window as any).webkitSpeechRecognition = undefined;
    (window as any).SpeechRecognition = undefined;

    render(<SleepingKaeva onWake={mockWake} />);

    vi.advanceTimersByTime(3000);

    expect(mockWake).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
