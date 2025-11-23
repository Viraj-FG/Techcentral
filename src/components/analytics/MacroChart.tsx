import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface DailyMacro {
  date: string;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroChartProps {
  data: DailyMacro[];
}

const chartConfig = {
  protein: { 
    label: "Protein", 
    color: "hsl(0, 84%, 60%)" // Red
  },
  carbs: { 
    label: "Carbs", 
    color: "hsl(217, 91%, 60%)" // Blue
  },
  fat: { 
    label: "Fat", 
    color: "hsl(48, 96%, 53%)" // Yellow
  }
};

export const MacroChart = ({ data }: MacroChartProps) => {
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
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            label={{ value: 'Grams', angle: -90, position: 'insideLeft' }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          
          <Bar dataKey="protein" stackId="macros" fill="var(--color-protein)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="carbs" stackId="macros" fill="var(--color-carbs)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="fat" stackId="macros" fill="var(--color-fat)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
