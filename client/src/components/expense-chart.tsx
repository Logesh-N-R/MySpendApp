import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ExpenseChartProps {
  data: Array<{
    month: string;
    amount: number;
  }>;
}

const mockData = [
  { month: "Jan", amount: 2100 },
  { month: "Feb", amount: 2400 },
  { month: "Mar", amount: 2200 },
  { month: "Apr", amount: 2800 },
  { month: "May", amount: 2650 },
  { month: "Jun", amount: 2847 },
];

export function ExpenseChart({ data = mockData }: ExpenseChartProps) {
  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Expense Trends
          </CardTitle>
          <div className="flex space-x-2">
            <Button size="sm" className="px-3 py-1 text-sm">
              Month
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              Week
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              Year
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                domain={['dataMin - 200', 'dataMax + 200']}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
