import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DigitalTwinSummary from '../DigitalTwinSummary';

describe('DigitalTwinSummary', () => {
  const mockProfile = {
    language: 'en',
    dietaryRestrictions: {
      values: ['Vegan'],
      allergies: ['Nuts'],
    },
    skinProfile: ['Dry'],
    household: {
      adults: 2,
      kids: 0,
      dogs: 1,
      cats: 0,
    },
    missions: {
      medical: [],
      lifestyle: [],
    },
    internalFlags: {
      enableToxicFoodWarnings: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders summary and handles completion', async () => {
    const mockComplete = vi.fn();
    render(<DigitalTwinSummary profile={mockProfile} onComplete={mockComplete} />);

    const button = screen.getByText('ENTER KAEVA');
    fireEvent.click(button);

    await waitFor(() => {
      expect(localStorage.getItem('kaeva_onboarding_complete')).toBe('true');
      expect(mockComplete).toHaveBeenCalled();
    });
  });
});
