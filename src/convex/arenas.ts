import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const cell = v.object({
  x: v.number(),
  z: v.number(),
  type: v.union(
    v.literal("wall"),
    v.literal("food"),
    v.literal("hazard"),
    v.literal("goal"),
  ),
});

const agent = v.object({
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
});

async function requireUser(ctx: Parameters<typeof getAuthUserId>[0]) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("arenas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("arenas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const arena = await ctx.db.get(id);
    if (!arena || arena.userId !== userId) throw new Error("Arena not found");
    return arena;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    width: v.number(),
    height: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const now = Date.now();
    const width = Math.max(6, Math.min(24, Math.round(args.width)));
    const height = Math.max(6, Math.min(24, Math.round(args.height)));
    return await ctx.db.insert("arenas", {
      ...args,
      width,
      height,
      cells: [
        { x: width - 2, z: height - 2, type: "goal" as const },
        { x: Math.floor(width / 2), z: Math.floor(height / 2), type: "food" as const },
        { x: Math.floor(width / 2) + 1, z: Math.floor(height / 2), type: "hazard" as const },
      ],
      agents: [
        { name: "Nova", color: "#7c3aed", brain: "seeker" as const, x: 1, z: 1 },
        { name: "Pixel", color: "#06b6d4", brain: "collector" as const, x: 2, z: 1 },
      ],
      userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("arenas"),
    name: v.string(),
    description: v.string(),
    width: v.number(),
    height: v.number(),
    cells: v.array(cell),
    agents: v.array(agent),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const arena = await ctx.db.get(args.id);
    if (!arena || arena.userId !== userId) throw new Error("Arena not found");
    const { id, ...changes } = args;
    await ctx.db.patch(id, { ...changes, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("arenas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const arena = await ctx.db.get(id);
    if (!arena || arena.userId !== userId) throw new Error("Arena not found");
    const runs = await ctx.db
      .query("simulationRuns")
      .withIndex("by_arena", (q) => q.eq("arenaId", id))
      .collect();
    await Promise.all(runs.map((run) => ctx.db.delete(run._id)));
    await ctx.db.delete(id);
  },
});

export const createShareLink = mutation({
  args: { id: v.id("arenas") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const arena = await ctx.db.get(id);
    if (!arena || arena.userId !== userId) throw new Error("Arena not found");
    const token = arena.shareToken ?? crypto.randomUUID();
    await ctx.db.patch(id, { shareToken: token });
    return token;
  },
});

export const getShared = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) =>
    await ctx.db
      .query("arenas")
      .withIndex("by_share_token", (q) => q.eq("shareToken", token))
      .unique(),
});

export const recordRun = mutation({
  args: {
    arenaId: v.id("arenas"),
    score: v.number(),
    ticks: v.number(),
    survivors: v.number(),
    generation: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const arena = await ctx.db.get(args.arenaId);
    if (!arena || arena.userId !== userId) throw new Error("Arena not found");
    const id = await ctx.db.insert("simulationRuns", {
      ...args,
      userId,
      createdAt: Date.now(),
    });
    if ((arena.bestScore ?? 0) < args.score) {
      await ctx.db.patch(args.arenaId, { bestScore: args.score });
    }
    return id;
  },
});

export const leaderboard = query({
  args: {},
  handler: async (ctx) => {
    const runs = await ctx.db
      .query("simulationRuns")
      .withIndex("by_score")
      .order("desc")
      .take(20);
    return await Promise.all(
      runs.map(async (run) => {
        const arena = await ctx.db.get(run.arenaId);
        const user = await ctx.db.get(run.userId);
        return {
          ...run,
          arenaName: arena?.name ?? "Deleted arena",
          playerName: user?.name ?? user?.email ?? "Anonymous trainer",
        };
      }),
    );
  },
});
