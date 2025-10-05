import { v } from "convex/values";
import { internalMutation, query, internalQuery } from "./_generated/server";

// In-memory card database (will be populated from Riot's API)
export const CARD_DATA: Record<string, { name: string; cost: number; type: string; region: string }> = {
  // Demacia Champions
  "01DE012": { name: "Garen", cost: 5, type: "Champion", region: "Demacia" },
  "01DE022": { name: "Fiora", cost: 3, type: "Champion", region: "Demacia" },
  "02DE006": { name: "Quinn", cost: 5, type: "Champion", region: "Demacia" },
  // Demacia Units
  "01DE002": { name: "Brightsteel Protector", cost: 2, type: "Unit", region: "Demacia" },
  "01DE016": { name: "Loyal Badgerbear", cost: 3, type: "Unit", region: "Demacia" },
  "01DE020": { name: "Vanguard Defender", cost: 2, type: "Unit", region: "Demacia" },
  "01DE034": { name: "Silverwing Vanguard", cost: 4, type: "Unit", region: "Demacia" },
  "01DE044": { name: "Grizzled Ranger", cost: 4, type: "Unit", region: "Demacia" },
  "01DE053": { name: "Vanguard Sergeant", cost: 3, type: "Unit", region: "Demacia" },
  "01DE014": { name: "Fleetfeather Tracker", cost: 1, type: "Unit", region: "Demacia" },
  "01DE031": { name: "Laurent Protege", cost: 3, type: "Unit", region: "Demacia" },
  // Demacia Spells
  "01DE019": { name: "Single Combat", cost: 2, type: "Spell", region: "Demacia" },
  "01DE045": { name: "Riposte", cost: 3, type: "Spell", region: "Demacia" },
  "01DE051": { name: "Detain", cost: 5, type: "Spell", region: "Demacia" },
  "01DE040": { name: "Mobilize", cost: 3, type: "Spell", region: "Demacia" },
  "01DE050": { name: "Judgment", cost: 8, type: "Spell", region: "Demacia" },
  
  // Freljord Champions
  "01FR009": { name: "Braum", cost: 4, type: "Champion", region: "Freljord" },
  "01FR020": { name: "Anivia", cost: 7, type: "Champion", region: "Freljord" },
  "01FR038": { name: "Ashe", cost: 4, type: "Champion", region: "Freljord" },
  "02FR006": { name: "Sejuani", cost: 6, type: "Champion", region: "Freljord" },
  // Freljord Units
  "01FR003": { name: "Omen Hawk", cost: 1, type: "Unit", region: "Freljord" },
  "01FR016": { name: "Avarosan Hearthguard", cost: 5, type: "Unit", region: "Freljord" },
  "01FR024": { name: "Icevale Archer", cost: 2, type: "Unit", region: "Freljord" },
  "01FR033": { name: "Wyrding Stones", cost: 3, type: "Unit", region: "Freljord" },
  "01FR036": { name: "Avarosan Trapper", cost: 3, type: "Unit", region: "Freljord" },
  "01FR025": { name: "Avarosan Sentry", cost: 2, type: "Unit", region: "Freljord" },
  "01FR004": { name: "Ruthless Raider", cost: 1, type: "Unit", region: "Freljord" },
  // Freljord Spells
  "01FR012": { name: "Avalanche", cost: 4, type: "Spell", region: "Freljord" },
  "01FR039": { name: "Harsh Winds", cost: 6, type: "Spell", region: "Freljord" },
  "01FR047": { name: "Brittle Steel", cost: 1, type: "Spell", region: "Freljord" },
  "01FR053": { name: "Fury of the North", cost: 3, type: "Spell", region: "Freljord" },
  "01FR030": { name: "Elixir of Iron", cost: 1, type: "Spell", region: "Freljord" },
  
  // Ionia Champions
  "01IO015": { name: "Karma", cost: 5, type: "Champion", region: "Ionia" },
  "01IO032": { name: "Yasuo", cost: 4, type: "Champion", region: "Ionia" },
  "01IO041": { name: "Zed", cost: 3, type: "Champion", region: "Ionia" },
  "02IO004": { name: "Lee Sin", cost: 6, type: "Champion", region: "Ionia" },
  // Ionia Units
  "01IO009": { name: "Navori Conspirator", cost: 2, type: "Unit", region: "Ionia" },
  "01IO012": { name: "Greenglade Duo", cost: 2, type: "Unit", region: "Ionia" },
  "01IO019": { name: "Fae Bladetwirler", cost: 2, type: "Unit", region: "Ionia" },
  "01IO029": { name: "Jeweled Protector", cost: 5, type: "Unit", region: "Ionia" },
  "01IO044": { name: "Kinkou Lifeblade", cost: 2, type: "Unit", region: "Ionia" },
  "01IO016": { name: "Greenglade Caretaker", cost: 1, type: "Unit", region: "Ionia" },
  "01IO048": { name: "Shadow Assassin", cost: 2, type: "Unit", region: "Ionia" },
  // Ionia Spells
  "01IO006": { name: "Deny", cost: 4, type: "Spell", region: "Ionia" },
  "01IO018": { name: "Will of Ionia", cost: 4, type: "Spell", region: "Ionia" },
  "01IO031": { name: "Twin Disciplines", cost: 3, type: "Spell", region: "Ionia" },
  "01IO008": { name: "Rush", cost: 1, type: "Spell", region: "Ionia" },
  "01IO028": { name: "Sonic Wave", cost: 2, type: "Spell", region: "Ionia" },
  
  // Noxus Champions
  "01NX020": { name: "Draven", cost: 3, type: "Champion", region: "Noxus" },
  "01NX038": { name: "Darius", cost: 6, type: "Champion", region: "Noxus" },
  "02NX007": { name: "Swain", cost: 5, type: "Champion", region: "Noxus" },
  // Noxus Units
  "01NX004": { name: "Legion Saboteur", cost: 2, type: "Unit", region: "Noxus" },
  "01NX012": { name: "Legion Grenadier", cost: 2, type: "Unit", region: "Noxus" },
  "01NX027": { name: "Trifarian Gloryseeker", cost: 2, type: "Unit", region: "Noxus" },
  "01NX036": { name: "Crimson Disciple", cost: 2, type: "Unit", region: "Noxus" },
  "01NX048": { name: "Basilisk Rider", cost: 4, type: "Unit", region: "Noxus" },
  "01NX017": { name: "Legion Rearguard", cost: 1, type: "Unit", region: "Noxus" },
  "01NX039": { name: "Crimson Curator", cost: 3, type: "Unit", region: "Noxus" },
  // Noxus Spells
  "01NX046": { name: "Noxian Fervor", cost: 3, type: "Spell", region: "Noxus" },
  "01NX055": { name: "Culling Strike", cost: 3, type: "Spell", region: "Noxus" },
  "02NX004": { name: "Death's Hand", cost: 3, type: "Spell", region: "Noxus" },
  "01NX050": { name: "Decisive Maneuver", cost: 5, type: "Spell", region: "Noxus" },
  "01NX042": { name: "Brothers' Bond", cost: 4, type: "Spell", region: "Noxus" },
  
  // Piltover & Zaun Champions
  "01PZ036": { name: "Ezreal", cost: 3, type: "Champion", region: "PiltoverZaun" },
  "01PZ040": { name: "Heimerdinger", cost: 5, type: "Champion", region: "PiltoverZaun" },
  "01PZ056": { name: "Teemo", cost: 1, type: "Champion", region: "PiltoverZaun" },
  "02PZ008": { name: "Vi", cost: 5, type: "Champion", region: "PiltoverZaun" },
  // Piltover & Zaun Units
  "01PZ001": { name: "Boomcrew Rookie", cost: 2, type: "Unit", region: "PiltoverZaun" },
  "01PZ045": { name: "Zaunite Urchin", cost: 1, type: "Unit", region: "PiltoverZaun" },
  "02PZ013": { name: "Ballistic Bot", cost: 2, type: "Unit", region: "PiltoverZaun" },
  "01PZ034": { name: "Sumpworks Map", cost: 2, type: "Unit", region: "PiltoverZaun" },
  "01PZ020": { name: "Jury-Rig", cost: 1, type: "Unit", region: "PiltoverZaun" },
  "01PZ027": { name: "Academy Prodigy", cost: 2, type: "Unit", region: "PiltoverZaun" },
  // Piltover & Zaun Spells
  "01PZ052": { name: "Mystic Shot", cost: 2, type: "Spell", region: "PiltoverZaun" },
  "01PZ031": { name: "Statikk Shock", cost: 4, type: "Spell", region: "PiltoverZaun" },
  "01PZ039": { name: "Get Excited!", cost: 3, type: "Spell", region: "PiltoverZaun" },
  "01PZ028": { name: "Thermogenic Beam", cost: 7, type: "Spell", region: "PiltoverZaun" },
  "01PZ046": { name: "Rummage", cost: 1, type: "Spell", region: "PiltoverZaun" },
  
  // Shadow Isles Champions
  "01SI030": { name: "Elise", cost: 2, type: "Champion", region: "ShadowIsles" },
  "01SI042": { name: "Kalista", cost: 3, type: "Champion", region: "ShadowIsles" },
  "01SI053": { name: "Thresh", cost: 5, type: "Champion", region: "ShadowIsles" },
  // Shadow Isles Units
  "01SI026": { name: "Cursed Keeper", cost: 2, type: "Unit", region: "ShadowIsles" },
  "01SI003": { name: "Hapless Aristocrat", cost: 1, type: "Unit", region: "ShadowIsles" },
  "01SI038": { name: "Mistwraith", cost: 2, type: "Unit", region: "ShadowIsles" },
  "01SI049": { name: "Blighted Caretaker", cost: 3, type: "Unit", region: "ShadowIsles" },
  "01SI054": { name: "Wraithcaller", cost: 4, type: "Unit", region: "ShadowIsles" },
  "01SI009": { name: "Barkbeast", cost: 1, type: "Unit", region: "ShadowIsles" },
  "01SI012": { name: "Crawling Sensation", cost: 1, type: "Unit", region: "ShadowIsles" },
  // Shadow Isles Spells
  "01SI029": { name: "Glimpse Beyond", cost: 2, type: "Spell", region: "ShadowIsles" },
  "01SI034": { name: "Vile Feast", cost: 2, type: "Spell", region: "ShadowIsles" },
  "01SI043": { name: "Vengeance", cost: 7, type: "Spell", region: "ShadowIsles" },
  "01SI022": { name: "Mark of the Isles", cost: 1, type: "Spell", region: "ShadowIsles" },
  "01SI050": { name: "Atrocity", cost: 6, type: "Spell", region: "ShadowIsles" },
  
  // Bilgewater Champions
  "02BW032": { name: "Miss Fortune", cost: 3, type: "Champion", region: "Bilgewater" },
  "02BW041": { name: "Gangplank", cost: 5, type: "Champion", region: "Bilgewater" },
  "02BW051": { name: "Twisted Fate", cost: 4, type: "Champion", region: "Bilgewater" },
  // Bilgewater Units
  "02BW003": { name: "Jagged Butcher", cost: 1, type: "Unit", region: "Bilgewater" },
  "02BW013": { name: "Petty Officer", cost: 3, type: "Unit", region: "Bilgewater" },
  "02BW020": { name: "Hired Gun", cost: 3, type: "Unit", region: "Bilgewater" },
  "02BW045": { name: "Jack the Winner", cost: 6, type: "Unit", region: "Bilgewater" },
  "02BW018": { name: "Monkey Idol", cost: 1, type: "Unit", region: "Bilgewater" },
  "02BW025": { name: "Coral Creatures", cost: 2, type: "Unit", region: "Bilgewater" },
  // Bilgewater Spells
  "02BW004": { name: "Make it Rain", cost: 2, type: "Spell", region: "Bilgewater" },
  "02BW014": { name: "Parrrley", cost: 1, type: "Spell", region: "Bilgewater" },
  "02BW029": { name: "Pick a Card", cost: 4, type: "Spell", region: "Bilgewater" },
  "02BW039": { name: "Pocket Aces", cost: 3, type: "Spell", region: "Bilgewater" },
  "02BW053": { name: "Dreadway Deckhand", cost: 1, type: "Unit", region: "Bilgewater" },
  
  // Targon Champions
  "03MT008": { name: "Diana", cost: 2, type: "Champion", region: "Targon" },
  "03MT009": { name: "Leona", cost: 4, type: "Champion", region: "Targon" },
  "03MT052": { name: "Zoe", cost: 1, type: "Champion", region: "Targon" },
  // Targon Units
  "03MT003": { name: "Solari Soldier", cost: 1, type: "Unit", region: "Targon" },
  "03MT012": { name: "Lunari Duskbringer", cost: 2, type: "Unit", region: "Targon" },
  "03MT048": { name: "Mountain Goat", cost: 1, type: "Unit", region: "Targon" },
  "03MT056": { name: "Spacey Sketcher", cost: 1, type: "Unit", region: "Targon" },
  "03MT010": { name: "Solari Shieldbearer", cost: 2, type: "Unit", region: "Targon" },
  "03MT027": { name: "Lunari Priestess", cost: 2, type: "Unit", region: "Targon" },
  // Targon Spells
  "03MT004": { name: "Pale Cascade", cost: 2, type: "Spell", region: "Targon" },
  "03MT021": { name: "Sunburst", cost: 3, type: "Spell", region: "Targon" },
  "03MT034": { name: "Hush", cost: 3, type: "Spell", region: "Targon" },
  "03MT035": { name: "Guiding Touch", cost: 2, type: "Spell", region: "Targon" },
  "03MT092": { name: "Zenith Blade", cost: 3, type: "Spell", region: "Targon" },
};

