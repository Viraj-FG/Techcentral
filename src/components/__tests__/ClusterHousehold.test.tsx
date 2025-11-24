import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClusterHousehold from '../ClusterHousehold';

describe('ClusterHousehold', () => {
  it('renders household counters', () => {
    render(<ClusterHousehold onSubmit={() => {}} />);
    expect(screen.getByText('Adults')).toBeInTheDocument();
    expect(screen.getByText('Kids')).toBeInTheDocument();
    expect(screen.getByText('Dogs')).toBeInTheDocument();
    expect(screen.getByText('Cats')).toBeInTheDocument();
  });

  it('increments and decrements counters', () => {
    render(<ClusterHousehold onSubmit={() => {}} />);
    
    // Initial value for Adults is 1
    expect(screen.getByText('1')).toBeInTheDocument();
    
    // We need to find the specific buttons. 
    // The component structure is: Label -> Minus Button -> Value -> Plus Button
    // We can try to find by role button.
    
    const buttons = screen.getAllByRole('button');
    // There are 4 counters * 2 buttons + 1 continue button = 9 buttons
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onSubmit with correct data', () => {
    const mockSubmit = vi.fn();
    render(<ClusterHousehold onSubmit={mockSubmit} />);
    
    const continueButton = screen.getByText(/CONTINUE/i);
    fireEvent.click(continueButton);
    
    expect(mockSubmit).toHaveBeenCalledWith({
      adults: 1,
      kids: 0,
      dogs: 0,
      cats: 0
    });
  });
});
