import { useEffect, useRef, useState } from "preact/hooks";

const buildCode = (scriptRef:any, code: string) => {
  let finalCode = '';
  if (scriptRef.current) {
    if (!code.includes("function createButton")) {
      finalCode += `// Hilfsfunktionen für die KI zur schnellen Erweiterung
function createButton(scene, text, x, y, callback) {
  let button = scene.add.text(x, y, text, { font: '24px Arial', fill: '#000', backgroundColor: '#444' })
    .setPadding(10)
    .setInteractive()
    .on('pointerdown', callback);
  return button;
}`;
    } else if (!code.includes("function createRandomEntity")) {
      finalCode += `
function createRandomEntity(scene) {
  let x = Phaser.Math.Between(50, 750);
  let y = Phaser.Math.Between(50, 550);
  let entity = scene.add.circle(x, y, 20, 0x000);
  return entity;
}`;
    }
    if (!code.includes("function gameScore")) {
      finalCode += `function gameScore(id, points) {
  fetch('/api/game', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, points })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Score updated:', data);
    // Emit a custom event with the updated score data
    const scoreUpdateEvent = new CustomEvent('gameScoreUpdate', {
      detail: { id, points }
    });
    window.dispatchEvent(scoreUpdateEvent);
    return data.totalPoints;
  })
  .catch(error => {
    console.error('Error updating score:', error);
    return null;
  });
}`;
    }

    finalCode += code;
  }
  return finalCode;
}
interface GameProps {
  gameUrl: {
    code: string,
    name?: string
  }
}

export function Game({ gameUrl: gameData }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const phaserScriptRef = useRef<HTMLScriptElement>(null);
  const phaserRexScriptRef = useRef<HTMLScriptElement>(null);
  const scriptRef = useRef<HTMLScriptElement>(null);
  const [gameName, setGameName] = useState('');
  let code = ''
  try {
    code = gameData.code;
  } catch (e) { console.error(e); }
  const [editableCode, setEditableCode] = useState(code);


  useEffect(() => {
    if(code === "") return;
    if (!containerRef.current) return;
    setEditableCode(code);

    // Create Shadow DOM if it doesn't exist
    if (!shadowRootRef.current) {
      // shadowRootRef.current = containerRef.current.attachShadow({ mode: 'open' });

      // Create container for the game
      const gameContainer = document.createElement('div');
      gameContainer.id = 'phaser-game';
      gameContainer.style.cssText = 'width: 100%; aspect-ratio:800/ 600;  border: 1px solid #ccc; border-radius: 0.5rem; overflow: hidden;';

      // Create and append scripts to shadow DOM
      const phaserScript = document.createElement('script');
      phaserScript.src = '/games/phaser.min.js';
      phaserScriptRef.current = phaserScript;

      const phaserRexScript = document.createElement('script');
      phaserRexScript.src = '/games/rexuiplugin.min.js';
      phaserRexScriptRef.current = phaserRexScript;

      const gameScript = document.createElement('script');
      gameScript.type = 'module';
      scriptRef.current = gameScript;

      // containerRef.current.appendChild(phaserRexScript);
      containerRef.current.appendChild(phaserScript);
      containerRef.current.appendChild(gameScript);
      containerRef.current.appendChild(gameContainer);



      let rexLoaded = false;
      phaserRexScript.onload = () => {
        rexLoaded = true;
      }
      // Set up script loading sequence
      phaserScript.onload = () => {
        console.log("Phaser Script loaded")
        if (true) {
          console.log("Rex loaded before phaser")
          gameScript.innerHTML = buildCode(scriptRef, code);
        } else {
          console.log("Waiting for Rex to Load")
          phaserRexScript.addEventListener('load', () => {
            console.log("Rex loaded after phaser")
            gameScript.innerHTML = buildCode(scriptRef, code);
          });
        }
      };
    }

    return () => {
      if (shadowRootRef.current) {
        // Clean up scripts and container
        while (shadowRootRef.current.firstChild) {
          shadowRootRef.current.removeChild(shadowRootRef.current.firstChild);
        }
        // Clean up any existing game instance
        if ((window as any).game) {
          (window as any).game.destroy(true);
        }
      }
    };
  }, [code]);

  return (
    <div>
      {!gameData.name && (
        <div class="z-10 flex space-x-2 pb-4">
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName((e.target as HTMLInputElement).value)}
            placeholder="Game name"
            class="px-2 py-1 text-sm border rounded"
          />
          <button
            type="button"
            onClick={async () => {
              if (!gameName) {
                alert('Please enter a game name');
                return;
              }
              try {
                const response = await fetch('/api/game', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: gameName, code })
                });
                const data = await response.json();
                if (data.success) {
                  alert('Game saved successfully!');
                  setGameName('');
                } else {
                  alert(`Failed to save game: ${data.error}`);
                }
              } catch (error) {
                console.error('Error saving game:', error);
                alert('Failed to save game');
              }
            }}
            class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Save Game
          </button>
        </div>
      )}
      <div ref={containerRef} class="" />
    </div>
  );
}