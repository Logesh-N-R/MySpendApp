import { ObjectId } from "mongodb";
import { connectToMongoDB, getCollection } from "./mongodb";
import type {
  User, InsertUser,
  Category, InsertCategory,
  Group, InsertGroup,
  GroupMember, InsertGroupMember,
  Expense, InsertExpense,
  GroupExpenseSplit, InsertGroupExpenseSplit,
  Notification, InsertNotification
} from "@shared/mongodb-schema";
import { toObjectId, fromObjectId } from "@shared/mongodb-schema";

export interface IMongoStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Groups
  getGroups(): Promise<Group[]>;
  getGroupsByUserId(userId: string): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;

  // Group Members
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  isGroupMember(groupId: string, userId: string): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpensesByUserId(userId: string): Promise<Expense[]>;
  getExpensesByGroupId(groupId: string): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;

  // Group Expense Splits
  getGroupExpenseSplits(expenseId: string): Promise<GroupExpenseSplit[]>;
  getGroupExpenseSplitsByUserId(userId: string): Promise<GroupExpenseSplit[]>;
  createGroupExpenseSplit(split: InsertGroupExpenseSplit): Promise<GroupExpenseSplit>;
  settleGroupExpenseSplit(id: string): Promise<GroupExpenseSplit | undefined>;

  // Notifications
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
}

