import type { Id } from "../../convex/_generated/dataModel";

interface Deck {
  _id: Id<"decks">;
  name: string;
  description: string;
  regions: string[];
  champions: string[];
  _creationTime: number;
}

interface DeckListProps {
  decks: Deck[];
  onSelectDeck: (deckId: Id<"decks">) => void;
}

export function DeckList({ decks, onSelectDeck }: DeckListProps) {
  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-purple-500/30 p-6 shadow-2xl sticky top-24">
      <h2 className="text-2xl font-bold text-purple-300 mb-6">Your Decks</h2>
      
      {decks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎴</div>
          <p className="text-purple-300">No decks yet</p>
          <p className="text-purple-400 text-sm mt-2">Generate your first deck!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
          {decks.map((deck) => (
            <button
              key={deck._id}
              onClick={() => onSelectDeck(deck._id)}
              className="w-full text-left bg-gradient-to-br from-purple-900/40 to-pink-900/40 hover:from-purple-800/50 hover:to-pink-800/50 rounded-xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all transform hover:scale-[1.02]"
            >
              <h3 className="font-bold text-white mb-2">{deck.name}</h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {deck.regions.map((region) => (
                  <span key={region} className="px-2 py-0.5 bg-purple-600/50 rounded text-xs text-white">
                    {region}
                  </span>
                ))}
              </div>
              <p className="text-purple-300 text-xs line-clamp-2">{deck.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
