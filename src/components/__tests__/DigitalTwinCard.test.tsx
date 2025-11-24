import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DigitalTwinCard from '../DigitalTwinCard';

describe('DigitalTwinCard', () => {
  const mockProfile = {
    userName: 'Test User',
    dietaryValues: ['Vegan', 'Halal'],
    allergies: ['Peanuts'],
    beautyProfile: {
      skinType: 'Dry',
      hairType: 'Curly',
    },
    household: {
      adults: 2,
      kids: 1,
      dogs: 1,
      cats: 0,
    },
    healthGoals: ['Fitness'],
    lifestyleGoals: ['Sustainability'],
  };

  it('renders profile information', () => {
    render(
      <DigitalTwinCard
        profile={mockProfile}
        onUpdate={() => {}}
        onComplete={() => {}}
      />
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Vegan')).toBeInTheDocument();
    expect(screen.getByText('Halal')).toBeInTheDocument();
    expect(screen.getByText('Peanuts')).toBeInTheDocument();
  });
});
