import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/stats-card";
import { ExpenseChart } from "@/components/expense-chart";
import { CategoryChart } from "@/components/category-chart";
import { QuickAddForm } from "@/components/quick-add-form";
import { TransactionList } from "@/components/transaction-list";
import { GroupList } from "@/components/group-list";
import { NotificationBell } from "@/components/notification-bell";
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
      <div className="min-h-screen bg-surface">
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <i className="fas fa-wallet text-2xl text-primary"></i>
                <h1 className="text-xl font-semibold text-gray-800">Smart Expense Tracker</h1>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <i className="fas fa-wallet text-2xl text-primary"></i>
              <h1 className="text-xl font-semibold text-gray-800">Smart Expense Tracker</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell />
              
              <div className="flex items-center space-x-3">
                <img
                  src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || "Loading..."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="This Month"
            value={formatCurrency(stats?.monthlyTotal || 0)}
            subtitle="+12% from last month"
            icon="fas fa-arrow-up"
            iconColor="text-red-500"
            valueColor="text-gray-900"
          />

          <StatsCard
            title="Group Balance"
            value={formatCurrency(stats?.groupBalance || 0)}
            subtitle={`${stats?.activeGroups || 0} active groups`}
            icon="fas fa-users"
            iconColor="text-success"
            valueColor="text-success"
          />

          <StatsCard
            title="Pending Dues"
            value={formatCurrency(stats?.pendingDues || 0)}
            subtitle="2 payments due"
            icon="fas fa-clock"
            iconColor="text-warning"
            valueColor="text-warning"
          />

          <StatsCard
            title="Budget Progress"
            value={`${stats?.budgetProgress || 0}%`}
            subtitle="Monthly budget"
            icon="fas fa-chart-pie"
            iconColor="text-primary"
            valueColor="text-gray-900"
            progress={stats?.budgetProgress || 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <ExpenseChart data={[]} />
            <TransactionList />
            <GroupList />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <QuickAddForm />
            <CategoryChart data={stats?.categoryBreakdown || []} />
            
            {/* Pending Payments */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Pending Payments</h2>
              </div>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <i className="fas fa-hand-holding-usd text-4xl mb-4 text-gray-300"></i>
                  <p>No pending payments</p>
                  <p className="text-sm">All settled up!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-all duration-200"
        >
          <i className="fas fa-plus text-xl"></i>
        </Button>
      </div>
    </div>
  );
}
