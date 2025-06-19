import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { TransactionList } from "@/components/transaction-list";
import { QuickAddForm } from "@/components/quick-add-form";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { AddGroupExpenseDialog } from "@/components/add-group-expense-dialog";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { User } from "@shared/schema";

export default function Expenses() {
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
                <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your expenses and track spending</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  <i className="fas fa-download mr-2"></i>
                  Export
                </Button>
                <AddExpenseDialog>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <i className="fas fa-plus mr-2"></i>
                    Add Expense
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

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionList />
            </div>
            <div>
              <QuickAddForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}