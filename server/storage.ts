import {
  users,
  categories,
  groups,
  groupMembers,
  expenses,
  groupExpenseSplits,
  notifications,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Group,
  type InsertGroup,
  type GroupMember,
  type InsertGroupMember,
  type Expense,
  type InsertExpense,
  type GroupExpenseSplit,
  type InsertGroupExpenseSplit,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Groups
  getGroups(): Promise<Group[]>;
  getGroupsByUserId(userId: number): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;

  // Group Members
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  isGroupMember(groupId: number, userId: number): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpensesByUserId(userId: number): Promise<Expense[]>;
  getExpensesByGroupId(groupId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;

  // Group Expense Splits
  getGroupExpenseSplits(expenseId: number): Promise<GroupExpenseSplit[]>;
  getGroupExpenseSplitsByUserId(userId: number): Promise<GroupExpenseSplit[]>;
  createGroupExpenseSplit(split: InsertGroupExpenseSplit): Promise<GroupExpenseSplit>;
  settleGroupExpenseSplit(id: number): Promise<GroupExpenseSplit | undefined>;

  // Notifications
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private categories: Map<number, Category> = new Map();
  private groups: Map<number, Group> = new Map();
  private groupMembers: Map<number, GroupMember> = new Map();
  private expenses: Map<number, Expense> = new Map();
  private groupExpenseSplits: Map<number, GroupExpenseSplit> = new Map();
  private notifications: Map<number, Notification> = new Map();

  private currentUserId = 1;
  private currentCategoryId = 1;
  private currentGroupId = 1;
  private currentGroupMemberId = 1;
  private currentExpenseId = 1;
  private currentGroupExpenseSplitId = 1;
  private currentNotificationId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default user
    const defaultUser: User = {
      id: 1,
      username: "johndoe",
      email: "john@example.com",
      password: "password",
      name: "John Doe",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
    };
    this.users.set(1, defaultUser);
    this.currentUserId = 2;

    // Create default categories
    const defaultCategories: Category[] = [
      { id: 1, name: "Food & Dining", icon: "fas fa-utensils", color: "#D32F2F" },
      { id: 2, name: "Transportation", icon: "fas fa-car", color: "#F57C00" },
      { id: 3, name: "Entertainment", icon: "fas fa-film", color: "#388E3C" },
      { id: 4, name: "Shopping", icon: "fas fa-shopping-cart", color: "#1976D2" },
      { id: 5, name: "Bills & Utilities", icon: "fas fa-file-invoice", color: "#7B1FA2" },
      { id: 6, name: "Health & Fitness", icon: "fas fa-heartbeat", color: "#00796B" },
    ];

    defaultCategories.forEach((category) => {
      this.categories.set(category.id, category);
    });
    this.currentCategoryId = 7;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      avatar: insertUser.avatar || null
    };
    this.users.set(id, user);
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    return Array.from(this.groups.values());
  }

  async getGroupsByUserId(userId: number): Promise<Group[]> {
    const userGroupIds = Array.from(this.groupMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.groupId);
    
    return Array.from(this.groups.values())
      .filter(group => userGroupIds.includes(group.id));
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.currentGroupId++;
    const group: Group = { 
      ...insertGroup, 
      id, 
      createdAt: new Date(),
      description: insertGroup.description || null,
      icon: insertGroup.icon || "fas fa-users"
    };
    this.groups.set(id, group);
    return group;
  }

  // Group Members
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values())
      .filter(member => member.groupId === groupId);
  }

  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const id = this.currentGroupMemberId++;
    const member: GroupMember = { 
      ...insertMember, 
      id, 
      joinedAt: new Date() 
    };
    this.groupMembers.set(id, member);
    return member;
  }

  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    return Array.from(this.groupMembers.values())
      .some(member => member.groupId === groupId && member.userId === userId);
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpensesByGroupId(groupId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.groupId === groupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.currentExpenseId++;
    const expense: Expense = { 
      ...insertExpense, 
      id, 
      date: new Date(),
      groupId: insertExpense.groupId || null,
      notes: insertExpense.notes || null,
      receipt: insertExpense.receipt || null
    };
    this.expenses.set(id, expense);
    return expense;
  }

  // Group Expense Splits
  async getGroupExpenseSplits(expenseId: number): Promise<GroupExpenseSplit[]> {
    return Array.from(this.groupExpenseSplits.values())
      .filter(split => split.expenseId === expenseId);
  }

  async getGroupExpenseSplitsByUserId(userId: number): Promise<GroupExpenseSplit[]> {
    return Array.from(this.groupExpenseSplits.values())
      .filter(split => split.userId === userId);
  }

  async createGroupExpenseSplit(insertSplit: InsertGroupExpenseSplit): Promise<GroupExpenseSplit> {
    const id = this.currentGroupExpenseSplitId++;
    const split: GroupExpenseSplit = { 
      ...insertSplit, 
      id, 
      settled: false,
      settledAt: null 
    };
    this.groupExpenseSplits.set(id, split);
    return split;
  }

  async settleGroupExpenseSplit(id: number): Promise<GroupExpenseSplit | undefined> {
    const split = this.groupExpenseSplits.get(id);
    if (split) {
      const updatedSplit: GroupExpenseSplit = {
        ...split,
        settled: true,
        settledAt: new Date(),
      };
      this.groupExpenseSplits.set(id, updatedSplit);
      return updatedSplit;
    }
    return undefined;
  }

  // Notifications
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      read: false,
      createdAt: new Date(),
      relatedExpenseId: insertNotification.relatedExpenseId || null,
      relatedGroupId: insertNotification.relatedGroupId || null
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (notification) {
      const updatedNotification: Notification = {
        ...notification,
        read: true,
      };
      this.notifications.set(id, updatedNotification);
      return updatedNotification;
    }
    return undefined;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }

  async getGroupsByUserId(userId: number): Promise<Group[]> {
    const userGroupIds = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));
    
    if (userGroupIds.length === 0) return [];
    
    const groupIds = userGroupIds.map(row => row.groupId);
    return await db
      .select()
      .from(groups)
      .where(inArray(groups.id, groupIds));
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group || undefined;
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db
      .insert(groups)
      .values(insertGroup)
      .returning();
    return group;
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
  }

  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const [member] = await db
      .insert(groupMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    return !!member;
  }

  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses);
  }

  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId));
  }

  async getExpensesByGroupId(groupId: number): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.groupId, groupId));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async getGroupExpenseSplits(expenseId: number): Promise<GroupExpenseSplit[]> {
    return await db
      .select()
      .from(groupExpenseSplits)
      .where(eq(groupExpenseSplits.expenseId, expenseId));
  }

  async getGroupExpenseSplitsByUserId(userId: number): Promise<GroupExpenseSplit[]> {
    return await db
      .select()
      .from(groupExpenseSplits)
      .where(eq(groupExpenseSplits.userId, userId));
  }

  async createGroupExpenseSplit(insertSplit: InsertGroupExpenseSplit): Promise<GroupExpenseSplit> {
    const [split] = await db
      .insert(groupExpenseSplits)
      .values(insertSplit)
      .returning();
    return split;
  }

  async settleGroupExpenseSplit(id: number): Promise<GroupExpenseSplit | undefined> {
    const [split] = await db
      .update(groupExpenseSplits)
      .set({ settled: true, settledAt: new Date() })
      .where(eq(groupExpenseSplits.id, id))
      .returning();
    return split || undefined;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }
}

export const storage = new DatabaseStorage();
