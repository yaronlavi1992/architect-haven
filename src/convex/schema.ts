import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  arenas: defineTable({
    name: v.string(),
    description: v.string(),
    width: v.number(),
    height: v.number(),
    cells: v.array(
      v.object({
        x: v.number(),
        z: v.number(),
        type: v.union(
          v.literal("wall"),
          v.literal("food"),
          v.literal("hazard"),
          v.literal("goal"),
        ),
      }),
    ),
    agents: v.array(
      v.object({
        name: v.string(),
        color: v.string(),
        brain: v.union(
          v.literal("explorer"),
          v.literal("collector"),
          v.literal("survivor"),
          v.literal("seeker"),
        ),
        x: v.number(),
        z: v.number(),
      }),
    ),
    userId: v.id("users"),
    shareToken: v.optional(v.string()),
    bestScore: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_share_token", ["shareToken"]),

  simulationRuns: defineTable({
    arenaId: v.id("arenas"),
    userId: v.id("users"),
    score: v.number(),
    ticks: v.number(),
    survivors: v.number(),
    generation: v.number(),
    createdAt: v.number(),
  })
    .index("by_arena", ["arenaId"])
    .index("by_score", ["score"])
    .index("by_user", ["userId"]),

  buildings: defineTable({
    name: v.string(),
    sections: v.array(
      v.object({
        startFloor: v.number(),
        endFloor: v.number(),
        apartmentsCount: v.number(),
        description: v.string(),
        apartments: v.array(
          v.object({
            apartmentIndex: v.number(),
            isSelected: v.boolean(),
            type: v.string(),
            documents: v.array(
              v.object({
                name: v.string(),
                color: v.optional(v.string()),
                signedUrl: v.optional(v.string()),
                storageId: v.optional(v.id("_storage")),
              }),
            ),
          }),
        ),
      }),
    ),
    userId: v.id("users"),
    shareToken: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_share_token", ["shareToken"]),

  documents: defineTable({
    name: v.string(),
    storageId: v.id("_storage"),
    color: v.string(),
    userId: v.id("users"),
    buildingId: v.id("buildings"),
  })
    .index("by_building", ["buildingId"])
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
