import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { DeckList } from "./DeckList";
import { DeckView } from "./DeckView";
import type { Id } from "../../convex/_generated/dataModel";

export function DeckBuilder() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<any>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<Id<"decks"> | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importName, setImportName] = useState("");
  const [importDescription, setImportDescription] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  
  const generateDeck = useAction(api.ai.generateDeck);
  const createDeck = useMutation(api.decks.createDeck);
  const importDeckFromCode = useAction(api.ai.importDeckFromCode);
  const userDecks = useQuery(api.decks.listUserDecks);
  const fetchCardData = useAction(api.cardDataFetcher.fetchAndStoreCardData);
  const cardStats = useQuery(api.cardData.getCardDatabaseStats);
  const [isFetchingCards, setIsFetchingCards] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a deck prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const deck = await generateDeck({ prompt });
      setGeneratedDeck(deck);
      toast.success("Deck generated successfully!");
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || "Failed to generate deck";
      
      // Extract the actual error message if it's wrapped
      let displayMessage = errorMessage;
      if (errorMessage.includes("Invalid deck:")) {
        const match = errorMessage.match(/Invalid deck: ([^]+?)(?:\. Try again\.|\n|$)/);
        if (match) {
          displayMessage = match[1];
        }
      }
      
      toast.error(`Generation failed: ${displayMessage}`, {
        duration: 5000,
      });
      console.error("Deck generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDeck = async () => {
    if (!generatedDeck) return;

    try {
      await createDeck(generatedDeck);
      toast.success("Deck saved!");
      setGeneratedDeck(null);
      setPrompt("");
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || "Failed to save deck";
      toast.error(`Save failed: ${errorMessage}`, {
        duration: 5000,
      });
      console.error("Deck save error:", error);
    }
  };

  const handleImport = async () => {
    if (!importCode.trim()) {
      toast.error("Please enter a deck code");
      return;
    }

    setIsImporting(true);
    try {
      await importDeckFromCode({
        deckCode: importCode.trim(),
        name: importName.trim() || "Imported Deck",
        description: importDescription.trim() || "Imported from deck code",
      });
      toast.success("Deck imported successfully!");
      setShowImport(false);
      setImportCode("");
      setImportName("");
      setImportDescription("");
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || "Failed to import deck";
      toast.error(`Import failed: ${errorMessage}`, {
        duration: 5000,
      });
      console.error("Deck import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFetchCards = async () => {
    setIsFetchingCards(true);
    try {
      const result = await fetchCardData({});
      toast.success(`Fetched ${result.totalCards} cards from Riot!`);
    } catch (error: any) {
      toast.error(`Failed to fetch cards: ${error?.message || error}`);
    } finally {
      setIsFetchingCards(false);
    }
  };

  if (selectedDeckId) {
    return <DeckView deckId={selectedDeckId} onBack={() => setSelectedDeckId(null)} />;
  }

  // Sort generated deck cards by cost
  const sortedGeneratedCards = generatedDeck?.cards 
    ? [...generatedDeck.cards].sort((a: any, b: any) => {
        const costA = a.cost || 0;
        const costB = b.cost || 0;
        return costA - costB;
      })
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Generator Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-purple-500/30 p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-purple-300">AI Deck Generator</h2>
            <div className="flex gap-2">
              <button onClick={handleFetchCards} disabled={isFetchingCards} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg disabled:opacity-50" title="Update cards">
                {isFetchingCards ? "⏳" : "🔄"}
              </button>
              <button onClick={() => setShowImport(!showImport)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-lg transition-all transform hover:scale-[1.02]">
                {showImport ? "✨ Generate" : "📥 Import"}
              </button>
            </div>
          </div>
          
          {showImport ? (
            <div className="space-y-4">
              <div>
                <label className="block text-purple-200 mb-2 font-medium">
                  Deck Code
                </label>
                <textarea
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  placeholder="Paste your deck code here (e.g., CECQCAQCA4AQIAYKAIAQGLRWAQAQECAPEUXAIAQDAEBQOCIBAIAQEMJYAA)"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all min-h-[100px] resize-none font-mono text-sm"
                  disabled={isImporting}
                />
              </div>

              <div>
                <label className="block text-purple-200 mb-2 font-medium">
                  Deck Name (Optional)
                </label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="My Awesome Deck"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  disabled={isImporting}
                />
              </div>

              <div>
                <label className="block text-purple-200 mb-2 font-medium">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={importDescription}
                  onChange={(e) => setImportDescription(e.target.value)}
                  placeholder="A powerful deck for climbing ranked"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                  disabled={isImporting}
                />
              </div>

              <button
                onClick={handleImport}
                disabled={isImporting || !importCode.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-blue-500/50"
              >
                {isImporting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Importing...
                  </span>
                ) : (
                  "📥 Import Deck"
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-purple-200 mb-2 font-medium">
                  Describe your dream deck
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Create a super fun deck that is fun and different in each match. No one knows what's coming next"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all min-h-[120px] resize-none"
                  disabled={isGenerating}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-purple-500/50"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </span>
                ) : (
                  "✨ Generate Deck"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Generated Deck Preview */}
        {generatedDeck && (
          <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-purple-500/30 p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-purple-300">{generatedDeck.name}</h3>
                <p className="text-purple-200 mt-2">{generatedDeck.description}</p>
              </div>
              <button
                onClick={handleSaveDeck}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
              >
                💾 Save Deck
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-900/30 rounded-lg p-4">
                <div className="text-purple-300 text-sm font-medium mb-2">Regions</div>
                <div className="flex flex-wrap gap-2">
                  {generatedDeck.regions.map((region: string) => (
                    <span key={region} className="px-3 py-1 bg-purple-600/50 rounded-full text-white text-sm">
                      {region}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-pink-900/30 rounded-lg p-4">
                <div className="text-pink-300 text-sm font-medium mb-2">Champions</div>
                <div className="flex flex-wrap gap-2">
                  {generatedDeck.champions.map((champ: string) => (
                    <span key={champ} className="px-3 py-1 bg-pink-600/50 rounded-full text-white text-sm">
                      {champ}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
              <div className="text-purple-300 text-sm font-medium mb-3">Deck Code</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedDeck.deckCode}
                  readOnly
                  className="flex-1 px-4 py-2 bg-black/50 border border-purple-500/30 rounded-lg text-white font-mono text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedDeck.deckCode);
                    toast.success("Deck code copied!");
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <div>
              <div className="text-purple-300 text-sm font-medium mb-3">
                Cards ({generatedDeck.cards.reduce((sum: number, c: any) => sum + c.count, 0)})
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {sortedGeneratedCards.map((card: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-purple-400 font-bold text-sm w-6 text-center">
                        {card.cost !== undefined ? card.cost : "?"}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-white text-sm">
                          {card.name || card.cardCode}
                        </span>
                        {card.type && (
                          <span className="text-xs text-purple-300/70">
                            {card.type} {card.region && `• ${card.region}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-purple-300 font-bold">×{card.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Saved Decks Section */}
      <div className="lg:col-span-1">
        <DeckList decks={userDecks || []} onSelectDeck={setSelectedDeckId} />
      </div>
    </div>
  );
}
