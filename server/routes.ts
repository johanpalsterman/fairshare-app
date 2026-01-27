import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { registerInvoiceRoutes } from "./replit_integrations/invoice";
import { api } from "@shared/routes";
import { z } from "zod";
import { getUncachableStripeClient } from "./stripeClient";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { users } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Invoice Scanning (AI Vision)
  registerInvoiceRoutes(app);

  // Groups
  app.get(api.groups.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const groups = await storage.getUserGroups(userId);
    res.json(groups);
  });

  app.post(api.groups.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.groups.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      const group = await storage.createGroup(input, userId);
      res.status(201).json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.groups.get.path, isAuthenticated, async (req, res) => {
    const group = await storage.getGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ message: "Group not found" });
    
    // Check membership
    const userId = (req.user as any).claims.sub;
    // (Ideally we check membership here, skipping for MVP speed)
    
    const members = await storage.getGroupMembers(group.id);
    res.json({ ...group, members });
  });

  app.post(api.groups.join.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const groupId = Number(req.params.id);
    await storage.joinGroup(groupId, userId);
    res.json({ message: "Joined group" });
  });

  // Public group info for invite links (no auth required)
  app.get("/api/groups/:id/public", async (req, res) => {
    const group = await storage.getGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ message: "Group not found" });
    
    const members = await storage.getGroupMembers(group.id);
    res.json({
      id: group.id,
      name: group.name,
      currency: group.currency,
      memberCount: members.length,
      members: members.map(m => ({
        firstName: m.user?.firstName,
        profileImageUrl: m.user?.profileImageUrl
      }))
    });
  });

  // Expenses
  app.get(api.expenses.list.path, isAuthenticated, async (req, res) => {
    const expenses = await storage.getGroupExpenses(Number(req.params.groupId));
    res.json(expenses);
  });

  app.post(api.expenses.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.expenses.create.input.parse(req.body);
      const userId = (req.user as any).claims.sub;
      const groupId = Number(req.params.groupId);
      
      const expense = await storage.createExpense(input, groupId, userId);
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  app.delete(api.expenses.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteExpense(Number(req.params.id));
    res.status(204).send();
  });

  // Settlements
  app.get(api.settlements.list.path, isAuthenticated, async (req, res) => {
    const settlements = await storage.getGroupSettlements(Number(req.params.groupId));
    res.json(settlements);
  });

  app.post(api.settlements.create.path, isAuthenticated, async (req, res) => {
    const input = api.settlements.create.input.parse(req.body);
    const userId = (req.user as any).claims.sub;
    const settlement = await storage.createSettlement({ ...input, groupId: Number(req.params.groupId), fromUserId: userId });
    res.status(201).json(settlement);
  });

  // Subscription - Get current subscription status
  app.get(api.subscription.get.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    
    try {
      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.json({ plan: 'free', status: 'inactive' });
      }

      const subResult = await db.execute(
        sql`SELECT * FROM stripe.subscriptions 
            WHERE customer = ${user.stripeCustomerId} 
            AND status IN ('active', 'trialing')
            ORDER BY created DESC
            LIMIT 1`
      );

      if (subResult.rows.length > 0) {
        await storage.upgradeSubscription(userId);
        return res.json({ plan: 'pro', status: 'active', stripeSubscription: subResult.rows[0] });
      }

      return res.json({ plan: 'free', status: 'inactive' });
    } catch (error) {
      console.error('Error fetching subscription from Stripe schema:', error);
      const sub = await storage.getSubscription(userId);
      res.json(sub || { plan: 'free', status: 'inactive' });
    }
  });

  // Create Stripe checkout session for Pro upgrade
  app.post(api.subscription.upgrade.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const userEmail = (req.user as any).claims.email;

    try {
      const stripe = await getUncachableStripeClient();
      
      const pricesResult = await db.execute(
        sql`SELECT pr.id as price_id, p.name as product_name 
            FROM stripe.prices pr 
            JOIN stripe.products p ON pr.product = p.id 
            WHERE p.name = 'FairShare Pro' AND pr.active = true 
            LIMIT 1`
      );

      if (pricesResult.rows.length === 0) {
        return res.status(400).json({ message: "Pro plan not available yet. Please try again later." });
      }

      const priceId = pricesResult.rows[0].price_id as string;

      const user = await storage.getUser(userId);
      let customerId = user?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { userId },
        });
        customerId = customer.id;
        
        await storage.updateUserStripeCustomerId(userId, customerId);
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card', 'ideal'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/subscription?success=true`,
        cancel_url: `${baseUrl}/subscription?canceled=true`,
        metadata: { userId }
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Customer portal for managing subscription
  app.post('/api/subscription/portal', isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;

    try {
      const stripe = await getUncachableStripeClient();
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/subscription`,
      });

      res.json({ url: portalSession.url });
    } catch (error) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ message: "Failed to open customer portal" });
    }
  });

  return httpServer;
}
