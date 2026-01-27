import { db } from "./db";
import {
  groups, groupMembers, expenses, expenseSplits, settlements, subscriptions,
  type Group, type InsertGroup, type Expense, type InsertExpense,
  type Settlement, type InsertSettlement, type Subscription,
  type CreateExpenseRequest, type GroupMember
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { users } from "@shared/models/auth";

export interface IStorage {
  // Users
  getUser(userId: string): Promise<typeof users.$inferSelect | undefined>;
  updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void>;

  // Groups
  createGroup(group: InsertGroup, userId: string): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getUserGroups(userId: string): Promise<Group[]>;
  joinGroup(groupId: number, userId: string): Promise<void>;
  getGroupMembers(groupId: number): Promise<(GroupMember & { user: typeof users.$inferSelect })[]>;

  // Expenses
  createExpense(expense: CreateExpenseRequest, groupId: number, paidBy: string): Promise<Expense>;
  getGroupExpenses(groupId: number): Promise<(Expense & { payer: typeof users.$inferSelect, splits: typeof expenseSplits.$inferSelect[] })[]>;
  deleteExpense(id: number): Promise<void>;

  // Settlements
  createSettlement(settlement: InsertSettlement): Promise<Settlement>;
  getGroupSettlements(groupId: number): Promise<Settlement[]>;

  // Subscriptions
  getSubscription(userId: string): Promise<Subscription | undefined>;
  upgradeSubscription(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(userId: string): Promise<typeof users.$inferSelect | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
    await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
  }

  async createGroup(group: InsertGroup, userId: string): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    // Add creator as member
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: userId,
    });
    return newGroup;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const members = await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
    if (members.length === 0) return [];
    
    const groupIds = members.map(m => m.groupId);
    // Fetch groups where id is in groupIds
    // Note: Drizzle's `inArray` is better but simple map select works for now or raw query
    // Let's use Promise.all for simplicity in this MVP context or a join
    const result = await db.select({
      id: groups.id,
      name: groups.name,
      currency: groups.currency,
      createdAt: groups.createdAt
    })
    .from(groups)
    .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId));
    
    return result;
  }

  async joinGroup(groupId: number, userId: string): Promise<void> {
    await db.insert(groupMembers).values({
      groupId,
      userId,
    }).onConflictDoNothing(); // Ignore if already member
  }

  async getGroupMembers(groupId: number): Promise<(GroupMember & { user: typeof users.$inferSelect })[]> {
    return await db.select({
      id: groupMembers.id,
      groupId: groupMembers.groupId,
      userId: groupMembers.userId,
      joinedAt: groupMembers.joinedAt,
      user: users
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));
  }

  async createExpense(req: CreateExpenseRequest, groupId: number, paidBy: string): Promise<Expense> {
    // Transaction ideally
    const [expense] = await db.insert(expenses).values({
      groupId,
      paidBy,
      amount: req.amount,
      description: req.description,
      category: req.category,
      receiptUrl: req.receiptUrl,
    }).returning();

    if (req.splits && req.splits.length > 0) {
      await db.insert(expenseSplits).values(
        req.splits.map(split => ({
          expenseId: expense.id,
          userId: split.userId,
          amount: split.amount
        }))
      );
    }

    return expense;
  }

  async getGroupExpenses(groupId: number): Promise<(Expense & { payer: typeof users.$inferSelect, splits: typeof expenseSplits.$inferSelect[] })[]> {
    const expensesList = await db.select({
      expense: expenses,
      payer: users
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.paidBy, users.id))
    .where(eq(expenses.groupId, groupId))
    .orderBy(desc(expenses.date));

    // Get splits for these expenses (N+1 but okay for MVP)
    const result = [];
    for (const item of expensesList) {
      const splits = await db.select().from(expenseSplits).where(eq(expenseSplits.expenseId, item.expense.id));
      result.push({
        ...item.expense,
        payer: item.payer,
        splits
      });
    }
    return result;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, id));
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async createSettlement(settlement: InsertSettlement): Promise<Settlement> {
    const [s] = await db.insert(settlements).values(settlement).returning();
    return s;
  }

  async getGroupSettlements(groupId: number): Promise<Settlement[]> {
    return await db.select().from(settlements).where(eq(settlements.groupId, groupId));
  }

  async getSubscription(userId: string): Promise<Subscription | undefined> {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return sub;
  }

  async upgradeSubscription(userId: string): Promise<void> {
    await db.insert(subscriptions).values({
      userId,
      plan: 'pro',
      status: 'active'
    }).onConflictDoUpdate({
      target: subscriptions.userId,
      set: { plan: 'pro', status: 'active' }
    });
  }
}

export const storage = new DatabaseStorage();
