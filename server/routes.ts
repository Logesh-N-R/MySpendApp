import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertExpenseSchema, insertGroupSchema, insertGroupMemberSchema, insertUserSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import { hashPassword, verifyPassword, requireAuth, getCurrentUser } from "./auth";

const clients = new Set<WebSocket>();

function broadcastToClients(message: any) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const registerData = insertUserSchema.extend({
        name: z.string().min(1, "Name is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }).parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(registerData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(registerData.password);
      const user = await storage.createUser({
        ...registerData,
        password: hashedPassword,
      });

      res.status(201).json({ message: "User created successfully", userId: user.id });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string(),
        password: z.string(),
      }).parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ message: "Login successful", user: { id: user.id, username: user.username, email: user.email, name: user.name } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      res.json({ id: user.id, username: user.username, email: user.email, name: user.name });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get current user (for backward compatibility)
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const updateData = z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
      }).parse(req.body);

      const updatedUser = await storage.updateUser(user.id, updateData);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Get categories
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // Create category
  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Get expenses for current user
  app.get("/api/expenses", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const expenses = await storage.getExpensesByUserId(user.id);
    res.json(expenses);
  });

  // Create expense
  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        userId: user.id,
      });

      const expense = await storage.createExpense(expenseData);

      // If it's a group expense, create splits
      if (expense.groupId) {
        const groupMembers = await storage.getGroupMembers(expense.groupId);
        const splitAmount = parseFloat(expense.amount) / groupMembers.length;

        for (const member of groupMembers) {
          if (member.userId !== expense.userId) {
            await storage.createGroupExpenseSplit({
              expenseId: expense.id,
              userId: member.userId,
              amount: splitAmount.toFixed(2),
            });
          }
        }

        // Broadcast notification to group members
        broadcastToClients({
          type: 'expense_added',
          expense,
          groupId: expense.groupId,
        });
      }

      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Get groups for current user
  app.get("/api/groups", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const groups = await storage.getGroupsByUserId(user.id);
    res.json(groups);
  });

  // Get single group details
  app.get("/api/groups/:id", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group" });
    }
  });

  // Get group expenses
  app.get("/api/groups/:id/expenses", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const expenses = await storage.getExpensesByGroupId(groupId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to get group expenses" });
    }
  });

  // Create group
  app.post("/api/groups", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const groupData = insertGroupSchema.parse({
        ...req.body,
        createdBy: user.id,
      });

      const group = await storage.createGroup(groupData);
      
      // Add creator as member
      await storage.addGroupMember({
        groupId: group.id,
        userId: user.id,
      });

      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid group data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  // Get group members
  app.get("/api/groups/:id/members", async (req, res) => {
    const groupId = parseInt(req.params.id);
    const members = await storage.getGroupMembers(groupId);
    res.json(members);
  });

  // Add member to group
  app.post("/api/groups/:id/members", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const memberData = insertGroupMemberSchema.parse({
        ...req.body,
        groupId,
      });

      const member = await storage.addGroupMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid member data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  // Create group expense with splitting
  app.post("/api/groups/expenses", requireAuth, async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { groupId, amount, description, categoryId, splits } = req.body;
      
      // Verify user is a member of the group
      const isMember = await storage.isGroupMember(groupId, user.id);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this group" });
      }

      // Create the expense
      const expense = await storage.createExpense({
        amount,
        description,
        categoryId,
        userId: user.id,
        groupId,
      });

      // Create splits for each member
      for (const split of splits) {
        await storage.createGroupExpenseSplit({
          expenseId: expense.id,
          userId: split.userId,
          amount: split.amount.toString(),
        });
      }

      // Broadcast to clients
      broadcastToClients({
        type: "group_expense_added",
        groupId,
        expense,
      });

      res.status(201).json(expense);
    } catch (error) {
      console.error("Create group expense error:", error);
      res.status(500).json({ message: "Failed to create group expense" });
    }
  });

  // Get group expense splits for current user
  app.get("/api/splits", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const splits = await storage.getGroupExpenseSplitsByUserId(user.id);
    res.json(splits);
  });

  // Settle group expense split
  app.patch("/api/splits/:id/settle", async (req, res) => {
    const splitId = parseInt(req.params.id);
    const split = await storage.settleGroupExpenseSplit(splitId);
    
    if (!split) {
      return res.status(404).json({ message: "Split not found" });
    }

    // Broadcast notification
    broadcastToClients({
      type: 'payment_settled',
      split,
    });

    res.json(split);
  });

  // Get notifications for current user
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const notifications = await storage.getNotificationsByUserId(user.id);
    res.json(notifications);
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const notificationId = parseInt(req.params.id);
    const notification = await storage.markNotificationAsRead(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const expenses = await storage.getExpensesByUserId(user.id);
    const splits = await storage.getGroupExpenseSplitsByUserId(user.id);
    const groups = await storage.getGroupsByUserId(user.id);

    // Calculate monthly total
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    // Calculate group balance (what others owe you)
    const groupBalance = splits
      .filter(split => !split.settled)
      .reduce((sum, split) => sum + parseFloat(split.amount), 0);

    // Calculate pending dues (what you owe others)
    const pendingDues = splits
      .filter(split => !split.settled)
      .reduce((sum, split) => sum + parseFloat(split.amount), 0);

    // Calculate category breakdown
    const categories = await storage.getCategories();
    const categoryBreakdown = categories.map(category => {
      const categoryExpenses = expenses.filter(expense => expense.categoryId === category.id);
      const totalAmount = categoryExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      return {
        id: category.id,
        name: category.name,
        color: category.color,
        amount: totalAmount,
        percentage: monthlyTotal > 0 ? (totalAmount / monthlyTotal) * 100 : 0,
      };
    }).filter(category => category.amount > 0);

    res.json({
      monthlyTotal,
      groupBalance,
      pendingDues,
      budgetProgress: 73, // Mock data for now
      activeGroups: groups.length,
      categoryBreakdown,
    });
  });

  return httpServer;
}
