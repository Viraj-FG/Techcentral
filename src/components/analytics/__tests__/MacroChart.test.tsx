import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MacroChart } from '../MacroChart';

// Mock Recharts
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div className="recharts-responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div className="recharts-bar-chart">{children}</div>,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
  };
});

describe('MacroChart', () => {
  it('renders empty state when no data', () => {
    render(<MacroChart data={[]} />);
    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });

  it('renders chart when data is provided', () => {
    const data = [{ date: '2025-11-24', protein: 100, carbs: 200, fat: 50 }];
    const { container } = render(<MacroChart data={data} />);
    expect(container.querySelector('.recharts-bar-chart')).toBeInTheDocument();
  });
});
