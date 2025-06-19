import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate, getUserCurrency } from "@/lib/utils";
import type { Expense, Category } from "@shared/schema";

interface EnrichedExpense extends Expense {
  category?: Category;
}

export function TransactionList() {
  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  // Enrich expenses with category information
  const enrichedExpenses: EnrichedExpense[] = expenses.map(expense => ({
    ...expense,
    category: categories.find(cat => cat.id === expense.categoryId),
  }));

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="border-b border-gray-200 pb-6">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="border-b border-gray-200 pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200">
          {enrichedExpenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div 
                    className="p-2 rounded-full bg-opacity-10"
                    style={{ 
                      backgroundColor: expense.category?.color ? `${expense.category.color}20` : '#D32F2F20' 
                    }}
                  >
                    <i 
                      className={expense.category?.icon || "fas fa-receipt"}
                      style={{ color: expense.category?.color || '#D32F2F' }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-sm text-gray-500">{expense.category?.name || 'Uncategorized'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-600">
                    -{formatCurrency(parseFloat(expense.amount), expense.currency || getUserCurrency(user))}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(expense.date)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {expenses.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <i className="fas fa-receipt text-4xl mb-4 text-gray-300"></i>
              <p>No transactions yet</p>
              <p className="text-sm">Add your first expense to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