export class MongoDBStorage implements IMongoStorage {
  private async ensureConnection() {
    await connectToMongoDB();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    await this.ensureConnection();
    const user = await getCollection('users').findOne({ _id: toObjectId(id) });
    return user ? this.convertUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureConnection();
    const user = await getCollection('users').findOne({ username });
    return user ? this.convertUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureConnection();
    const userDoc = {
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await getCollection('users').insertOne(userDoc);
    const user = await getCollection('users').findOne({ _id: result.insertedId });
    return this.convertUser(user!);
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    await this.ensureConnection();
    const updateDoc = {
      ...updates,
      updatedAt: new Date(),
    };
    await getCollection('users').updateOne(
      { _id: toObjectId(id) },
      { $set: updateDoc }
    );
    const user = await getCollection('users').findOne({ _id: toObjectId(id) });
    return this.convertUser(user!);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    await this.ensureConnection();
    const categories = await getCollection('categories').find({}).toArray();
    return categories.map(cat => this.convertCategory(cat));
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    await this.ensureConnection();
    const categoryDoc = {
      ...insertCategory,
      createdAt: new Date(),
    };
    const result = await getCollection('categories').insertOne(categoryDoc);
    const category = await getCollection('categories').findOne({ _id: result.insertedId });
    return this.convertCategory(category!);
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    await this.ensureConnection();
    const groups = await getCollection('groups').find({}).toArray();
    return groups.map(group => this.convertGroup(group));
  }

  async getGroupsByUserId(userId: string): Promise<Group[]> {
    await this.ensureConnection();
    const userObjectId = toObjectId(userId);
    
    // Find groups where user is a member
    const memberGroups = await getCollection('groupMembers')
      .find({ userId: userObjectId })
      .toArray();
    
    const groupIds = memberGroups.map(member => member.groupId);
    
    if (groupIds.length === 0) {
      return [];
    }
    
    const groups = await getCollection('groups')
      .find({ _id: { $in: groupIds } })
      .toArray();
    
    return groups.map(group => this.convertGroup(group));
  }

  async getGroup(id: string): Promise<Group | undefined> {
    await this.ensureConnection();
    const group = await getCollection('groups').findOne({ _id: toObjectId(id) });
    return group ? this.convertGroup(group) : undefined;
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    await this.ensureConnection();
    const groupDoc = {
      ...insertGroup,
      createdBy: toObjectId(insertGroup.createdBy as string),
      createdAt: new Date(),
    };
    const result = await getCollection('groups').insertOne(groupDoc);
    const group = await getCollection('groups').findOne({ _id: result.insertedId });
    return this.convertGroup(group!);
  }

  // Group Members
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    await this.ensureConnection();
    const members = await getCollection('groupMembers')
      .find({ groupId: toObjectId(groupId) })
      .toArray();
    return members.map(member => this.convertGroupMember(member));
  }

  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    await this.ensureConnection();
    const memberDoc = {
      ...insertMember,
      groupId: toObjectId(insertMember.groupId as string),
      userId: toObjectId(insertMember.userId as string),
      joinedAt: new Date(),
    };
    const result = await getCollection('groupMembers').insertOne(memberDoc);
    const member = await getCollection('groupMembers').findOne({ _id: result.insertedId });
    return this.convertGroupMember(member!);
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    await this.ensureConnection();
    const member = await getCollection('groupMembers').findOne({
      groupId: toObjectId(groupId),
      userId: toObjectId(userId),
    });
    return !!member;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    await this.ensureConnection();
    const expenses = await getCollection('expenses').find({}).sort({ date: -1 }).toArray();
    return expenses.map(expense => this.convertExpense(expense));
  }

  async getExpensesByUserId(userId: string): Promise<Expense[]> {
    await this.ensureConnection();
    const expenses = await getCollection('expenses')
      .find({ userId: toObjectId(userId) })
      .sort({ date: -1 })
      .toArray();
    return expenses.map(expense => this.convertExpense(expense));
  }

  async getExpensesByGroupId(groupId: string): Promise<Expense[]> {
    await this.ensureConnection();
    const expenses = await getCollection('expenses')
      .find({ groupId: toObjectId(groupId) })
      .sort({ date: -1 })
      .toArray();
    return expenses.map(expense => this.convertExpense(expense));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    await this.ensureConnection();
    const expense = await getCollection('expenses').findOne({ _id: toObjectId(id) });
    return expense ? this.convertExpense(expense) : undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    await this.ensureConnection();
    const expenseDoc = {
      ...insertExpense,
      userId: toObjectId(insertExpense.userId as string),
      categoryId: toObjectId(insertExpense.categoryId as string),
      groupId: insertExpense.groupId ? toObjectId(insertExpense.groupId as string) : null,
      date: new Date(),
    };
    const result = await getCollection('expenses').insertOne(expenseDoc);
    const expense = await getCollection('expenses').findOne({ _id: result.insertedId });
    return this.convertExpense(expense!);
  }

  // Group Expense Splits
  async getGroupExpenseSplits(expenseId: string): Promise<GroupExpenseSplit[]> {
    await this.ensureConnection();
    const splits = await getCollection('groupExpenseSplits')
      .find({ expenseId: toObjectId(expenseId) })
      .toArray();
    return splits.map(split => this.convertGroupExpenseSplit(split));
  }

  async getGroupExpenseSplitsByUserId(userId: string): Promise<GroupExpenseSplit[]> {
    await this.ensureConnection();
    const splits = await getCollection('groupExpenseSplits')
      .find({ userId: toObjectId(userId) })
      .toArray();
    return splits.map(split => this.convertGroupExpenseSplit(split));
  }

  async createGroupExpenseSplit(insertSplit: InsertGroupExpenseSplit): Promise<GroupExpenseSplit> {
    await this.ensureConnection();
    const splitDoc = {
      ...insertSplit,
      expenseId: toObjectId(insertSplit.expenseId as string),
      userId: toObjectId(insertSplit.userId as string),
      settled: false,
    };
    const result = await getCollection('groupExpenseSplits').insertOne(splitDoc);
    const split = await getCollection('groupExpenseSplits').findOne({ _id: result.insertedId });
    return this.convertGroupExpenseSplit(split!);
  }

  async settleGroupExpenseSplit(id: string): Promise<GroupExpenseSplit | undefined> {
    await this.ensureConnection();
    await getCollection('groupExpenseSplits').updateOne(
      { _id: toObjectId(id) },
      { 
        $set: { 
          settled: true, 
          settledAt: new Date() 
        } 
      }
    );
    const split = await getCollection('groupExpenseSplits').findOne({ _id: toObjectId(id) });
    return split ? this.convertGroupExpenseSplit(split) : undefined;
  }

  // Notifications
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    await this.ensureConnection();
    const notifications = await getCollection('notifications')
      .find({ userId: toObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
    return notifications.map(notification => this.convertNotification(notification));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    await this.ensureConnection();
    const notificationDoc = {
      ...insertNotification,
      userId: toObjectId(insertNotification.userId as string),
      read: false,
      createdAt: new Date(),
    };
    const result = await getCollection('notifications').insertOne(notificationDoc);
    const notification = await getCollection('notifications').findOne({ _id: result.insertedId });
    return this.convertNotification(notification!);
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    await this.ensureConnection();
    await getCollection('notifications').updateOne(
      { _id: toObjectId(id) },
      { $set: { read: true } }
    );
    const notification = await getCollection('notifications').findOne({ _id: toObjectId(id) });
    return notification ? this.convertNotification(notification) : undefined;
  }

  // Helper methods to convert MongoDB documents to the expected format
  private convertUser(doc: any): User {
    return {
      ...doc,
      id: fromObjectId(doc._id),
      _id: undefined,
    };
  }

  private convertCategory(doc: any): Category {
    return {
      ...doc,
      id: fromObjectId(doc._id),
      _id: undefined,
    };
  }

  private convertGroup(doc: any): Group {
    return {
      ...doc,
      id: fromObjectId(doc._id),
      createdBy: fromObjectId(doc.createdBy),
      _id: undefined,
    };
  }

  private convertGroupMember(doc: any): GroupMember {
    return {
      ...doc,
      id: fromObjectId(doc._id),
      groupId: fromObjectId(doc.groupId),
      userId: fromObjectId(doc.userId),
      _id: undefined,
    };
  }

  private convertExpense(doc: any): Expense {
    return {
      ...doc,
      id: fromObjectId(doc._id),
      userId: fromObjectId(doc.userId),
      categoryId: fromObjectId(doc.categoryId),
      groupId: doc.groupId ? fromObjectId(doc.groupId) : null,
      _id: undefined,
    };
  }

  private convertGroupExpenseSplit(doc: any): GroupExpenseSplit {
    return {
      ...doc,
      id: fromObjectId(doc._id),
      expenseId: fromObjectId(doc.expenseId),
      userId: fromObjectId(doc.userId),
      _id: undefined,
    };
  }

  private convertNotification(doc: any): Notification {
    return {
      ...doc,
      id: fromObjectId(doc._id),
      userId: fromObjectId(doc.userId),
      _id: undefined,
    };
  }
}