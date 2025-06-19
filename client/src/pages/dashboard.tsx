import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/stats-card";
import { ExpenseChart } from "@/components/expense-chart";
import { CategoryChart } from "@/components/category-chart";
import { QuickAddForm } from "@/components/quick-add-form";
import { TransactionList } from "@/components/transaction-list";
import { GroupList } from "@/components/group-list";
import { NotificationBell } from "@/components/notification-bell";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface DashboardStats {
  monthlyTotal: number;
  groupBalance: number;
  pendingDues: number;
  budgetProgress: number;
  activeGroups: number;
  categoryBreakdown: Array<{
    id: number;
    name: string;
    color: string;
    amount: number;
    percentage: number;
  }>;
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket for real-time updates
  useWebSocket((message) => {
    switch (message.type) {
      case 'expense_added':
        toast({
          title: "New Group Expense",
          description: `${message.expense.description} added to group`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        break;
      case 'payment_settled':
        toast({
          title: "Payment Settled",
          description: "A payment has been marked as settled",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/splits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        break;
    }
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </nav>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-64"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.name || "User"}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  <i className="fas fa-eye mr-2"></i>
                  Switch to user view
                </Button>
                <select className="text-sm border border-gray-300 rounded px-3 py-2">
                  <option>English</option>
                </select>
                <Button variant="ghost" size="sm">
                  <i className="fas fa-expand-arrows-alt"></i>
                </Button>
                <NotificationBell />
                <Button variant="ghost" size="sm">
                  <i className="fas fa-cog"></i>
                </Button>
                <Button variant="ghost" size="sm">
                  Corporate Admin
                </Button>
                <Button variant="ghost" size="sm">
                  <i className="fas fa-power-off"></i>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Approval Report */}
              <Card className="bg-white">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Report</h3>
                  <div className="flex border-b border-gray-200 mb-6">
                    <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium">
                      Expense Report Wise
                    </button>
                    <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
                      Advance Report Wise
                    </button>
                  </div>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-folder-open text-2xl text-gray-400"></i>
                    </div>
                    <div className="text-gray-400 text-2xl mb-2">😕</div>
                    <p className="text-gray-500 font-medium">Empty</p>
                    <p className="text-gray-400 text-sm">No data Available</p>
                  </div>
                </div>
              </Card>

              {/* Top Spending Categories */}
              <Card className="bg-white">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Spending Categories</h3>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-chart-pie text-2xl text-gray-400"></i>
                    </div>
                    <div className="text-gray-400 text-2xl mb-2">😕</div>
                    <p className="text-gray-500 font-medium">Empty</p>
                    <p className="text-gray-400 text-sm">No data Available</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Budget Status */}
              <Card className="bg-white">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Budget Status</h3>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <i className="fas fa-bars mr-2"></i>
                    </Button>
                  </div>
                  <div className="h-64">
                    <ExpenseChart data={[]} />
                  </div>
                </div>
              </Card>

              {/* Top Spending Users */}
              <Card className="bg-white">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Spending Users</h3>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-users text-2xl text-gray-400"></i>
                    </div>
                    <div className="text-gray-400 text-2xl mb-2">😕</div>
                    <p className="text-gray-500 font-medium">Empty</p>
                    <p className="text-gray-400 text-sm">No data Available</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Quick Add Form - Floating */}
          <div className="fixed bottom-6 right-6 w-80 max-h-96 overflow-hidden">
            <QuickAddForm />
          </div>
        </div>
      </div>
    </div>
  );
}
