import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SmartScanner from '../SmartScanner';
import { supabase } from '@/integrations/supabase/client';
import React, { forwardRef, useImperativeHandle } from 'react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock Webcam
vi.mock('react-webcam', async () => {
  const React = await import('react');
  return {
    default: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        getScreenshot: () => 'data:image/jpeg;base64,fakeimage',
      }));
      return <div data-testid="webcam" />;
    }),
  };
});

// Mock ScanResults
vi.mock('../ScanResults', () => ({
  default: ({ isOpen, intent }: any) => (
    isOpen ? <div data-testid="scan-results">Results for {intent}</div> : null
  ),
}));

describe('SmartScanner', () => {
  const mockOnClose = vi.fn();
  const mockOnItemsAdded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    render(
      <SmartScanner
        userId="test-user"
        isOpen={false}
        onClose={mockOnClose}
      />
    );
    expect(screen.queryByTestId('webcam')).not.toBeInTheDocument();
  });

  it('renders webcam and controls when open', () => {
    render(
      <SmartScanner
        userId="test-user"
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByTestId('webcam')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument();
  });

  it('captures image and calls detect-intent', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: {
        intent: 'INVENTORY_SWEEP',
        confidence: 0.95,
        items: [],
        suggestion: 'Found items',
      },
      error: null,
    });

    render(
      <SmartScanner
        userId="test-user"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const captureButton = screen.getByRole('button', { name: /capture/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('detect-intent', {
        body: { image: 'data:image/jpeg;base64,fakeimage' },
      });
    });
  });

  it('shows results after successful scan', async () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({
      data: {
        intent: 'INVENTORY_SWEEP',
        confidence: 0.95,
        items: [],
        suggestion: 'Found items',
      },
      error: null,
    });

    render(
      <SmartScanner
        userId="test-user"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const captureButton = screen.getByRole('button', { name: /capture/i });
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByTestId('scan-results')).toBeInTheDocument();
      expect(screen.getByText('Results for INVENTORY_SWEEP')).toBeInTheDocument();
    });
  });
});
