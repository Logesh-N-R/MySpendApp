import { storage } from "./storage";
import { hashPassword } from "./auth";

async function seed() {
  console.log("Seeding MongoDB database...");

  try {
    // Check if default user already exists
    const existingUser = await storage.getUserByUsername("johndoe");
    
    if (!existingUser) {
      // Create default user with hashed password
      const hashedPassword = await hashPassword("password123");
      await storage.createUser({
        username: "johndoe",
        email: "john@example.com",
        password: hashedPassword,
        name: "John Doe",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
      });
      console.log("Default user created");
    }

    // Check if categories exist
    const existingCategories = await storage.getCategories();
    
    if (existingCategories.length === 0) {
      // Create default categories
      const defaultCategories = [
        { name: "Food & Dining", icon: "fas fa-utensils", color: "#D32F2F" },
        { name: "Transportation", icon: "fas fa-car", color: "#F57C00" },
        { name: "Entertainment", icon: "fas fa-film", color: "#388E3C" },
        { name: "Shopping", icon: "fas fa-shopping-cart", color: "#1976D2" },
        { name: "Bills & Utilities", icon: "fas fa-file-invoice", color: "#7B1FA2" },
        { name: "Health & Fitness", icon: "fas fa-heartbeat", color: "#00796B" },
      ];

      for (const category of defaultCategories) {
        await storage.createCategory(category);
      }
      console.log("Default categories created");
    }

    console.log("MongoDB database seeded successfully!");
  } catch (error) {
    console.error("Error seeding MongoDB database:", error);
  }
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});