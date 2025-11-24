import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalorieChart } from '../CalorieChart';

// Mock Recharts to avoid rendering issues in JSDOM
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div className="recharts-responsive-container">{children}</div>,
    LineChart: ({ children }: any) => <div className="recharts-line-chart">{children}</div>,
    Line: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
    ReferenceLine: () => <div />,
  };
});

describe('CalorieChart', () => {
  it('renders empty state when no data', () => {
    render(<CalorieChart data={[]} tdee={2000} />);
    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });

  it('renders chart when data is provided', () => {
    const data = [{ date: '2025-11-24', calories: 2000 }];
    const { container } = render(<CalorieChart data={data} tdee={2000} />);
    expect(container.querySelector('.recharts-line-chart')).toBeInTheDocument();
  });
});
