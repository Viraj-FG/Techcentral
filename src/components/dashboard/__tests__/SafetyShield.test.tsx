import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SafetyShield from '../SafetyShield';

describe('SafetyShield', () => {
  it('renders nothing if no filters', () => {
    const profile = { dietary_preferences: [], allergies: [] };
    const { container } = render(<SafetyShield profile={profile} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders badges for preferences', () => {
    const profile = { 
      dietary_preferences: ['Vegan'], 
      allergies: ['Peanut'] 
    };
    render(<SafetyShield profile={profile} />);
    
    expect(screen.getByText('V')).toBeInTheDocument(); // Vegan abbreviation
    expect(screen.getByText('P')).toBeInTheDocument(); // Peanut-Free abbreviation
  });
});
