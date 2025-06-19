import { ObjectId } from "mongodb";
import { connectToMongoDB, getCollection } from "./mongodb";

// Simple ID mapping for frontend compatibility
let idCounter = 1;
const objectIdToNumber = new Map<string, number>();
const numberToObjectId = new Map<number, ObjectId>();

function toNumericId(objectId: ObjectId): number {
  const key = objectId.toString();
  if (!objectIdToNumber.has(key)) {
    const numId = idCounter++;
    objectIdToNumber.set(key, numId);
    numberToObjectId.set(numId, objectId);
  }
  return objectIdToNumber.get(key)!;
}

function toObjectId(numId: number): ObjectId | null {
  return numberToObjectId.get(numId) || null;
}

// Frontend-compatible interfaces
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  name: string;
  avatar: string | null;
}

export interface InsertUser {
  username: string;
  email: string;
  password: string;
  name: string;
  avatar?: string | null;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
}

export interface InsertCategory {
  name: string;
  icon: string;
  color: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string | null;
  icon: string;
  createdBy: number;
  createdAt: Date;
}

export interface InsertGroup {
  name: string;
  description?: string | null;
  icon?: string;
  createdBy: number;
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role?: string;
  joinedAt: Date;
}

export interface InsertGroupMember {
  groupId: number;
  userId: number;
  role?: string;
}

export interface Expense {
  id: number;
  amount: string;
  description: string;
  categoryId: number;
  userId: number;
  groupId?: number | null;
  notes?: string | null;
  receipt?: string | null;
  date: Date;
}

export interface InsertExpense {
  amount: string;
  description: string;
  categoryId: number;
  userId: number;
  groupId?: number | null;
  notes?: string | null;
  receipt?: string | null;
}

export interface GroupExpenseSplit {
  id: number;
  expenseId: number;
  userId: number;
  amount: string;
  settled: boolean;
  settledAt?: Date | null;
}

