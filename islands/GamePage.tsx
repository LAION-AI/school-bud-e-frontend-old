import { Game as GameComponent } from "./Game.tsx";
import type { Game as GameType } from "../types/formats.ts";
import { Edit, Trash2 } from "lucide-preact";
import { Button } from "../components/Button.tsx";

interface GamePageProps {
  game: GameType;
}

export default function GamePage({ game }: GamePageProps) {
  return (
    <div class="max-w-7xl mx-auto">
      <div class="rounded-2xl overflow-hidden">
        <div class="p-6">
          <h1 class="text-3xl font-bold mb-2">{game.title}</h1>
          <div class="flex space-x-4">
            <Button
              onClick={async () => {
                const newName = prompt(
                  "Enter new name for the game:",
                  game.title,
                );
                if (newName && newName !== game.title) {
                  try {
                    const response = await fetch(`/api/game/${game.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: newName }),
                    });
                    if (response.ok) {
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error("Error renaming game:", error);
                    alert("Failed to rename game");
                  }
                }
              }}
            >
              <Edit />
              <span>Rename</span>
            </Button>
            <Button
              onClick={async () => {
                if (confirm("Are you sure you want to delete this game?")) {
                  try {
                    const response = await fetch(`/api/game/${game.id}`, {
                      method: "DELETE",
                    });
                    if (response.ok) {
                      window.location.href = "/games";
                    }
                  } catch (error) {
                    console.error("Error deleting game:", error);
                    alert("Failed to delete game");
                  }
                }
              }}
              variant="danger"
            >
              <Trash2 />
              <span>Delete</span>
            </Button>
          </div>
        </div>
        <div class="p-6">
          <GameComponent
            gameUrl={{ code: game.description, name: game.title }}
          />
        </div>
      </div>
    </div>
  );
}
