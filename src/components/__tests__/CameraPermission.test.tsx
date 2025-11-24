import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PermissionRequest from '../PermissionRequest';

// Mock KaevaAperture and AuroraBackground to simplify rendering
vi.mock('../KaevaAperture', () => ({
  default: () => <div data-testid="kaeva-aperture">Kaeva Aperture</div>
}));

vi.mock('../AuroraBackground', () => ({
  default: () => <div data-testid="aurora-background">Aurora Background</div>
}));

describe('CameraPermission', () => {
  const mockOnPermissionsGranted = vi.fn();
  const mockGetUserMedia = vi.fn();
  const mockAudioContext = vi.fn();
  const mockAudioPlay = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock AudioContext
    class MockAudioContext {
      state = 'suspended';
      resume = vi.fn().mockResolvedValue(undefined);
    }
    window.AudioContext = MockAudioContext as any;
    (window as any).webkitAudioContext = MockAudioContext;

    // Mock Audio
    class MockAudio {
      play = mockAudioPlay.mockResolvedValue(undefined);
      src = '';
    }
    window.Audio = MockAudio as any;

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      writable: true,
    });

    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests camera permission and calls onPermissionsGranted when granted', async () => {
    render(<PermissionRequest onPermissionsGranted={mockOnPermissionsGranted} />);

    const grantButton = screen.getByText('Grant Permissions');
    fireEvent.click(grantButton);

    // Verify getUserMedia is called with video permissions
    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith(expect.objectContaining({
        video: { facingMode: "user" }
      }));
    }, { timeout: 2000 });

    // Verify onPermissionsGranted is called after the internal delay
    await waitFor(() => {
      expect(mockOnPermissionsGranted).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