export interface InsertGroupExpenseSplit {
  expenseId: number;
  userId: number;
  amount: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface InsertNotification {
  userId: number;
  type: string;
  title: string;
  message: string;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getGroups(): Promise<Group[]>;
  getGroupsByUserId(userId: number): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  isGroupMember(groupId: number, userId: number): Promise<boolean>;
  getExpenses(): Promise<Expense[]>;
  getExpensesByUserId(userId: number): Promise<Expense[]>;
  getExpensesByGroupId(groupId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  getGroupExpenseSplits(expenseId: number): Promise<GroupExpenseSplit[]>;
  getGroupExpenseSplitsByUserId(userId: number): Promise<GroupExpenseSplit[]>;
  createGroupExpenseSplit(split: InsertGroupExpenseSplit): Promise<GroupExpenseSplit>;
  settleGroupExpenseSplit(id: number): Promise<GroupExpenseSplit | undefined>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
}

class MongoCompatibleStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    await connectToMongoDB();
    
    // Seed default categories if none exist
    const categoriesCount = await getCollection('categories').countDocuments();
    if (categoriesCount === 0) {
      await getCollection('categories').insertMany([
        { name: "Food & Dining", icon: "fas fa-utensils", color: "#3B82F6", createdAt: new Date() },
        { name: "Transportation", icon: "fas fa-car", color: "#EF4444", createdAt: new Date() },
        { name: "Shopping", icon: "fas fa-shopping-cart", color: "#10B981", createdAt: new Date() },
        { name: "Entertainment", icon: "fas fa-gamepad", color: "#F59E0B", createdAt: new Date() },
        { name: "Housing", icon: "fas fa-home", color: "#8B5CF6", createdAt: new Date() },
        { name: "Healthcare", icon: "fas fa-heartbeat", color: "#EC4899", createdAt: new Date() }
      ]);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    await connectToMongoDB();
    const objectId = toObjectId(id);
    if (!objectId) return undefined;
    
    const user = await getCollection('users').findOne({ _id: objectId });
    return user ? this.convertUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await connectToMongoDB();
    const user = await getCollection('users').findOne({ username });
    return user ? this.convertUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await connectToMongoDB();
    const result = await getCollection('users').insertOne({
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const user = await getCollection('users').findOne({ _id: result.insertedId });
    return this.convertUser(user!);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    await connectToMongoDB();
    const objectId = toObjectId(id);
    if (!objectId) throw new Error("User not found");
    
    await getCollection('users').updateOne(
      { _id: objectId }, 
      { $set: { ...updates, updatedAt: new Date() } }
    );
    const user = await getCollection('users').findOne({ _id: objectId });
    return this.convertUser(user!);
  }

  async getCategories(): Promise<Category[]> {
    await connectToMongoDB();
    const categories = await getCollection('categories').find({}).toArray();
    return categories.map(cat => this.convertCategory(cat));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    await connectToMongoDB();
    const result = await getCollection('categories').insertOne({
      ...insertCategory,
      createdAt: new Date()
    });
    const category = await getCollection('categories').findOne({ _id: result.insertedId });
    return this.convertCategory(category!);
  }

  async getGroups(): Promise<Group[]> {
    await connectToMongoDB();
    const groups = await getCollection('groups').find({}).toArray();
    return groups.map(group => this.convertGroup(group));
  }

  async getGroupsByUserId(userId: number): Promise<Group[]> {
    await connectToMongoDB();
    const userObjectId = toObjectId(userId);
    if (!userObjectId) return [];
    
    const memberGroups = await getCollection('groupMembers').find({ userId: userObjectId }).toArray();
    const groupIds = memberGroups.map(member => member.groupId);
    
    if (groupIds.length === 0) return [];
    
    const groups = await getCollection('groups').find({ _id: { $in: groupIds } }).toArray();
    return groups.map(group => this.convertGroup(group));
  }

  async getGroup(id: number): Promise<Group | undefined> {
    await connectToMongoDB();
    const objectId = toObjectId(id);
    if (!objectId) return undefined;
    
    const group = await getCollection('groups').findOne({ _id: objectId });
    return group ? this.convertGroup(group) : undefined;
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    await connectToMongoDB();
    const createdByObjectId = toObjectId(insertGroup.createdBy);
    if (!createdByObjectId) throw new Error("Invalid user ID");
    
    const result = await getCollection('groups').insertOne({
      ...insertGroup,
      createdBy: createdByObjectId,
      icon: insertGroup.icon || "fas fa-users",
      createdAt: new Date()
    });
    const group = await getCollection('groups').findOne({ _id: result.insertedId });
    return this.convertGroup(group!);
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    await connectToMongoDB();
    const groupObjectId = toObjectId(groupId);
    if (!groupObjectId) return [];
    
    const members = await getCollection('groupMembers').find({ groupId: groupObjectId }).toArray();
    return members.map(member => this.convertGroupMember(member));
  }

  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    await connectToMongoDB();
    const groupObjectId = toObjectId(insertMember.groupId);
    const userObjectId = toObjectId(insertMember.userId);
    
    if (!groupObjectId || !userObjectId) throw new Error("Invalid IDs");
    
    const result = await getCollection('groupMembers').insertOne({
      ...insertMember,
      groupId: groupObjectId,
      userId: userObjectId,
      role: insertMember.role || "member",
      joinedAt: new Date()
    });
    const member = await getCollection('groupMembers').findOne({ _id: result.insertedId });
    return this.convertGroupMember(member!);
  }

  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    await connectToMongoDB();
    const groupObjectId = toObjectId(groupId);
    const userObjectId = toObjectId(userId);
    
    if (!groupObjectId || !userObjectId) return false;
    
    const member = await getCollection('groupMembers').findOne({
      groupId: groupObjectId,
      userId: userObjectId
    });
    return !!member;
  }

  async getExpenses(): Promise<Expense[]> {
    await connectToMongoDB();
    const expenses = await getCollection('expenses').find({}).sort({ date: -1 }).toArray();
    return expenses.map(expense => this.convertExpense(expense));
  }

  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    await connectToMongoDB();
    const userObjectId = toObjectId(userId);
    if (!userObjectId) return [];
    
    const expenses = await getCollection('expenses').find({ userId: userObjectId }).sort({ date: -1 }).toArray();
    return expenses.map(expense => this.convertExpense(expense));
  }

  async getExpensesByGroupId(groupId: number): Promise<Expense[]> {
    await connectToMongoDB();
    const groupObjectId = toObjectId(groupId);
    if (!groupObjectId) return [];
    
    const expenses = await getCollection('expenses').find({ groupId: groupObjectId }).sort({ date: -1 }).toArray();
    return expenses.map(expense => this.convertExpense(expense));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    await connectToMongoDB();
    const objectId = toObjectId(id);
    if (!objectId) return undefined;
    
    const expense = await getCollection('expenses').findOne({ _id: objectId });
    return expense ? this.convertExpense(expense) : undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    await connectToMongoDB();
    const userObjectId = toObjectId(insertExpense.userId);
    const categoryObjectId = toObjectId(insertExpense.categoryId);
    
    if (!userObjectId || !categoryObjectId) throw new Error("Invalid IDs");
    
    const result = await getCollection('expenses').insertOne({
      ...insertExpense,
      userId: userObjectId,
      categoryId: categoryObjectId,
      groupId: insertExpense.groupId ? toObjectId(insertExpense.groupId) : null,
      date: new Date()
    });
    const expense = await getCollection('expenses').findOne({ _id: result.insertedId });
    return this.convertExpense(expense!);
  }

  async getGroupExpenseSplits(expenseId: number): Promise<GroupExpenseSplit[]> {
    await connectToMongoDB();
    const expenseObjectId = toObjectId(expenseId);
    if (!expenseObjectId) return [];
    
    const splits = await getCollection('groupExpenseSplits').find({ expenseId: expenseObjectId }).toArray();
    return splits.map(split => this.convertGroupExpenseSplit(split));
  }

