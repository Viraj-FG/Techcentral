import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClusterBeauty from '../ClusterBeauty';

describe('ClusterBeauty', () => {
  it('renders all options', () => {
    render(<ClusterBeauty onSubmit={() => {}} />);
    
    expect(screen.getByText('Dry / Dehydrated')).toBeInTheDocument();
    expect(screen.getByText('Oily / Active')).toBeInTheDocument();
    expect(screen.getByText('Straight')).toBeInTheDocument();
    expect(screen.getByText('Curly / Textured')).toBeInTheDocument();
  });

  it('allows selecting options and submitting', () => {
    const mockSubmit = vi.fn();
    render(<ClusterBeauty onSubmit={mockSubmit} />);

    const option = screen.getByText('Dry / Dehydrated');
    fireEvent.click(option);

    const continueButton = screen.getByText('CONTINUE');
    fireEvent.click(continueButton);

    expect(mockSubmit).toHaveBeenCalledWith({ skinProfile: ['dry'] });
  });
});
