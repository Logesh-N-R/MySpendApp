// MongoDB connection is handled in mongodb.ts
// This file is kept for compatibility but redirects to MongoDB storage
export { connectToMongoDB as connectDB, getCollection } from "./mongodb";
export { storage as db } from "./storage";