import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShieldStatus from '../ShieldStatus';

describe('ShieldStatus', () => {
  it('renders nothing if no filters', () => {
    const profile = { dietaryValues: [], allergies: [], healthGoals: [] };
    const { container } = render(<ShieldStatus profile={profile} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders active protection list', () => {
    const profile = { 
      dietaryValues: ['Vegan'], 
      allergies: ['Peanut'],
      healthGoals: ['Weight Loss']
    };
    render(<ShieldStatus profile={profile} />);
    
    expect(screen.getByText('Active Protection')).toBeInTheDocument();
    expect(screen.getByText('Vegan')).toBeInTheDocument();
    expect(screen.getByText('Peanut-Free')).toBeInTheDocument();
    expect(screen.getByText('Weight Loss')).toBeInTheDocument();
  });
});
