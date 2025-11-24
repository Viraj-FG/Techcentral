import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClusterSafety from '../ClusterSafety';

describe('ClusterSafety', () => {
  it('renders safety options', () => {
    render(<ClusterSafety onSubmit={() => {}} />);
    expect(screen.getByText('Halal')).toBeInTheDocument();
    expect(screen.getByText('Nut-Free')).toBeInTheDocument();
  });

  it('calls onSubmit with selected items', () => {
    const mockSubmit = vi.fn();
    render(<ClusterSafety onSubmit={mockSubmit} />);
    
    // Select items
    fireEvent.click(screen.getByText('Vegan'));
    fireEvent.click(screen.getByText('Nut-Free'));
    
    const continueButton = screen.getByText(/CONTINUE/i);
    fireEvent.click(continueButton);
    
    expect(mockSubmit).toHaveBeenCalledWith({
      values: ['vegan'],
      allergies: ['nut-free']
    });
  });
});
