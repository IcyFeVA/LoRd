import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { DeckBuilder } from "./components/DeckBuilder";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <header className="sticky top-0 z-10 bg-black/40 backdrop-blur-md h-16 flex justify-between items-center border-b border-purple-500/30 shadow-lg px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-2xl">⚔️</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            LoR Deck Builder
          </h2>
        </div>
        <SignOutButton />
      </header>
      <main className="flex-1 p-6">
        <Content />
      </main>
      <Toaster theme="dark" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Authenticated>
        <DeckBuilder />
      </Authenticated>

      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Build Epic Decks
            </h1>
            <p className="text-xl text-purple-200">
              AI-powered deck generation for Legends of Runeterra
            </p>
          </div>
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