export function getCardInfo(cardCode: string): { name: string; cost: number; type: string; region: string } {
  return CARD_DATA[cardCode] || { name: cardCode, cost: 0, type: "Unknown", region: "Unknown" };
}

export const getCardInfoFromDb = internalQuery({
  args: { cardCode: v.string() },
  handler: async (ctx, args) => {
    const card = await ctx.db.query("cards").withIndex("by_code", q => q.eq("cardCode", args.cardCode)).first();
    return card || getCardInfo(args.cardCode);
  },
});

// Helper function to get all cards by region
export function getCardsByRegion(region: string) {
  return Object.entries(CARD_DATA)
    .filter(([_, card]) => card.region === region)
    .map(([code, card]) => ({ cardCode: code, ...card }));
}

// Helper function to get all champions
export function getAllChampions() {
  return Object.entries(CARD_DATA)
    .filter(([_, card]) => card.type === "Champion")
    .map(([code, card]) => ({ cardCode: code, ...card }));
}

// Query to get all cards
export const getAllCards = query({
  args: {},
  handler: async () => {
    return Object.entries(CARD_DATA).map(([code, card]) => ({
      cardCode: code,
      ...card,
    }));
  },
});

// Query to get card database stats
export const getCardDatabaseStats = query({
  args: {},
  handler: async (ctx) => {
    const dbCards = await ctx.db.query("cards").collect();
    return {
      totalCards: dbCards.length,
      hasData: dbCards.length > 0,
    };
  },
});

