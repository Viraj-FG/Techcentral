import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";

interface DailyCalorie {
  date: string;
  calories: number;
}

interface CalorieChartProps {
  data: DailyCalorie[];
  tdee: number;
}

const chartConfig = {
  calories: { 
    label: "Calories", 
    color: "hsl(var(--secondary))"
  },
  tdee: { 
    label: "Goal", 
    color: "hsl(var(--muted-foreground))"
  }
};

export const CalorieChart = ({ data, tdee }: CalorieChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No data available for the last 7 days</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          
          {/* User's actual calories */}
          <Line 
            type="monotone" 
            dataKey="calories" 
            stroke="var(--color-calories)" 
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--color-calories)" }}
          />
          
          {/* TDEE reference line */}
          <ReferenceLine 
            y={tdee} 
            stroke="var(--color-tdee)" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: "Goal", fill: "hsl(var(--muted-foreground))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
