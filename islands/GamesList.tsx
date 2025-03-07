import { useEffect, useState } from "preact/hooks";
import type { SavedGame } from "../types/formats.ts";

export default function GamesList({ lang }: { lang: string }) {
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/game");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setSavedGames(data || []);
    } catch (error) {
      console.error('Error fetching saved games:', error);
      setError('Failed to load saved games. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div class="flex items-center justify-center min-h-screen">
        <div class="animate-pulse text-gray-600">Loading games...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Your Games</h1>
        
        {savedGames.length === 0 ? (
          <div class="text-center py-12">
            <p class="text-gray-500 mb-4">
              No saved games found. Create and save a game to see it here!
            </p>
          </div>
        ) : (
          <div class="grid gap-6 sm:grid-cols-2">
            {savedGames.map((game) => (
              <a
                key={game.id}
                href={`/games/${game.id}`}
                class="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 group"
              >
                <div class="flex items-start justify-between mb-2">
                  <h2 class="text-xl font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                    {game.name}
                  </h2>
                  <div class="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-sm font-medium">
                    {game.points}p
                  </div>
                </div>
                <p class="text-sm text-gray-500">
                  Created {new Date(game.timestamp).toLocaleDateString()}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 