import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/stats-card";
import { ExpenseChart } from "@/components/expense-chart";
import { CategoryChart } from "@/components/category-chart";
import { QuickAddForm } from "@/components/quick-add-form";
import { TransactionList } from "@/components/transaction-list";
import { NotificationBell } from "@/components/notification-bell";
import { Sidebar } from "@/components/sidebar";
import { AddGroupExpenseDialog } from "@/components/add-group-expense-dialog";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getUserCurrency } from "@/lib/utils";
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
  monthlyTrends: Array<{
    month: string;
    amount: number;
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
          description: `Payment of ${formatCurrency(message.amount)} settled`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/splits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        break;
    }
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </nav>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse bg-white dark:bg-gray-800">
                  <CardContent className="p-6">
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Top Navigation */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user?.name || "User"}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <AddExpenseDialog>
                  <Button variant="outline" size="sm">
                    <i className="fas fa-plus mr-2"></i>
                    Quick Add
                  </Button>
                </AddExpenseDialog>
                <AddGroupExpenseDialog>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <i className="fas fa-users mr-2"></i>
                    Group Expense
                  </Button>
                </AddGroupExpenseDialog>
                <NotificationBell />
              </div>
            </div>
          </div>
        </nav>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Monthly Total"
              value={formatCurrency(stats.monthlyTotal)}
              subtitle="This month's expenses"
              icon="fas fa-credit-card"
              iconColor="text-blue-500"
            />
            <StatsCard
              title="Group Balance"
              value={formatCurrency(stats.groupBalance)}
              subtitle="Amount owed to you"
              icon="fas fa-users"
              iconColor="text-green-500"
            />
            <StatsCard
              title="Pending Dues"
              value={formatCurrency(stats.pendingDues)}
              subtitle="Amount you owe"
              icon="fas fa-clock"
              iconColor="text-orange-500"
              valueColor="text-orange-600"
            />
            <StatsCard
              title="Active Groups"
              value={stats.activeGroups.toString()}
              subtitle="Groups you're part of"
              icon="fas fa-layer-group"
              iconColor="text-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Quick Add Form */}
              <QuickAddForm />

              {/* Spending Categories */}
              <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Top Spending Categories</h3>
                  <CategoryChart data={stats.categoryBreakdown} />
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Monthly Spending Trend */}
              <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Monthly Spending Trend</h3>
                  <ExpenseChart data={stats?.monthlyTrends || []} />
                </div>
              </Card>

              {/* Recent Transactions */}
              <TransactionList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}