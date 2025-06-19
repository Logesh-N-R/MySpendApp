import React, { useState } from "react";
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

export function ExpenseChart({ data = [] }: ExpenseChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("Month");
  
  // For now, we'll use the same data for all periods since we only have monthly data
  // In the future, you could pass different data sets for week/year
  const displayData = data.length > 0 ? data : mockData;
  
  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Expense Trends
          </CardTitle>
          <div className="flex space-x-2">
            {["Month", "Week", "Year"].map((period) => (
              <Button
                key={period}
                size="sm"
                variant={selectedPeriod === period ? "default" : "ghost"}
                className="px-3 py-1 text-sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                domain={displayData.length > 0 ? ['dataMin - 50', 'dataMax + 50'] : [0, 3000]}
                className="text-gray-600 dark:text-gray-400"
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#3B82F6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {data.length === 0 && displayData === mockData && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 rounded">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No expense data available</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Add some expenses to see trends</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
