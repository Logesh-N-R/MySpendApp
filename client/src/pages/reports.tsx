import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { ExpenseChart } from "@/components/expense-chart";
import { CategoryChart } from "@/components/category-chart";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@shared/schema";

export default function Reports() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-600 mt-1">View detailed analytics and expense reports</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  <i className="fas fa-download mr-2"></i>
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                  <i className="fas fa-file-excel mr-2"></i>
                  Export Excel
                </Button>
                <NotificationBell />
              </div>
            </div>
          </div>
        </nav>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseChart data={[]} />
            <CategoryChart data={[]} />
          </div>
        </div>
      </div>
    </div>
  );
}