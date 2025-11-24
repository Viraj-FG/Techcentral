import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayDetailModal } from '../DayDetailModal';

// Mock Drawer components
vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DrawerContent: ({ children }: any) => <div>{children}</div>,
  DrawerHeader: ({ children }: any) => <div>{children}</div>,
  DrawerTitle: ({ children }: any) => <div>{children}</div>,
}));

describe('DayDetailModal', () => {
  const mockDayData = {
    date: new Date(2025, 10, 24), // Nov 24, 2025 local time
    totalCalories: 1500,
    targetMet: true,
    meals: []
  };

  it('renders nothing when closed', () => {
    render(
      <DayDetailModal 
        dayData={mockDayData} 
        tdee={2000} 
        open={false} 
        onClose={() => {}} 
      />
    );
    expect(screen.queryByText(/Nov 24/i)).not.toBeInTheDocument();
  });

  it('renders day details when open', () => {
    render(
      <DayDetailModal 
        dayData={mockDayData} 
        tdee={2000} 
        open={true} 
        onClose={() => {}} 
      />
    );
    // Date format might vary, checking for parts
    expect(screen.getByText(/Nov 24/i)).toBeInTheDocument();
    expect(screen.getByText(/1500 \/ 2000 cal/i)).toBeInTheDocument();
  });
});
