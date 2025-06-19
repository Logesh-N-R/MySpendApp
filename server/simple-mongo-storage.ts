import { ObjectId } from "mongodb";
import { connectToMongoDB, getCollection } from "./mongodb";

// Helper to convert MongoDB ObjectId to numeric ID for frontend compatibility
let idCounter = 1;
const objectIdToNumber = new Map<string, number>();
const numberToObjectId = new Map<number, ObjectId>();

function getNumericId(objectId: ObjectId): number {
  const key = objectId.toString();
  if (!objectIdToNumber.has(key)) {
    const numId = idCounter++;
    objectIdToNumber.set(key, numId);
    numberToObjectId.set(numId, objectId);
  }
  return objectIdToNumber.get(key)!;
}

function getObjectId(numId: number): ObjectId | null {
  return numberToObjectId.get(numId) || null;
}

// Frontend-compatible types
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

export class MongoStorage implements IStorage {
  constructor() {
    this.seedDefaultData();
  }

  private async seedDefaultData() {
    await connectToMongoDB();
    
    // Check if categories exist, if not, seed them
    const categoriesCount = await getCollection('categories').countDocuments();
    if (categoriesCount === 0) {
      const defaultCategories = [
        { name: "Food & Dining", icon: "fas fa-utensils", color: "#3B82F6", createdAt: new Date() },
        { name: "Transportation", icon: "fas fa-car", color: "#EF4444", createdAt: new Date() },
        { name: "Shopping", icon: "fas fa-shopping-cart", color: "#10B981", createdAt: new Date() },
        { name: "Entertainment", icon: "fas fa-gamepad", color: "#F59E0B", createdAt: new Date() },
        { name: "Housing", icon: "fas fa-home", color: "#8B5CF6", createdAt: new Date() },
        { name: "Healthcare", icon: "fas fa-heartbeat", color: "#EC4899", createdAt: new Date() },
      ];
      
      await getCollection('categories').insertMany(defaultCategories);
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    await connectToMongoDB();
    const objectId = getObjectId(id);
    if (!objectId) return undefined;
    
    const user = await getCollection('users').findOne({ _id: objectId });
    return user ? this.convertUserFromMongo(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await connectToMongoDB();
    const user = await getCollection('users').findOne({ username });
    return user ? this.convertUserFromMongo(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await connectToMongoDB();
    const userDoc = {
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await getCollection('users').insertOne(userDoc);
    const user = await getCollection('users').findOne({ _id: result.insertedId });
    return this.convertUserFromMongo(user!);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    await connectToMongoDB();
    const objectId = getObjectId(id);
    if (!objectId) throw new Error("User not found");
    
    const updateDoc = {
      ...updates,
      updatedAt: new Date(),
    };
    await getCollection('users').updateOne({ _id: objectId }, { $set: updateDoc });
    const user = await getCollection('users').findOne({ _id: objectId });
    return this.convertUserFromMongo(user!);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    await connectToMongoDB();
    const categories = await getCollection('categories').find({}).toArray();
    return categories.map(cat => this.convertCategoryFromMongo(cat));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    await connectToMongoDB();
    const categoryDoc = {
      ...insertCategory,
      createdAt: new Date(),
    };
    const result = await getCollection('categories').insertOne(categoryDoc);
    const category = await getCollection('categories').findOne({ _id: result.insertedId });
    return this.convertCategoryFromMongo(category!);
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    await connectToMongoDB();
    const groups = await getCollection('groups').find({}).toArray();
    return groups.map(group => this.convertGroupFromMongo(group));
  }

  async getGroupsByUserId(userId: number): Promise<Group[]> {
    await connectToMongoDB();
    const userObjectId = getObjectId(userId);
    if (!userObjectId) return [];
    
    const memberGroups = await getCollection('groupMembers')
      .find({ userId: userObjectId })
      .toArray();
    
    const groupIds = memberGroups.map(member => member.groupId);
    if (groupIds.length === 0) return [];
    
    const groups = await getCollection('groups')
      .find({ _id: { $in: groupIds } })
      .toArray();
    
    return groups.map(group => this.convertGroupFromMongo(group));
  }

  async getGroup(id: number): Promise<Group | undefined> {
    await connectToMongoDB();
    const objectId = getObjectId(id);
    if (!objectId) return undefined;
    
    const group = await getCollection('groups').findOne({ _id: objectId });
    return group ? this.convertGroupFromMongo(group) : undefined;
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    await connectToMongoDB();
    const createdByObjectId = getObjectId(insertGroup.createdBy);
    if (!createdByObjectId) throw new Error("Invalid user ID");
    
    const groupDoc = {
      ...insertGroup,
      createdBy: createdByObjectId,
      icon: insertGroup.icon || "fas fa-users",
      createdAt: new Date(),
    };
    const result = await getCollection('groups').insertOne(groupDoc);
    const group = await getCollection('groups').findOne({ _id: result.insertedId });
    return this.convertGroupFromMongo(group!);
  }

  // Group Members
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    await connectToMongoDB();
    const groupObjectId = getObjectId(groupId);
    if (!groupObjectId) return [];
    
    const members = await getCollection('groupMembers')
      .find({ groupId: groupObjectId })
      .toArray();
    return members.map(member => this.convertGroupMemberFromMongo(member));
  }

  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    await connectToMongoDB();
    const groupObjectId = getObjectId(insertMember.groupId);
    const userObjectId = getObjectId(insertMember.userId);
    
    if (!groupObjectId || !userObjectId) {
      throw new Error("Invalid group or user ID");
    }
    
    const memberDoc = {
      ...insertMember,
      groupId: groupObjectId,
      userId: userObjectId,
      role: insertMember.role || "member",
      joinedAt: new Date(),
    };
    const result = await getCollection('groupMembers').insertOne(memberDoc);
    const member = await getCollection('groupMembers').findOne({ _id: result.insertedId });
    return this.convertGroupMemberFromMongo(member!);
  }

  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    await connectToMongoDB();
    const groupObjectId = getObjectId(groupId);
    const userObjectId = getObjectId(userId);
    
    if (!groupObjectId || !userObjectId) return false;
    
    const member = await getCollection('groupMembers').findOne({
      groupId: groupObjectId,
      userId: userObjectId,
    });
    return !!member;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    await connectToMongoDB();
    const expenses = await getCollection('expenses').find({}).sort({ date: -1 }).toArray();
    return expenses.map(expense => this.convertExpenseFromMongo(expense));
  }

  async getExpensesByUserId(userId: number): Promise<Expense[]> {
    await connectToMongoDB();
    const userObjectId = getObjectId(userId);
    if (!userObjectId) return [];
    
    const expenses = await getCollection('expenses')
      .find({ userId: userObjectId })
      .sort({ date: -1 })
      .toArray();
    return expenses.map(expense => this.convertExpenseFromMongo(expense));
  }

  async getExpensesByGroupId(groupId: number): Promise<Expense[]> {
    await connectToMongoDB();
    const groupObjectId = getObjectId(groupId);
    if (!groupObjectId) return [];
    
    const expenses = await getCollection('expenses')
      .find({ groupId: groupObjectId })
      .sort({ date: -1 })
      .toArray();
    return expenses.map(expense => this.convertExpenseFromMongo(expense));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    await connectToMongoDB();
    const objectId = getObjectId(id);
    if (!objectId) return undefined;
    
    const expense = await getCollection('expenses').findOne({ _id: objectId });
    return expense ? this.convertExpenseFromMongo(expense) : undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    await connectToMongoDB();
    const userObjectId = getObjectId(insertExpense.userId);
    const categoryObjectId = getObjectId(insertExpense.categoryId);
    
    if (!userObjectId || !categoryObjectId) {
      throw new Error("Invalid user or category ID");
    }
    
    const expenseDoc = {
      ...insertExpense,
      userId: userObjectId,
      categoryId: categoryObjectId,
      groupId: insertExpense.groupId ? getObjectId(insertExpense.groupId) : null,
      date: new Date(),
    };
    const result = await getCollection('expenses').insertOne(expenseDoc);
    const expense = await getCollection('expenses').findOne({ _id: result.insertedId });
    return this.convertExpenseFromMongo(expense!);
  }

  // Group Expense Splits
  async getGroupExpenseSplits(expenseId: number): Promise<GroupExpenseSplit[]> {
    await connectToMongoDB();
    const expenseObjectId = getObjectId(expenseId);
    if (!expenseObjectId) return [];
    
    const splits = await getCollection('groupExpenseSplits')
      .find({ expenseId: expenseObjectId })
      .toArray();
    return splits.map(split => this.convertGroupExpenseSplitFromMongo(split));
  }

  async getGroupExpenseSplitsByUserId(userId: number): Promise<GroupExpenseSplit[]> {
    await connectToMongoDB();
    const userObjectId = getObjectId(userId);
    if (!userObjectId) return [];
    
    const splits = await getCollection('groupExpenseSplits')
      .find({ userId: userObjectId })
      .toArray();
    return splits.map(split => this.convertGroupExpenseSplitFromMongo(split));
  }

  async createGroupExpenseSplit(insertSplit: InsertGroupExpenseSplit): Promise<GroupExpenseSplit> {
    await connectToMongoDB();
    const expenseObjectId = getObjectId(insertSplit.expenseId);
    const userObjectId = getObjectId(insertSplit.userId);
    
    if (!expenseObjectId || !userObjectId) {
      throw new Error("Invalid expense or user ID");
    }
    
    const splitDoc = {
      ...insertSplit,
      expenseId: expenseObjectId,
      userId: userObjectId,
      settled: false,
    };
    const result = await getCollection('groupExpenseSplits').insertOne(splitDoc);
    const split = await getCollection('groupExpenseSplits').findOne({ _id: result.insertedId });
    return this.convertGroupExpenseSplitFromMongo(split!);
  }

  async settleGroupExpenseSplit(id: number): Promise<GroupExpenseSplit | undefined> {
    await connectToMongoDB();
    const objectId = getObjectId(id);
    if (!objectId) return undefined;
    
    await getCollection('groupExpenseSplits').updateOne(
      { _id: objectId },
      { 
        $set: { 
          settled: true, 
          settledAt: new Date() 
        } 
      }
    );
    const split = await getCollection('groupExpenseSplits').findOne({ _id: objectId });
    return split ? this.convertGroupExpenseSplitFromMongo(split) : undefined;
  }

  // Notifications
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    await connectToMongoDB();
    const userObjectId = getObjectId(userId);
    if (!userObjectId) return [];
    
    const notifications = await getCollection('notifications')
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .toArray();
    return notifications.map(notification => this.convertNotificationFromMongo(notification));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    await connectToMongoDB();
    const userObjectId = getObjectId(insertNotification.userId);
    if (!userObjectId) throw new Error("Invalid user ID");
    
    const notificationDoc = {
      ...insertNotification,
      userId: userObjectId,
      read: false,
      createdAt: new Date(),
    };
    const result = await getCollection('notifications').insertOne(notificationDoc);
    const notification = await getCollection('notifications').findOne({ _id: result.insertedId });
    return this.convertNotificationFromMongo(notification!);
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    await connectToMongoDB();
    const objectId = getObjectId(id);
    if (!objectId) return undefined;
    
    await getCollection('notifications').updateOne(
      { _id: objectId },
      { $set: { read: true } }
    );
    const notification = await getCollection('notifications').findOne({ _id: objectId });
    return notification ? this.convertNotificationFromMongo(notification) : undefined;
  }

