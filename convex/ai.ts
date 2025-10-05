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
          const set = card.cardCode.substring(0, 2);
          const faction = card.cardCode.substring(2, 4);
          const number = card.cardCode.substring(4, 7);
          Card.from(set, faction, number, 1);
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
    
    // Create a lookup map for fast card validation by name
    const cardLookupByName = new Map(
      allValidCards.map(card => [card.name.toLowerCase(), card])
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
        cardPoolsSection += `Champions: ${championsByRegion[region].map(c => c.name).join(", ")}\n`;
      }
      
      if (unitsByRegion[region]?.length > 0) {
        const unitList = unitsByRegion[region].map(c => c.name).join(", ");
        cardPoolsSection += `Units: ${unitList}\n`;
      }
      
      if (spellsByRegion[region]?.length > 0) {
        const spellList = spellsByRegion[region].map(c => c.name).join(", ");
        cardPoolsSection += `Spells: ${spellList}\n`;
      }
      
      cardPoolsSection += "\n";
    }
    
    const allChampionNames = validChampions.map(c => c.name).join(", ");

    const systemPrompt = `You are a Legends of Runeterra deck building expert. Your task is to generate a high-level deck concept based on the user's prompt.

CRITICAL RULES FOR YOUR RESPONSE:
1.  **CHOOSE 1-2 REGIONS ONLY.** All suggested champions and cards must belong to these regions.
2.  **SUGGEST 2-3 CHAMPIONS.** Provide their names, not card codes.
3.  **LIST 10-15 CORE CARDS.** These are essential cards that define the deck's strategy. Provide their names, not card codes.
4.  **DO NOT SUGGEST 0-COST CARDS.**
5.  **ONLY USE CARDS FROM THE PROVIDED CARD POOLS.**

${cardPoolsSection}

Return ONLY a valid JSON object with this exact structure:
{
  "name": "Deck Name",
  "description": "Brief description of deck strategy, win condition, and playstyle (e.g., Aggro, Midrange, Control).",
  "regions": ["Demacia", "Freljord"],
  "champions": ["Garen", "Braum"],
  "coreCards": ["Single Combat", "Sharpsight", "Ranger's Resolve"],
  "playstyle": "Midrange"
}

⚠️ MANDATORY VALIDATION BEFORE RESPONDING:
1.  Ensure all champion and card names are spelled correctly and exist in the provided card pools.
2.  Ensure the regions are correct for all suggested cards.
3.  Ensure the JSON is perfectly formatted.`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${args.prompt}\n\n🚨 AVAILABLE CHAMPIONS: ${allChampionNames}\n\nIf the user asks for a champion NOT in this list, pick similar champions that ARE available.` },
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
    
    const deckConcept = JSON.parse(jsonStr);

    // --- DECK CONSTRUCTION LOGIC ---

    // 1. Sanitize AI suggestions and derive regions from the cards themselves.
    const getCard = (name: string) => cardLookupByName.get(name.toLowerCase());
    
    const allSuggestedCards = [
      ...deckConcept.champions.map(getCard),
      ...deckConcept.coreCards.map(getCard)
    ].filter(Boolean); // .filter(Boolean) removes any undefined/invalid cards

    const regionCounts: { [region: string]: number } = {};
    for (const card of allSuggestedCards) {
      if (card.region !== 'Runeterra' && card.region !== 'Bandle City') { // Exclude general regions for counting
        regionCounts[card.region] = (regionCounts[card.region] || 0) + 1;
      }
    }

    const derivedRegions = Object.keys(regionCounts)
      .sort((a, b) => regionCounts[b] - regionCounts[a])
      .slice(0, 2);

    // 2. Filter the suggested cards to only include those from the derived regions.
    const sanitizedChampions = allSuggestedCards.filter((c: any) => c.type === 'Champion' && derivedRegions.includes(c.region));
    const sanitizedCoreCards = allSuggestedCards.filter((c: any) => c.type !== 'Champion' && derivedRegions.includes(c.region));

    const deck: { [cardCode: string]: { card: any; count: number } } = {};
    let totalCards = 0;
    let championCount = 0;

    const addCard = (card: any, maxCount = 3) => {
      if (totalCards >= 40) return false; // Hard limit to prevent overfilling
      if (!card) return false;
      const existing = deck[card.cardCode];

      if (card.type === "Champion") {
        if (championCount >= 6 && !existing) return false;
        if (existing && existing.count >= maxCount) return false;
      } else {
        if (existing && existing.count >= maxCount) return false;
      }

      if (existing) {
        existing.count++;
        totalCards++;
        if (card.type === "Champion") championCount++;
      } else {
        deck[card.cardCode] = { card, count: 1 };
        totalCards++;
        if (card.type === "Champion") championCount++;
      }
      return true;
    };

    // 3. Add the sanitized champions and core cards to the deck.
    for (const champCard of sanitizedChampions) {
      for (let i = 0; i < 3; i++) addCard(champCard);
    }
    for (const coreCard of sanitizedCoreCards) {
      for (let i = 0; i < 3; i++) addCard(coreCard);
    }

    // 4. Create a pool of candidates to fill the rest of the deck.
    const fillCandidates = allValidCards.filter(c =>
      derivedRegions.includes(c.region) &&
      c.type !== 'Champion' &&
      c.cost > 0
    );
    for (let i = fillCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fillCandidates[i], fillCandidates[j]] = [fillCandidates[j], fillCandidates[i]];
    }
    
    // 5. Fill the deck to 40 cards.
    let attempts = 0;
    while (totalCards < 40 && attempts < 500) {
      const existingCards = Object.values(deck).map(d => d.card);
      let cardAdded = false;
      for (const card of existingCards) {
        if (addCard(card)) cardAdded = true;
        if (totalCards >= 40) break;
      }

      if (totalCards < 40 && !cardAdded && fillCandidates.length > 0) {
        for (const candidate of fillCandidates) {
           if (addCard(candidate)) break;
           if (totalCards >= 40) break;
        }
      }
      attempts++;
    }

    // 6. Failsafe Trimmer: Remove cards if over 40
    while (totalCards > 40) {
      const deckAsArray = Object.values(deck);
      const nonChamps = deckAsArray.filter(c => c.card.type !== "Champion" && c.count > 0);
      if (nonChamps.length > 0) {
        nonChamps.sort((a, b) => a.card.cost - b.card.cost); // Remove cheapest first
        const cardToRemove = nonChamps[0];
        cardToRemove.count--;
        totalCards--;
        if (cardToRemove.count === 0) {
          delete deck[cardToRemove.card.cardCode];
        }
      } else {
        // Last resort: remove champions if no non-champions are left
        const champs = deckAsArray.filter(c => c.card.type === "Champion" && c.count > 0);
        if (champs.length === 0) break; // Should be impossible
        champs.sort((a, b) => a.card.cost - b.card.cost);
        const cardToRemove = champs[0];
        cardToRemove.count--;
        totalCards--;
        championCount--;
        if (cardToRemove.count === 0) {
          delete deck[cardToRemove.card.cardCode];
        }
      }
    }

    // 7. Final validation.
    if (totalCards !== 40) {
      throw new Error(`Failed to construct a valid 40-card deck. Ended up with ${totalCards} cards. This may be due to a very restrictive prompt or too few available cards in the selected regions.`);
    }

    const finalCards = Object.values(deck).map(({ card, count }) => ({
      cardCode: card.cardCode,
      count: count,
      name: card.name,
      cost: card.cost,
      type: card.type,
      region: card.region,
    }));

    // Generate deck code
    const deckCode = generateDeckCode(finalCards);

    return {
      name: deckConcept.name,
      description: deckConcept.description,
      cards: finalCards,
      regions: deckConcept.regions,
      champions: deckConcept.champions,
      deckCode,
    };
  },
});

interface CardInfo {
  cardCode: string;
  count: number;
  name: string;
  cost: number;
  type: string;
  region: string;
}

interface ParsedDeck {
  cards: CardInfo[];
  regions: string[];
  champions: string[];
  totalCards: number;
}

export const parseDeckCode = internalAction({
  args: {
    deckCode: v.string(),
  },
  handler: async (ctx, args): Promise<ParsedDeck> => {
    try {
      const decodedCards = DeckEncoder.decode(args.deckCode);
      
      // Fetch the full card database to look up metadata
      const cardDatabase: any = await ctx.runQuery(internal.cardData.getAllCardsForAI, {});
      const allCards: any[] = [
        ...cardDatabase.champions,
        ...cardDatabase.units,
        ...cardDatabase.spells
      ];
      const cardLookup = new Map<string, any>(allCards.map((card: any) => [card.cardCode, card]));

      const cardList: CardInfo[] = decodedCards.map((decodedCard): CardInfo => {
        const info = cardLookup.get(decodedCard.code);
        if (!info) {
          // This case should be rare if the database is up to date
          console.warn(`Card with code ${decodedCard.code} not found in database.`);
          return {
            cardCode: decodedCard.code,
            count: decodedCard.count,
            name: "Unknown Card",
            cost: 0,
            type: "Unknown",
            region: "Unknown",
          };
        }
        return {
          cardCode: decodedCard.code,
          count: decodedCard.count,
          name: info.name,
          cost: info.cost,
          type: info.type,
          region: info.region,
        };
      });

      // Extract regions and champions from the metadata-rich card list
      const regions = [...new Set(cardList.map((c: CardInfo) => c.region).filter((r: string) => r !== "Unknown"))];
      const champions = [...new Set(cardList.filter((c: CardInfo) => c.type === "Champion").map((c: CardInfo) => c.name))];

      return {
        cards: cardList,
        regions,
        champions,
        totalCards: cardList.reduce((sum: number, c: CardInfo) => sum + c.count, 0),
      };
    } catch (error) {
      console.error("Error decoding deck code:", error);
      throw new Error("Invalid or corrupted deck code provided.");
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
  try {
    // Convert to the format expected by the LoR deck encoder
    const lorCards = cards.map(c => {
      const set = c.cardCode.substring(0, 2);
      const faction = c.cardCode.substring(2, 4);
      const number = c.cardCode.substring(4, 7);
      return Card.from(set, faction, number, c.count);
    });

    // Generate official LoR deck code
    const encoded = DeckEncoder.encode(lorCards);

    if (!encoded || encoded.length === 0) {
      throw new Error("Failed to generate deck code");
    }

    return encoded;
  } catch (error: any) {
    console.error("Error during deck code generation:", error);
    // Add more context to the error
    const cardCodes = cards.map(c => c.cardCode).join(", ");
    throw new Error(`Failed to encode deck. Please check card codes: [${cardCodes}]. Original error: ${error.message}`);
  }
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
