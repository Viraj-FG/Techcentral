import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from '../CalendarView';

describe('CalendarView', () => {
  const mockMealLogs = [
    {
      id: '1',
      logged_at: '2025-11-24T12:00:00Z',
      calories: 500,
      protein: 30,
      carbs: 50,
      fat: 20
    }
  ];

  it('renders calendar days', () => {
    render(
      <CalendarView 
        month={10} // November (0-indexed)
        year={2025}
        mealLogs={mockMealLogs}
        tdee={2000}
        onDayClick={() => {}}
      />
    );
    
    // Should render days of the week
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    
    // Should render the date 24
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('calls onDayClick when a day is clicked', () => {
    const mockOnDayClick = vi.fn();
    render(
      <CalendarView 
        month={10} 
        year={2025}
        mealLogs={mockMealLogs}
        tdee={2000}
        onDayClick={mockOnDayClick}
      />
    );
    
    const day24 = screen.getByText('24');
    fireEvent.click(day24);
    
    expect(mockOnDayClick).toHaveBeenCalled();
  });
});
