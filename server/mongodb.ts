import { MongoClient, Db, Collection } from 'mongodb';

let client: MongoClient;
let db: Db;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'expense_tracker';

export async function connectToMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    
    console.log('Connected to MongoDB successfully');
    
    // Create indexes for better performance
    await createIndexes();
    
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function createIndexes() {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    // Groups collection indexes
    await db.collection('groups').createIndex({ createdBy: 1 });
    
    // Group members collection indexes
    await db.collection('groupMembers').createIndex({ groupId: 1, userId: 1 }, { unique: true });
    await db.collection('groupMembers').createIndex({ userId: 1 });
    
    // Expenses collection indexes
    await db.collection('expenses').createIndex({ userId: 1 });
    await db.collection('expenses').createIndex({ groupId: 1 });
    await db.collection('expenses').createIndex({ date: -1 });
    
    // Group expense splits collection indexes
    await db.collection('groupExpenseSplits').createIndex({ expenseId: 1 });
    await db.collection('groupExpenseSplits').createIndex({ userId: 1 });
    
    // Notifications collection indexes
    await db.collection('notifications').createIndex({ userId: 1 });
    await db.collection('notifications').createIndex({ read: 1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

export function getCollection(name: string): Collection {
  if (!db) {
    throw new Error('Database not connected. Call connectToMongoDB first.');
  }
  return db.collection(name);
}

export async function closeMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Export database instance
export { db };