import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getUserCurrency, CURRENCIES } from "@/lib/utils";
import type { Category, Group, User } from "@shared/schema";

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  currency: z.string().min(1, "Currency is required"),
  groupId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function QuickAddForm() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      description: "",
      categoryId: "",
      currency: getUserCurrency(user),
      groupId: "personal",
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/expenses", {
        amount: data.amount,
        description: data.description,
        categoryId: parseInt(data.categoryId),
        currency: data.currency,
        groupId: data.groupId && data.groupId !== "personal" ? parseInt(data.groupId) : null,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense added successfully!",
      });
      form.reset();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createExpenseMutation.mutate(data);
  };

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Quick Add Expense
              </CardTitle>
              <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-500 dark:text-gray-400`}></i>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Amount
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="0.00"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Currency
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.symbol} {currency.code}
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
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter expense description"
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
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
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Category
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
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

                <FormField
                  control={form.control}
                  name="groupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Group (Optional)
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                            <SelectValue placeholder="Select group or leave empty for personal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="personal">Personal Expense</SelectItem>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createExpenseMutation.isPending}
                >
                  {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}