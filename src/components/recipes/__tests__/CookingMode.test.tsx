import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CookingMode } from '../CookingMode';

// Mock the custom hook
vi.mock('@/hooks/useVoiceCooking', () => ({
  useVoiceCooking: () => ({
    isListening: false,
    startListening: vi.fn(),
    stopListening: vi.fn(),
    speak: vi.fn(),
    stopSpeaking: vi.fn(),
  }),
}));

const mockRecipe = {
  id: '1',
  user_id: 'user-1',
  name: 'Test Recipe',
  ingredients: [],
  instructions: [
    { text: 'Step 1: Mix' },
    { text: 'Step 2: Cook' }
  ],
};

describe('CookingMode', () => {
  const mockOnComplete = vi.fn();
  const mockOnBack = vi.fn();

  it('renders current step', () => {
    render(
      <CookingMode
        recipe={mockRecipe}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 1: Mix')).toBeInTheDocument();
  });

  it('navigates to next step', async () => {
    render(
      <CookingMode
        recipe={mockRecipe}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Step 2: Cook/)).toBeInTheDocument();
    });
  });

  it('navigates to previous step', async () => {
    render(
      <CookingMode
        recipe={mockRecipe}
        onComplete={mockOnComplete}
        onBack={mockOnBack}
      />
    );

    // Go to step 2
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Step 2: Cook/)).toBeInTheDocument();
    });

    // Go back to step 1
    const prevButton = screen.getByRole('button', { name: /previous/i });
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText(/Step 1: Mix/)).toBeInTheDocument();
    });
  });
});
