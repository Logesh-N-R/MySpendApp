import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  valueColor?: string;
  progress?: number;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconColor, 
  valueColor = "text-gray-900",
  progress 
}: StatsCardProps) {
  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={cn("text-2xl font-semibold", valueColor)}>{value}</p>
          </div>
          <div className={cn("p-3 rounded-full bg-opacity-10", iconColor)}>
            <i className={cn(icon, "text-xl", iconColor)}></i>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        {progress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
