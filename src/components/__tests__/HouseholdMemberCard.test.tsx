import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HouseholdMemberCard, { HouseholdMember } from '../HouseholdMemberCard';

describe('HouseholdMemberCard', () => {
  const mockMember: HouseholdMember = {
    type: 'adult',
    name: 'John Doe',
    age: 30,
    allergies: ['Peanuts'],
  };

  it('renders member information', () => {
    render(<HouseholdMemberCard member={mockMember} index={0} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/Age\s*30/)).toBeInTheDocument();
    expect(screen.getByText('Peanuts')).toBeInTheDocument();
  });
});
