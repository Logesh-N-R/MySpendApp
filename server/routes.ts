import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertExpenseSchema, insertGroupSchema, insertGroupMemberSchema } from "@shared/schema";
import { z } from "zod";

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

  // Get current user (hardcoded for demo)
  app.get("/api/user", async (req, res) => {
    const user = await storage.getUser(1);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  // Get categories
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // Get expenses for current user
  app.get("/api/expenses", async (req, res) => {
    const expenses = await storage.getExpensesByUserId(1);
    res.json(expenses);
  });

  // Create expense
  app.post("/api/expenses", async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        userId: 1,
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
  app.get("/api/groups", async (req, res) => {
    const groups = await storage.getGroupsByUserId(1);
    res.json(groups);
  });

  // Create group
  app.post("/api/groups", async (req, res) => {
    try {
      const groupData = insertGroupSchema.parse({
        ...req.body,
        createdBy: 1,
      });

      const group = await storage.createGroup(groupData);
      
      // Add creator as member
      await storage.addGroupMember({
        groupId: group.id,
        userId: 1,
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

  // Get group expense splits for current user
  app.get("/api/splits", async (req, res) => {
    const splits = await storage.getGroupExpenseSplitsByUserId(1);
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
  app.get("/api/notifications", async (req, res) => {
    const notifications = await storage.getNotificationsByUserId(1);
    res.json(notifications);
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    const notificationId = parseInt(req.params.id);
    const notification = await storage.markNotificationAsRead(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    const expenses = await storage.getExpensesByUserId(1);
    const splits = await storage.getGroupExpenseSplitsByUserId(1);
    const groups = await storage.getGroupsByUserId(1);

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
