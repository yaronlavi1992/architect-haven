import { v } from "convex/values";
import { query, internalQuery, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByUserForAction = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const create = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.insert("subscriptions", { userId: args.userId });
  },
});

export const upsertFromCheckout = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    stripeCurrentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        stripeCurrentPeriodEnd: args.stripeCurrentPeriodEnd,
      });
      return existing._id;
    }
    return await ctx.db.insert("subscriptions", {
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      stripeCurrentPeriodEnd: args.stripeCurrentPeriodEnd,
    });
  },
});

export const updatePeriodEnd = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    stripeCurrentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .unique();
    if (sub) {
      await ctx.db.patch(sub._id, {
        stripeCurrentPeriodEnd: args.stripeCurrentPeriodEnd,
      });
    }
  },
});

export const cancel = internalMutation({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .unique();
    if (sub) {
      await ctx.db.patch(sub._id, {
        stripeSubscriptionId: undefined,
        stripePriceId: undefined,
        stripeCurrentPeriodEnd: undefined,
      });
    }
  },
});