// Internal query to get all cards for AI
export const getAllCardsForAI = internalQuery({
  args: {},
  handler: async (ctx) => {
    const dbCards = await ctx.db.query("cards").collect();
    const cards = dbCards.length > 0 
      ? dbCards.map(c => ({ cardCode: c.cardCode, name: c.name, cost: c.cost, type: c.type, region: c.region }))
      : Object.entries(CARD_DATA).map(([code, card]) => ({ cardCode: code, ...card }));
    
    // Group by region and type for easier AI consumption
    const champions = cards.filter(c => c.type === "Champion");
    const units = cards.filter(c => c.type === "Unit");
    const spells = cards.filter(c => c.type === "Spell");
    
    return {
      all: cards,
      champions,
      units,
      spells,
      totalCount: cards.length,
    };
  },
});

// Store card data in database
export const storeCardsInDatabase = internalMutation({
  args: {
    cards: v.array(v.object({
      cardCode: v.string(),
      name: v.string(),
      cost: v.number(),
      type: v.string(),
      region: v.string(),
      rarity: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Clear existing cards
    const existing = await ctx.db.query("cards").collect();
    for (const card of existing) {
      await ctx.db.delete(card._id);
    }
    
    // Insert new cards
    for (const card of args.cards) {
      await ctx.db.insert("cards", card);
    }
    
    console.log(`Stored ${args.cards.length} cards in database`);
    return { stored: args.cards.length };
  },
});
