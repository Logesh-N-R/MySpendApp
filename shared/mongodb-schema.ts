import { z } from "zod";
import { ObjectId } from "mongodb";

// MongoDB document schemas
export const userSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  username: z.string(),
  email: z.string(),
  password: z.string(),
  name: z.string(),
  avatar: z.string().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const categorySchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  createdAt: z.date().default(() => new Date()),
});

export const groupSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().default("fas fa-users"),
  createdBy: z.instanceof(ObjectId),
  createdAt: z.date().default(() => new Date()),
});

export const groupMemberSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  groupId: z.instanceof(ObjectId),
  userId: z.instanceof(ObjectId),
  role: z.string().default("member"),
  joinedAt: z.date().default(() => new Date()),
});

export const expenseSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  amount: z.string(),
  description: z.string(),
  categoryId: z.instanceof(ObjectId),
  userId: z.instanceof(ObjectId),
  groupId: z.instanceof(ObjectId).nullable().optional(),
  notes: z.string().nullable().optional(),
  receipt: z.string().nullable().optional(),
  date: z.date().default(() => new Date()),
});

export const groupExpenseSplitSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  expenseId: z.instanceof(ObjectId),
  userId: z.instanceof(ObjectId),
  amount: z.string(),
  settled: z.boolean().default(false),
  settledAt: z.date().nullable().optional(),
});

export const notificationSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.instanceof(ObjectId),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  read: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

// Insert schemas (without _id and auto-generated fields)
export const insertUserSchema = userSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = categorySchema.omit({
  _id: true,
  createdAt: true,
});

export const insertGroupSchema = groupSchema.omit({
  _id: true,
  createdAt: true,
});

export const insertGroupMemberSchema = groupMemberSchema.omit({
  _id: true,
  joinedAt: true,
});

export const insertExpenseSchema = expenseSchema.omit({
  _id: true,
  date: true,
});

export const insertGroupExpenseSplitSchema = groupExpenseSplitSchema.omit({
  _id: true,
  settled: true,
  settledAt: true,
});

export const insertNotificationSchema = notificationSchema.omit({
  _id: true,
  read: true,
  createdAt: true,
});

// Types
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = z.infer<typeof categorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Group = z.infer<typeof groupSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type GroupMember = z.infer<typeof groupMemberSchema>;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

export type Expense = z.infer<typeof expenseSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type GroupExpenseSplit = z.infer<typeof groupExpenseSplitSchema>;
export type InsertGroupExpenseSplit = z.infer<typeof insertGroupExpenseSplitSchema>;

export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Helper functions for ObjectId conversion
export function toObjectId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id;
}

export function fromObjectId(id: ObjectId): string {
  return id.toString();
}