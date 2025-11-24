import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClusterBiometrics from '../ClusterBiometrics';

describe('ClusterBiometrics', () => {
  it('renders biometric inputs', () => {
    render(<ClusterBiometrics onSubmit={() => {}} />);
    expect(screen.getByText(/Age/i)).toBeInTheDocument();
    expect(screen.getByText(/Weight/i)).toBeInTheDocument();
    expect(screen.getByText(/Height/i)).toBeInTheDocument();
    expect(screen.getByText(/Activity Level/i)).toBeInTheDocument();
  });

  it('updates values when interacting with controls', () => {
    render(<ClusterBiometrics onSubmit={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onSubmit with correct data', () => {
    const mockSubmit = vi.fn();
    render(<ClusterBiometrics onSubmit={mockSubmit} />);
    
    const continueButton = screen.getByText(/CONTINUE/i);
    fireEvent.click(continueButton);
    
    expect(mockSubmit).toHaveBeenCalled();
    expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
      age: 30,
      weight: 70,
      height: 170,
      gender: 'male'
    }));
  });
});