  // Helper conversion methods
  private convertUserFromMongo(doc: any): User {
    return {
      id: getNumericId(doc._id),
      username: doc.username,
      email: doc.email,
      password: doc.password,
      name: doc.name,
      avatar: doc.avatar || null,
    };
  }

  private convertCategoryFromMongo(doc: any): Category {
    return {
      id: getNumericId(doc._id),
      name: doc.name,
      icon: doc.icon,
      color: doc.color,
      createdAt: doc.createdAt,
    };
  }

  private convertGroupFromMongo(doc: any): Group {
    return {
      id: getNumericId(doc._id),
      name: doc.name,
      description: doc.description || null,
      icon: doc.icon,
      createdBy: getNumericId(doc.createdBy),
      createdAt: doc.createdAt,
    };
  }

  private convertGroupMemberFromMongo(doc: any): GroupMember {
    return {
      id: getNumericId(doc._id),
      groupId: getNumericId(doc.groupId),
      userId: getNumericId(doc.userId),
      role: doc.role || "member",
      joinedAt: doc.joinedAt,
    };
  }

  private convertExpenseFromMongo(doc: any): Expense {
    return {
      id: getNumericId(doc._id),
      amount: doc.amount,
      description: doc.description,
      categoryId: getNumericId(doc.categoryId),
      userId: getNumericId(doc.userId),
      groupId: doc.groupId ? getNumericId(doc.groupId) : null,
      notes: doc.notes || null,
      receipt: doc.receipt || null,
      date: doc.date,
    };
  }

  private convertGroupExpenseSplitFromMongo(doc: any): GroupExpenseSplit {
    return {
      id: getNumericId(doc._id),
      expenseId: getNumericId(doc.expenseId),
      userId: getNumericId(doc.userId),
      amount: doc.amount,
      settled: doc.settled || false,
      settledAt: doc.settledAt || null,
    };
  }

  private convertNotificationFromMongo(doc: any): Notification {
    return {
      id: getNumericId(doc._id),
      userId: getNumericId(doc.userId),
      type: doc.type,
      title: doc.title,
      message: doc.message,
      read: doc.read || false,
      createdAt: doc.createdAt,
    };
  }
}

export const storage = new MongoStorage();