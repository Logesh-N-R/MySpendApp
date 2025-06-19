import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sidebar } from "@/components/sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES } from "@/lib/utils";
import type { User } from "@shared/schema";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  defaultCurrency: z.string().min(1, "Currency is required"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      defaultCurrency: user?.defaultCurrency || "USD",
    },
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        defaultCurrency: user.defaultCurrency || "USD",
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      return apiRequest("PUT", "/api/user/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <NotificationBell />
              </div>
            </div>
          </div>
        </nav>

        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your full name"
                              className="bg-white dark:bg-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                              className="bg-white dark:bg-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white dark:bg-gray-700">
                                <SelectValue placeholder="Select default currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CURRENCIES.map((currency) => (
                                <SelectItem key={currency.code} value={currency.code}>
                                  <div className="flex items-center space-x-2">
                                    <span>{currency.symbol}</span>
                                    <span>{currency.code}</span>
                                    <span className="text-gray-500">- {currency.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}