import { z } from "zod";

// Validation schemas for MongoDB data
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  avatar: z.string().nullable().optional(),
});

export const insertCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
});

export const insertGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().nullable().optional(),
  icon: z.string().optional(),
  createdBy: z.number().int().positive("Valid user ID is required"),
});

export const insertGroupMemberSchema = z.object({
  groupId: z.number().int().positive("Valid group ID is required"),
  userId: z.number().int().positive("Valid user ID is required"),
  role: z.string().optional(),
});

export const insertExpenseSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required"),
  categoryId: z.number().int().positive("Valid category ID is required"),
  userId: z.number().int().positive("Valid user ID is required"),
  groupId: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  receipt: z.string().nullable().optional(),
});

export const insertGroupExpenseSplitSchema = z.object({
  expenseId: z.number().int().positive("Valid expense ID is required"),
  userId: z.number().int().positive("Valid user ID is required"),
  amount: z.string().min(1, "Amount is required"),
});

export const insertNotificationSchema = z.object({
  userId: z.number().int().positive("Valid user ID is required"),
  type: z.string().min(1, "Type is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
});

// Export types that match the storage interfaces
export type User = {
  id: number;
  username: string;
  email: string;
  password: string;
  name: string;
  avatar: string | null;
  defaultCurrency?: string;
};

export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = {
  id: number;
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
};

export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Group = {
  id: number;
  name: string;
  description?: string | null;
  icon: string;
  createdBy: number;
  createdAt: Date;
};

export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type GroupMember = {
  id: number;
  groupId: number;
  userId: number;
  role?: string;
  joinedAt: Date;
};

export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

export type Expense = {
  id: number;
  amount: string;
  description: string;
  categoryId: number;
  userId: number;
  groupId?: number | null;
  notes?: string | null;
  receipt?: string | null;
  currency?: string;
  date: Date;
};

export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type GroupExpenseSplit = {
  id: number;
  expenseId: number;
  userId: number;
  amount: string;
  settled: boolean;
  settledAt?: Date | null;
};

export type InsertGroupExpenseSplit = z.infer<typeof insertGroupExpenseSplitSchema>;

export type Notification = {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
};

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
