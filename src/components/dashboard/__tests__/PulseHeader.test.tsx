import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PulseHeader from '../PulseHeader';

describe('PulseHeader', () => {
  it('renders greeting and user name', () => {
    const profile = { user_name: 'Test User' };
    render(<PulseHeader profile={profile} />);
    
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    // Greeting depends on time, but "Good" should be there
    expect(screen.getByText(/Good/i)).toBeInTheDocument();
  });
});
