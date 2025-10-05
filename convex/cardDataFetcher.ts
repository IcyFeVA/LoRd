"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";

// Riot's Data Dragon URLs for LoR card data
const DATA_DRAGON_BASE = "https://dd.b.pvp.net/latest";
const SET_BUNDLES = [
  "set1", "set2", "set3", "set4", "set5", "set6", "set6cde",
  "set7", "set7b", "set8", "set9", "set10", "set11", "set12"
];

interface RiotCard {
  cardCode: string;
  name: string;
  cost: number;
  type: string;
  rarity: string;
  collectible: boolean;
  region?: string;
  regionRef?: string;
  supertype?: string;
}

// Public action that anyone can call to update card data
export const fetchAndStoreCardData = action({
  args: {},
  handler: async (ctx) => {
    console.log("Fetching card data from Riot Data Dragon...");
    
    const allCards: Array<{
      cardCode: string;
      name: string;
      cost: number;
      type: string;
      region: string;
      rarity: string;
    }> = [];

    // Fetch all set bundles
    for (const setBundle of SET_BUNDLES) {
      try {
        const url = `${DATA_DRAGON_BASE}/${setBundle}/en_us/data/${setBundle}-en_us.json`;
        console.log(`Fetching ${setBundle}...`);
        
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Failed to fetch ${setBundle}: ${response.status}`);
          continue;
        }

        const cards: RiotCard[] = await response.json();
        
        // Filter and process cards
        for (const card of cards) {
          // Only include collectible cards (no tokens/generated cards)
          if (!card.collectible) continue;
          
          // Skip landmarks and other non-standard types for now
          if (card.type === "Landmark") continue;
          
          // Determine card type
          let cardType = card.type;
          if (card.supertype === "Champion") {
            cardType = "Champion";
          } else if (card.type === "Unit") {
            cardType = "Unit";
          } else if (card.type === "Spell") {
            cardType = "Spell";
          }
          
          // Ensure we have a valid region
          const region = card.regionRef || card.region || "Unknown";
          
          allCards.push({
            cardCode: card.cardCode,
            name: card.name,
            cost: card.cost,
            type: cardType,
            region: region,
            rarity: card.rarity,
          });
        }
        
        console.log(`Fetched ${cards.length} cards from ${setBundle}`);
      } catch (error) {
        console.error(`Error fetching ${setBundle}:`, error);
      }
    }

    console.log(`Total cards fetched: ${allCards.length}`);
    
    if (allCards.length === 0) {
      throw new Error("Failed to fetch any cards from Riot's API. The Data Dragon service may be down. Please try again later.");
    }
    
    // Store in database table (not just in-memory)
    await ctx.runMutation(internal.cardData.storeCardsInDatabase, {
      cards: allCards,
    });
    
    console.log(`Successfully stored ${allCards.length} cards in database`);
    
    return { totalCards: allCards.length };
  },
});
