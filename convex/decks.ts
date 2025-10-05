import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createDeck = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    cards: v.array(v.object({
      cardCode: v.string(),
      count: v.number(),
      name: v.optional(v.string()),
      cost: v.optional(v.number()),
      type: v.optional(v.string()),
      region: v.optional(v.string()),
    })),
    deckCode: v.string(),
    regions: v.array(v.string()),
    champions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("decks", {
      userId,
      name: args.name,
      description: args.description,
      cards: args.cards,
      deckCode: args.deckCode,
      regions: args.regions,
      champions: args.champions,
    });
  },
});

export const importDeck = mutation({
  args: {
    deckCode: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // For now, we'll create a basic deck structure
    // The deck code will be stored and can be used in-game
    return await ctx.db.insert("decks", {
      userId,
      name: args.name || "Imported Deck",
      description: args.description || "Imported from deck code",
      cards: [], // Will be populated by the action
      deckCode: args.deckCode,
      regions: [],
      champions: [],
    });
  },
});

export const listUserDecks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("decks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getDeck = query({
  args: { deckId: v.id("decks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId) {
      throw new Error("Deck not found");
    }

    return deck;
  },
});

export const deleteDeck = mutation({
  args: { deckId: v.id("decks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId) {
      throw new Error("Deck not found");
    }

    await ctx.db.delete(args.deckId);
  },
});

export const saveParsedDeck = internalMutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    deckCode: v.string(),
    cards: v.array(v.object({
      cardCode: v.string(),
      count: v.number(),
      name: v.optional(v.string()),
      cost: v.optional(v.number()),
      type: v.optional(v.string()),
      region: v.optional(v.string()),
    })),
    regions: v.array(v.string()),
    champions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("decks", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      cards: args.cards,
      deckCode: args.deckCode,
      regions: args.regions,
      champions: args.champions,
    });
  },
});

export const getDeckData = internalQuery({
  args: {
    deckId: v.id("decks"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== args.userId) {
      throw new Error("Deck not found");
    }
    return { cards: deck.cards };
  },
});

export const getDeckDataByDeckId = internalQuery({
  args: {
    deckId: v.id("decks"),
  },
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) {
      throw new Error("Deck not found");
    }
    return { cards: deck.cards };
  },
});

export const updateDeckCodeInternal = internalMutation({
  args: {
    deckId: v.id("decks"),
    deckCode: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deckId, {
      deckCode: args.deckCode,
    });
  },
});
