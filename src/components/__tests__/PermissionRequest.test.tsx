import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PermissionRequest from '../PermissionRequest';

describe('PermissionRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock AudioContext
    window.AudioContext = class {
      state = 'suspended';
      resume = vi.fn().mockResolvedValue(undefined);
    } as any;

    // Mock Audio
    window.Audio = class {
      play = vi.fn().mockResolvedValue(undefined);
    } as any;

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({}),
      },
      writable: true,
    });
  });

  it('renders permission request UI', () => {
    render(<PermissionRequest onPermissionsGranted={() => {}} />);
    expect(screen.getByText(/Audio Permissions Required/i)).toBeInTheDocument();
  });

  it('requests permissions on button click', async () => {
    const mockGranted = vi.fn();
    render(<PermissionRequest onPermissionsGranted={mockGranted} />);

    const button = screen.getByText(/Grant Permissions/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
      expect(mockGranted).toHaveBeenCalled();
    });
  });
});
