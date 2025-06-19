import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRoute } from "wouter";
import { Sidebar } from "@/components/sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Group, GroupMember, Expense, Category, User } from "@shared/schema";

const expenseSchema = z.object({
  amount: z.string().min(1, "Amount is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  splitType: z.enum(["equal", "custom"]),
  splits: z.array(z.object({
    userId: z.number(),
    amount: z.number().optional(),
  })),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function GroupDetails() {
  const [, params] = useRoute("/groups/:id");
  const groupId = params?.id ? parseInt(params.id) : null;
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: ["/api/groups", groupId],
    enabled: !!groupId,
  });

  const { data: members = [] } = useQuery<GroupMember[]>({
    queryKey: ["/api/groups", groupId, "members"],
    enabled: !!groupId,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/groups", groupId, "expenses"],
    enabled: !!groupId,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: "",
      description: "",
      categoryId: "",
      splitType: "equal",
      splits: [],
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const amount = parseFloat(data.amount);
      let splits = data.splits;

      if (data.splitType === "equal") {
        const splitAmount = amount / members.length;
        splits = members.map(member => ({
          userId: member.userId,
          amount: splitAmount,
        }));
      }

      return apiRequest("POST", "/api/groups/expenses", {
        groupId,
        amount: data.amount,
        description: data.description,
        categoryId: parseInt(data.categoryId),
        splits,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Group expense added and split successfully!",
      });
      form.reset();
      setIsExpenseDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/groups", groupId, "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add group expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  if (!groupId) {
    return <div>Group not found</div>;
  }

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return <div>Group not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{group.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{group.description || "Group expense management"}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <i className="fas fa-plus mr-2"></i>
                      Add Group Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Group Expense</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                                    <Input
                                      {...field}
                                      type="text"
                                      placeholder="0.00"
                                      className="pl-8"
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem key={category.id} value={category.id.toString()}>
                                        <i className={`${category.icon} mr-2`}></i>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter expense description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="splitType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Split Type</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                setSplitType(value as "equal" | "custom");
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select split type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="equal">Split Equally</SelectItem>
                                  <SelectItem value="custom">Custom Split</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {splitType === "equal" && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Equal Split Preview</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Each member will pay: {form.watch("amount") ? formatCurrency(parseFloat(form.watch("amount") || "0") / members.length) : "$0.00"}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createExpenseMutation.isPending}>
                            {createExpenseMutation.isPending ? "Adding..." : "Add & Split Expense"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <NotificationBell />
              </div>
            </div>
          </div>
        </nav>

        <div className="p-6 space-y-6">
          {/* Group Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <i className="fas fa-users text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{members.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <i className="fas fa-receipt text-green-600 dark:text-green-400"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{expenses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <i className="fas fa-dollar-sign text-purple-600 dark:text-purple-400"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Group Members */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Group Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Member {member.userId}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                    </div>
                  </div>
                ))}
              </div>
              {members.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No members in this group yet</p>
              )}
            </CardContent>
          </Card>

          {/* Group Expenses */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Group Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <i className="fas fa-receipt text-gray-600 dark:text-gray-400"></i>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{expense.description}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(expense.date)} • Split among {members.length} members
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(parseFloat(expense.amount))}</p>
                      <Badge variant="secondary" className="text-xs">
                        {formatCurrency(parseFloat(expense.amount) / members.length)} per person
                      </Badge>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="text-center py-8">
                    <i className="fas fa-receipt text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                    <p className="text-gray-500 dark:text-gray-400">No group expenses yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Add your first group expense to start splitting costs</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}