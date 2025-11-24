import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VolumeControl from '../VolumeControl';

describe('VolumeControl', () => {
  it('renders volume control', () => {
    render(<VolumeControl volume={0.5} onVolumeChange={() => {}} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('toggles mute', () => {
    const mockChange = vi.fn();
    render(<VolumeControl volume={0.5} onVolumeChange={mockChange} />);

    const muteButton = screen.getByLabelText('Mute');
    fireEvent.click(muteButton);

    expect(mockChange).toHaveBeenCalledWith(0);
  });

  it('unmutes', () => {
    const mockChange = vi.fn();
    render(<VolumeControl volume={0} onVolumeChange={mockChange} />);

    const unmuteButton = screen.getByLabelText('Unmute');
    fireEvent.click(unmuteButton);

    expect(mockChange).toHaveBeenCalledWith(0.7);
  });
});
