import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  buildings: defineTable({
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
    userId: v.id("users"),
  }).index("by_user", ["userId"]),

  documents: defineTable({
    name: v.string(),
    storageId: v.id("_storage"),
    color: v.string(),
    userId: v.id("users"),
    buildingId: v.id("buildings"),
  }).index("by_building", ["buildingId"])
    .index("by_user", ["userId"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripeCurrentPeriodEnd: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
