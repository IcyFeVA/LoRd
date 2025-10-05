import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useState } from "react";

interface DeckViewProps {
  deckId: Id<"decks">;
  onBack: () => void;
}

export function DeckView({ deckId, onBack }: DeckViewProps) {
  const deck = useQuery(api.decks.getDeck, { deckId });
  const deleteDeck = useMutation(api.decks.deleteDeck);
  const regenerateDeckCode = useAction(api.ai.regenerateDeckCode);
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!deck) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this deck?")) {
      try {
        await deleteDeck({ deckId });
        toast.success("Deck deleted");
        onBack();
      } catch (error) {
        toast.error("Failed to delete deck");
      }
    }
  };

  const handleRegenerateDeckCode = async () => {
    setIsRegenerating(true);
    try {
      const newDeckCode = await regenerateDeckCode({ deckId });
      toast.success("Deck code regenerated! The new code is now displayed.");
    } catch (error) {
      toast.error("Failed to regenerate deck code");
      console.error(error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Sort cards by cost
  const sortedCards = [...deck.cards].sort((a, b) => {
    const costA = a.cost || 0;
    const costB = b.cost || 0;
    return costA - costB;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 rounded-lg transition-colors flex items-center gap-2"
      >
        ← Back to Decks
      </button>

      <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-purple-500/30 p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-purple-300 mb-3">{deck.name}</h1>
            <p className="text-purple-200 text-lg">{deck.description}</p>
          </div>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            🗑️ Delete
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-purple-900/30 rounded-lg p-4">
            <div className="text-purple-300 text-sm font-medium mb-2">Regions</div>
            <div className="flex flex-wrap gap-2">
              {deck.regions.map((region) => (
                <span key={region} className="px-3 py-1 bg-purple-600/50 rounded-full text-white">
                  {region}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-pink-900/30 rounded-lg p-4">
            <div className="text-pink-300 text-sm font-medium mb-2">Champions</div>
            <div className="flex flex-wrap gap-2">
              {deck.champions.map((champ) => (
                <span key={champ} className="px-3 py-1 bg-pink-600/50 rounded-full text-white">
                  {champ}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-3">
            <div className="text-purple-300 font-medium">Deck Code</div>
            <button
              onClick={handleRegenerateDeckCode}
              disabled={isRegenerating}
              className="px-3 py-1 bg-blue-600/80 hover:bg-blue-500 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? "🔄 Regenerating..." : "🔄 Fix Code"}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={deck.deckCode}
              readOnly
              className="flex-1 px-4 py-3 bg-black/50 border border-purple-500/30 rounded-lg text-white font-mono"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(deck.deckCode);
                toast.success("Deck code copied to clipboard!");
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all transform hover:scale-[1.02]"
            >
              📋 Copy
            </button>
          </div>
          <p className="text-purple-400 text-sm mt-3">
            Paste this code in Legends of Runeterra to import the deck
          </p>
        </div>

        <div>
          <div className="text-purple-300 font-medium mb-4">
            Cards ({deck.cards.reduce((sum, c) => sum + c.count, 0)})
          </div>
          <div className="grid gap-2">
            {sortedCards.map((card, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center bg-gradient-to-r from-gray-900/50 to-purple-900/20 rounded-lg p-4 border border-purple-500/20"
              >
                <div className="flex items-center gap-4">
                  <span className="text-purple-400 font-bold text-lg w-8 text-center">
                    {card.cost !== undefined ? card.cost : "?"}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      {card.name || card.cardCode}
                    </span>
                    {card.type && (
                      <span className="text-xs text-purple-300/70">
                        {card.type} {card.region && `• ${card.region}`}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-purple-300 font-bold text-lg">×{card.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
