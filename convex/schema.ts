import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  decks: defineTable({
    userId: v.id("users"),
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
  }).index("by_user", ["userId"]),
  
  cards: defineTable({
    cardCode: v.string(),
    name: v.string(),
    cost: v.number(),
    type: v.string(),
    region: v.string(),
    rarity: v.string(),
  }).index("by_code", ["cardCode"])
    .index("by_type", ["type"])
    .index("by_region", ["region"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
