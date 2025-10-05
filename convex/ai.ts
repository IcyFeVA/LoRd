"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { DeckEncoder, Card } from "runeterra";
import { internal } from "./_generated/api";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://lor-deck-builder.convex.site",
    "X-Title": "LoR Deck Builder"
  }
});

export const generateDeck = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch the actual card database
    const cardDatabase = await ctx.runQuery(internal.cardData.getAllCardsForAI, {});
    
    // Check if database is populated
    if (cardDatabase.totalCount === 0) {
      throw new Error("Card database is empty. Click the 🔄 button (top right) to fetch cards from Riot's servers. This only needs to be done once.");
    }
    
    if (cardDatabase.totalCount < 100) {
      throw new Error(`Card database only has ${cardDatabase.totalCount} cards. Click the 🔄 button to fetch the full database (should have 1000+ cards).`);
    }
    
    // Filter the database to only include cards known by our bundled card data
    const filterValidCards = (cards: any[]) => {
      return cards.filter(card => {
        try {
          Card.fromCode(card.cardCode);
          return true;
        } catch (e) {
          return false;
        }
      });
    };

    const validChampions = filterValidCards(cardDatabase.champions);
    const validUnits = filterValidCards(cardDatabase.units);
    const validSpells = filterValidCards(cardDatabase.spells);
    const allValidCards = [...validChampions, ...validUnits, ...validSpells];
    
    // Create a lookup map for fast card validation
    const cardLookup = new Map(
      allValidCards.map(card => [card.cardCode, card])
    );
    
    console.log(`Loaded ${allValidCards.length} of ${cardDatabase.totalCount} cards from database compatible with encoder`);
    console.log(`Champions: ${validChampions.length}, Units: ${validUnits.length}, Spells: ${validSpells.length}`);
    
    // Build dynamic card pools from the database
    const championsByRegion: Record<string, Array<{code: string, name: string, cost: number}>> = {};
    const unitsByRegion: Record<string, Array<{code: string, name: string, cost: number}>> = {};
    const spellsByRegion: Record<string, Array<{code: string, name: string, cost: number}>> = {};
    
    for (const card of validChampions) {
      if (!championsByRegion[card.region]) championsByRegion[card.region] = [];
      championsByRegion[card.region].push({ code: card.cardCode, name: card.name, cost: card.cost });
    }
    
    for (const card of validUnits) {
      if (!unitsByRegion[card.region]) unitsByRegion[card.region] = [];
      unitsByRegion[card.region].push({ code: card.cardCode, name: card.name, cost: card.cost });
    }
    
    for (const card of validSpells) {
      if (!spellsByRegion[card.region]) spellsByRegion[card.region] = [];
      spellsByRegion[card.region].push({ code: card.cardCode, name: card.name, cost: card.cost });
    }
    
    // Build the card pools section dynamically
    let cardPoolsSection = "AVAILABLE CARD POOLS BY REGION:\n\n";
    for (const region of Object.keys(championsByRegion).sort()) {
      cardPoolsSection += `${region.toUpperCase()}:\n`;
      
      if (championsByRegion[region]?.length > 0) {
        cardPoolsSection += `Champions: ${championsByRegion[region].map(c => `${c.code} (${c.name}, ${c.cost} mana)`).join(", ")}\n`;
      }
      
      if (unitsByRegion[region]?.length > 0) {
        const unitList = unitsByRegion[region].map(c => `${c.code} (${c.name}, ${c.cost} mana)`).join(", ");
        cardPoolsSection += `Units: ${unitList}\n`;
      }
      
      if (spellsByRegion[region]?.length > 0) {
        const spellList = spellsByRegion[region].map(c => `${c.code} (${c.name}, ${c.cost} mana)`).join(", ");
        cardPoolsSection += `Spells: ${spellList}\n`;
      }
      
      cardPoolsSection += "\n";
    }
    
    const allChampionNames = validChampions.map(c => c.name).join(", ");

    const systemPrompt = `You are a Legends of Runeterra deck building expert. Generate a VALID 40-card deck.

CRITICAL RULES (MUST FOLLOW):
1. EXACTLY 40 cards total (sum all card counts)
2. Maximum 3 copies of ANY single card
3. Maximum 6 champion cards total across entire deck
4. Use 1-2 regions only
5. All cards MUST be from the selected regions
6. NEVER include 0-cost cards
7. ONLY use cards from the card pools listed below - NO OTHER CARDS ALLOWED
8. 🚨 EVERY card code MUST be from the lists below

DECK COMPOSITION:
- Champions: 4-6 total champion cards (usually 2-3 different champions, 2-3 copies each)
- Units: 20-28 follower units (non-champion creatures)
- Spells: 8-16 spells
- Mana curve distribution:
  * 1-2 mana: 8-12 cards (early game)
  * 3-4 mana: 10-14 cards (mid game)
  * 5-6 mana: 6-10 cards (late game)
  * 7+ mana: 2-4 cards (finishers)

${cardPoolsSection}

Return ONLY a valid JSON object with this exact structure:
{
  "name": "Deck Name",
  "description": "Brief description of deck strategy and win condition",
  "cards": [
    {"cardCode": "01DE012", "count": 3},
    {"cardCode": "01DE002", "count": 3}
  ],
  "regions": ["Demacia", "Freljord"],
  "champions": ["Garen", "Braum"]
}

⚠️ MANDATORY VALIDATION BEFORE RESPONDING:
1. Calculate total: sum ALL card counts = MUST BE EXACTLY 40
2. If total ≠ 40, ADD OR REMOVE cards until it equals 40
3. Total champion cards ≤ 6
4. No card has count > 3
5. All cards match the 1-2 selected regions
6. ONLY cards from the provided card pools above - USE EXACT CARD CODES LISTED`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${args.prompt}\n\n🚨 AVAILABLE CHAMPIONS: ${allChampionNames}\n\nIf the user asks for a champion NOT in this list, pick similar champions that ARE available. The deck MUST have EXACTLY 40 cards total and use ONLY card codes from the lists provided.` },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }
    
    // Extract JSON from markdown code blocks if present
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    // Try to find JSON object in the content - find first { and last }
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    
    // Remove comments from JSON (both // and /* */ style)
    jsonStr = jsonStr.replace(/\/\/.*$/gm, ''); // Remove single-line comments
    jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    // Remove trailing commas before closing braces/brackets
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
    
    let deckData = JSON.parse(jsonStr);
    
    // Add card names, costs, types, and regions
    // Filter out any invalid/unknown cards first, then add metadata
    deckData.cards = deckData.cards
      .filter((card: any) => {
        const info = cardLookup.get(card.cardCode);
        // Only keep cards that exist in our database
        return info !== undefined;
      })
      .map((card: any) => {
        const info = cardLookup.get(card.cardCode)!;
        return {
          cardCode: card.cardCode,
          count: card.count,
          name: info.name,
          cost: info.cost,
          type: info.type,
          region: info.region,
        };
      });
    
    // CRITICAL: Validate we have cards after filtering
    if (deckData.cards.length === 0) {
      throw new Error("No valid cards found. The card database may be empty. Please wait a moment and try again.");
    }
    
    // Check if we have enough cards to build a deck
    if (deckData.cards.length < 10) {
      throw new Error(`Only ${deckData.cards.length} valid cards found. The card database may not be fully loaded. Please try again in a moment.`);
    }
    
    // Validate champions match what's in the deck
    const actualChampions = deckData.cards.filter((c: any) => c.type === "Champion").map((c: any) => c.name);
    if (actualChampions.length === 0 && deckData.champions?.length > 0) {
      throw new Error(`Requested champions not available. Available: ${allChampionNames}`);
    }
    
    // Validate and auto-fix champion count
    let totalChampions = deckData.cards
      .filter((c: any) => c.type === "Champion")
      .reduce((sum: number, c: any) => sum + c.count, 0);

    let attempts = 0;
    while (totalChampions > 6 && attempts < 20) {
      attempts++;
      const champCards = deckData.cards.filter((c: any) => c.type === "Champion" && c.count > 0);
      if (champCards.length === 0) break;
      champCards.sort((a: any, b: any) => b.count - a.count);
      champCards[0].count--;
      totalChampions--;
    }
    deckData.cards = deckData.cards.filter((c: any) => c.count > 0);

    // Auto-fix total card count to be exactly 40
    let totalCards = deckData.cards.reduce((sum: number, c: any) => sum + c.count, 0);
    
    // Add cards if under 40
    attempts = 0;
    while (totalCards < 40 && attempts < 100) {
      attempts++;
      const candidates = deckData.cards.filter((c: any) => c.type !== "Champion" && c.count < 3);
      if (candidates.length === 0) {
        // Try adding champions if we can't add more non-champions
        const champCandidates = deckData.cards.filter((c: any) => c.type === "Champion" && c.count < 3);
        const currentChampTotal = deckData.cards
          .filter((c: any) => c.type === "Champion")
          .reduce((sum: number, c: any) => sum + c.count, 0);
        
        if (champCandidates.length > 0 && currentChampTotal < 6) {
          champCandidates.sort((a: any, b: any) => a.cost - b.cost);
          const cardToAdjust = deckData.cards.find((c: any) => c.cardCode === champCandidates[0].cardCode);
          if (cardToAdjust) {
            cardToAdjust.count++;
            totalCards++;
            continue;
          }
        }
        throw new Error(`Deck has only ${deckData.cards.length} unique cards. Try a different prompt.`);
      }
      // Sort by count first (prefer cards with fewer copies), then by cost
      candidates.sort((a: any, b: any) => {
        if (a.count !== b.count) return a.count - b.count;
        return a.cost - b.cost;
      });
      const cardToAdjust = deckData.cards.find((c: any) => c.cardCode === candidates[0].cardCode);
      if (cardToAdjust) {
        cardToAdjust.count++;
        totalCards++;
      } else {
        break;
      }
    }

    // Remove cards if over 40
    while (totalCards > 40) {
      const candidates = deckData.cards.filter((c: any) => c.type !== "Champion" && c.count > 1);
      if (candidates.length > 0) {
        candidates.sort((a: any, b: any) => b.cost - a.cost); // Prioritize high-cost cards
        const cardToAdjust = deckData.cards.find((c: any) => c.cardCode === candidates[0].cardCode);
        if (cardToAdjust) {
          cardToAdjust.count--;
          totalCards--;
        } else {
          break; // Should not happen
        }
      } else {
        // Try removing single copies of non-champions first
        const singleCandidates = deckData.cards.filter((c: any) => c.type !== "Champion" && c.count === 1);
        if (singleCandidates.length > 0) {
          singleCandidates.sort((a: any, b: any) => b.cost - a.cost);
          const cardToAdjust = deckData.cards.find((c: any) => c.cardCode === singleCandidates[0].cardCode);
          if (cardToAdjust) {
            cardToAdjust.count--;
            totalCards--;
          } else {
            break;
          }
        } else {
          // Last resort: remove champions
          const champCandidates = deckData.cards.filter((c: any) => c.type === "Champion" && c.count > 0);
          if (champCandidates.length === 0) break;
          champCandidates.sort((a: any, b: any) => b.cost - a.cost);
          const cardToAdjust = deckData.cards.find((c: any) => c.cardCode === champCandidates[0].cardCode);
          if (cardToAdjust) {
            cardToAdjust.count--;
            totalCards--;
          } else {
            break; // Should not happen
          }
        }
      }
    }
    deckData.cards = deckData.cards.filter((c: any) => c.count > 0);

    // Final validation
    totalCards = deckData.cards.reduce((sum: number, c: any) => sum + c.count, 0);
    totalChampions = deckData.cards
      .filter((c: any) => c.type === "Champion")
      .reduce((sum: number, c: any) => sum + c.count, 0);
    
    if (totalCards !== 40) {
      console.error("Deck validation failed:", {
        totalCards,
        totalChampions,
        cardCount: deckData.cards.length,
        cards: deckData.cards.map((c: any) => `${c.name} x${c.count} (${c.cost} mana)`),
      });
      throw new Error(`Deck has ${totalCards} cards (need 40) with only ${deckData.cards.length} unique cards. Try a different prompt.`);
    }
    
    if (totalChampions > 6) {
      throw new Error(`Too many champion cards: ${totalChampions}/6. Please try again.`);
    }
    
    // Re-extract champions from the corrected cards array
    deckData.champions = [...new Set(deckData.cards
      .filter((card: any) => card.type === "Champion")
      .map((card: any) => card.name))];
    
    // Generate deck code from the validated card list
    console.log("Generating deck code for validated cards:", deckData.cards.map((c: any) => `${c.cardCode} x${c.count}`));
    const deckCode = generateDeckCode(deckData.cards);
    console.log("Successfully generated deck code:", deckCode);
    
    return {
      ...deckData,
      deckCode,
    };
  },
});

export const parseDeckCode = internalAction({
  args: {
    deckCode: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const cards = DeckEncoder.decode(args.deckCode);
      
      const cardList = cards.map(card => {
        const info = Card.fromCode(card.code);
        return {
          cardCode: card.code,
          count: card.count,
          name: info.name,
          cost: info.cost,
          type: info.type,
          region: info.region,
        };
      });

      // Extract regions from card codes (positions 2-3 in the card code)
      const regionCodes = new Set(cards.map(c => c.code.substring(2, 4)));
      const regionMap: Record<string, string> = {
        'DE': 'Demacia',
        'FR': 'Freljord',
        'IO': 'Ionia',
        'NX': 'Noxus',
        'PZ': 'Piltover & Zaun',
        'SI': 'Shadow Isles',
        'BW': 'Bilgewater',
        'MT': 'Targon',
        'SH': 'Shurima',
        'BC': 'Bandle City',
        'RU': 'Runeterra',
      };
      
      const regions = Array.from(regionCodes).map(code => regionMap[code] || code);

      // Extract champions from the card list
      const champions = cardList
        .filter(card => card.type === "Champion")
        .map(card => card.name);

      return {
        cards: cardList,
        regions,
        champions: [...new Set(champions)], // Remove duplicates
        totalCards: cardList.reduce((sum, c) => sum + c.count, 0),
      };
    } catch (error) {
      throw new Error("Invalid deck code");
    }
  },
});

export const importDeckFromCode = action({
  args: {
    deckCode: v.string(),
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args): Promise<{
    cards: Array<{ cardCode: string; count: number; name: string; cost: number }>;
    regions: string[];
    champions: string[];
    totalCards: number;
  }> => {
    const parsedDeck: {
      cards: Array<{ cardCode: string; count: number; name: string; cost: number }>;
      regions: string[];
      champions: string[];
      totalCards: number;
    } = await ctx.runAction(internal.ai.parseDeckCode, {
      deckCode: args.deckCode,
    });

    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.runMutation(internal.decks.saveParsedDeck, {
      userId: userId.subject as any,
      name: args.name,
      description: args.description,
      deckCode: args.deckCode,
      cards: parsedDeck.cards,
      regions: parsedDeck.regions,
      champions: parsedDeck.champions,
    });

    return parsedDeck;
  },
});

function generateDeckCode(cards: Array<{ cardCode: string; count: number }>): string {
  // Validate card code format (must be 7 chars: 2 digits + 2 letters + 3 digits)
  const validPattern = /^\d{2}[A-Z]{2}\d{3}$/;
  const invalidCards = cards.filter(c => !validPattern.test(c.cardCode));
  
  if (invalidCards.length > 0) {
    throw new Error(`Invalid card code format: ${invalidCards.map(c => c.cardCode).join(", ")}`);
  }
  
  // Convert to the format expected by the LoR deck encoder
  const lorCards = cards.map(c => ({
    code: c.cardCode,
    count: c.count,
  }));
  
  // Generate official LoR deck code
  const encoded = DeckEncoder.encode(lorCards as any);
  
  if (!encoded || encoded.length === 0) {
    throw new Error("Failed to generate deck code");
  }
  
  return encoded;
}

export const regenerateDeckCode = action({
  args: {
    deckId: v.id("decks"),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const deck: {
      cards: Array<{ cardCode: string; count: number }>;
    } = await ctx.runQuery(internal.decks.getDeckDataByDeckId, {
      deckId: args.deckId,
    });

    const newDeckCode = generateDeckCode(deck.cards);

    await ctx.runMutation(internal.decks.updateDeckCodeInternal, {
      deckId: args.deckId,
      deckCode: newDeckCode,
    });

    return newDeckCode;
  },
});
