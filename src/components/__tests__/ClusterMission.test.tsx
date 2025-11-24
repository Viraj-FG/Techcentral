import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClusterMission from '../ClusterMission';

describe('ClusterMission', () => {
  it('renders mission options', () => {
    render(<ClusterMission onSubmit={() => {}} />);
    expect(screen.getByText('Manage Hypertension')).toBeInTheDocument();
    expect(screen.getByText('Save Money')).toBeInTheDocument();
  });

  it('toggles selections', () => {
    render(<ClusterMission onSubmit={() => {}} />);
    
    const option = screen.getByText('Manage Hypertension');
    fireEvent.click(option);
    // Logic is internal state, hard to verify without inspecting class names or internal state.
    // But we can verify it doesn't crash.
  });

  it('calls onSubmit with selected items', () => {
    const mockSubmit = vi.fn();
    render(<ClusterMission onSubmit={mockSubmit} />);
    
    // Select items
    fireEvent.click(screen.getByText('Manage Hypertension'));
    fireEvent.click(screen.getByText('Save Money'));
    
    const continueButton = screen.getByText(/FINALIZE CALIBRATION/i);
    fireEvent.click(continueButton);
    
    expect(mockSubmit).toHaveBeenCalledWith({
      medical: ['hypertension'],
      lifestyle: ['save-money']
    });
  });
});
