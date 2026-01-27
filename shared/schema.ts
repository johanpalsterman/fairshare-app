import { pgTable, text, serial, integer, boolean, timestamp, numeric, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

// Re-export auth models
export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount").notNull(), // Using numeric for currency to avoid float precision issues
  paidBy: varchar("paid_by").notNull(), // UserId
  date: timestamp("date").defaultNow(),
  category: varchar("category", { length: 50 }).default("general"),
  receiptUrl: text("receipt_url"), // For potential receipt uploads
});

export const expenseSplits = pgTable("expense_splits", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id").notNull(),
  userId: varchar("user_id").notNull(),
  amount: numeric("amount").notNull(), // How much this person owes for this expense
  paid: boolean("paid").default(false), // If settled individually (less common in group apps, but good to have)
});

export const settlements = pgTable("settlements", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  fromUserId: varchar("from_user_id").notNull(),
  toUserId: varchar("to_user_id").notNull(),
  amount: numeric("amount").notNull(),
  date: timestamp("date").defaultNow(),
});

// Subscription for "Market Conform Abonnement"
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  plan: varchar("plan", { length: 20 }).default("free").notNull(), // 'free', 'pro'
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active', 'canceled'
  expiresAt: timestamp("expires_at"),
});

// === RELATIONS ===

export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(groupMembers),
  expenses: many(expenses),
  settlements: many(settlements),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(groups, {
    fields: [expenses.groupId],
    references: [groups.id],
  }),
  payer: one(users, {
    fields: [expenses.paidBy],
    references: [users.id],
  }),
  splits: many(expenseSplits),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  user: one(users, {
    fields: [expenseSplits.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, date: true });
export const insertSettlementSchema = createInsertSchema(settlements).omit({ id: true, date: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Settlement = typeof settlements.$inferSelect;
export type InsertSettlement = z.infer<typeof insertSettlementSchema>;

// For creating an expense with splits
export const createExpenseSchema = insertExpenseSchema.extend({
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.string(), // Numeric is string in JS/JSON usually to preserve precision
  })),
});

export type CreateExpenseRequest = z.infer<typeof createExpenseSchema>;

export type GroupMember = typeof groupMembers.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;

// Response types
export type GroupWithMembers = Group & { members: (GroupMember & { user: typeof users.$inferSelect })[] };
export type ExpenseWithSplits = Expense & { splits: typeof expenseSplits.$inferSelect[], payer: typeof users.$inferSelect };