  async getGroupExpenseSplitsByUserId(userId: number): Promise<GroupExpenseSplit[]> {
    await connectToMongoDB();
    const userObjectId = toObjectId(userId);
    if (!userObjectId) return [];
    
    const splits = await getCollection('groupExpenseSplits').find({ userId: userObjectId }).toArray();
    return splits.map(split => this.convertGroupExpenseSplit(split));
  }

  async createGroupExpenseSplit(insertSplit: InsertGroupExpenseSplit): Promise<GroupExpenseSplit> {
    await connectToMongoDB();
    const expenseObjectId = toObjectId(insertSplit.expenseId);
    const userObjectId = toObjectId(insertSplit.userId);
    
    if (!expenseObjectId || !userObjectId) throw new Error("Invalid IDs");
    
    const result = await getCollection('groupExpenseSplits').insertOne({
      ...insertSplit,
      expenseId: expenseObjectId,
      userId: userObjectId,
      settled: false
    });
    const split = await getCollection('groupExpenseSplits').findOne({ _id: result.insertedId });
    return this.convertGroupExpenseSplit(split!);
  }

  async settleGroupExpenseSplit(id: number): Promise<GroupExpenseSplit | undefined> {
    await connectToMongoDB();
    const objectId = toObjectId(id);
    if (!objectId) return undefined;
    
    await getCollection('groupExpenseSplits').updateOne(
      { _id: objectId },
      { $set: { settled: true, settledAt: new Date() } }
    );
    const split = await getCollection('groupExpenseSplits').findOne({ _id: objectId });
    return split ? this.convertGroupExpenseSplit(split) : undefined;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    await connectToMongoDB();
    const userObjectId = toObjectId(userId);
    if (!userObjectId) return [];
    
    const notifications = await getCollection('notifications').find({ userId: userObjectId }).sort({ createdAt: -1 }).toArray();
    return notifications.map(notification => this.convertNotification(notification));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    await connectToMongoDB();
    const userObjectId = toObjectId(insertNotification.userId);
    if (!userObjectId) throw new Error("Invalid user ID");
    
    const result = await getCollection('notifications').insertOne({
      ...insertNotification,
      userId: userObjectId,
      read: false,
      createdAt: new Date()
    });
    const notification = await getCollection('notifications').findOne({ _id: result.insertedId });
    return this.convertNotification(notification!);
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    await connectToMongoDB();
    const objectId = toObjectId(id);
    if (!objectId) return undefined;
    
    await getCollection('notifications').updateOne(
      { _id: objectId },
      { $set: { read: true } }
    );
    const notification = await getCollection('notifications').findOne({ _id: objectId });
    return notification ? this.convertNotification(notification) : undefined;
  }

  // Conversion helpers
  private convertUser(doc: any): User {
    return {
      id: toNumericId(doc._id),
      username: doc.username,
      email: doc.email,
      password: doc.password,
      name: doc.name,
      avatar: doc.avatar || null
    };
  }

  private convertCategory(doc: any): Category {
    return {
      id: toNumericId(doc._id),
      name: doc.name,
      icon: doc.icon,
      color: doc.color,
      createdAt: doc.createdAt
    };
  }

  private convertGroup(doc: any): Group {
    return {
      id: toNumericId(doc._id),
      name: doc.name,
      description: doc.description || null,
      icon: doc.icon,
      createdBy: toNumericId(doc.createdBy),
      createdAt: doc.createdAt
    };
  }

  private convertGroupMember(doc: any): GroupMember {
    return {
      id: toNumericId(doc._id),
      groupId: toNumericId(doc.groupId),
      userId: toNumericId(doc.userId),
      role: doc.role || "member",
      joinedAt: doc.joinedAt
    };
  }

  private convertExpense(doc: any): Expense {
    return {
      id: toNumericId(doc._id),
      amount: doc.amount,
      description: doc.description,
      categoryId: toNumericId(doc.categoryId),
      userId: toNumericId(doc.userId),
      groupId: doc.groupId ? toNumericId(doc.groupId) : null,
      notes: doc.notes || null,
      receipt: doc.receipt || null,
      date: doc.date
    };
  }

  private convertGroupExpenseSplit(doc: any): GroupExpenseSplit {
    return {
      id: toNumericId(doc._id),
      expenseId: toNumericId(doc.expenseId),
      userId: toNumericId(doc.userId),
      amount: doc.amount,
      settled: doc.settled || false,
      settledAt: doc.settledAt || null
    };
  }

  private convertNotification(doc: any): Notification {
    return {
      id: toNumericId(doc._id),
      userId: toNumericId(doc.userId),
      type: doc.type,
      title: doc.title,
      message: doc.message,
      read: doc.read || false,
      createdAt: doc.createdAt
    };
  }
}

export const storage = new MongoCompatibleStorage();