import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { FREE_LIMIT } from "./plans";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("buildings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("buildings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const building = await ctx.db.get(args.id);
    if (!building || building.userId !== userId) {
      throw new Error("Building not found");
    }

    return building;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    sections: v.array(v.object({
      startFloor: v.number(),
      endFloor: v.number(),
      apartmentsCount: v.number(),
      description: v.string(),
      apartments: v.array(v.object({
        apartmentIndex: v.number(),
        isSelected: v.boolean(),
        type: v.string(),
        documents: v.array(v.object({
          name: v.string(),
          color: v.optional(v.string()),
          signedUrl: v.optional(v.string()),
          storageId: v.optional(v.id("_storage")),
        })),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const isPro =
      subscription?.stripeCurrentPeriodEnd &&
      subscription.stripeCurrentPeriodEnd * 1000 > Date.now();
    if (!isPro) {
      const count = await ctx.db
        .query("buildings")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      if (count.length >= FREE_LIMIT) {
        throw new Error(
          `Free plan limited to ${FREE_LIMIT} buildings. Upgrade to Pro for unlimited.`
        );
      }
    }

    return await ctx.db.insert("buildings", {
      name: args.name,
      sections: args.sections,
      userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("buildings"),
    name: v.string(),
    sections: v.array(v.object({
      startFloor: v.number(),
      endFloor: v.number(),
      apartmentsCount: v.number(),
      description: v.string(),
      apartments: v.array(v.object({
        apartmentIndex: v.number(),
        isSelected: v.boolean(),
        type: v.string(),
        documents: v.array(v.object({
          name: v.string(),
          color: v.optional(v.string()),
          signedUrl: v.optional(v.string()),
          storageId: v.optional(v.id("_storage")),
        })),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const building = await ctx.db.get(args.id);
    if (!building || building.userId !== userId) {
      throw new Error("Building not found");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      sections: args.sections,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("buildings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const building = await ctx.db.get(args.id);
    if (!building || building.userId !== userId) {
      throw new Error("Building not found");
    }

    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const getDocuments = query({
  args: { buildingId: v.id("buildings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_building", (q) => q.eq("buildingId", args.buildingId))
      .collect();

    return Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        url: await ctx.storage.getUrl(doc.storageId),
      }))
    );
  },
});

export const addDocument = mutation({
  args: {
    name: v.string(),
    storageId: v.id("_storage"),
    buildingId: v.id("buildings"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Generate a random color for the document
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", 
      "#DDA0DD", "#98D8C8", "#F7DC6F", "#85C1E9", "#F8C471",
      "#82E0AA", "#F1948A", "#BB8FCE", "#85C1E9", "#F9E79F"
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return await ctx.db.insert("documents", {
      name: args.name,
      storageId: args.storageId,
      color,
      userId,
      buildingId: args.buildingId,
    });
  },
});
