// Format configuration interfaces and types

export interface Game {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoNovelSegment {
  id: string;
  type: 'text' | 'image';
  content: string;
  speaker?: string;
  emotion?: string;
  order: number;
}

export interface EditSession {
  originalHash: string;
  editHash: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  error?: string;
}

// SavedGame interface for Deno KV storage
export interface SavedGame {
  id: string;
  code: string;
  name: string;
  points: number;
  timestamp: string;
}

// Collection of saved games
export interface SavedGamesData {
  games: SavedGame[];
}

// Base interface for all format types
export interface BaseFormat {
  type: string;
}

// Game JSON format
export interface GameJson extends BaseFormat {
  type: 'game';
  content: {
    topic: string;
    description: string;
    explanation: string;
    code: string;
  };
}

// Graph JSON format
export interface GraphJson extends BaseFormat {
  type: 'graph';
  items: Array<{
    item: string;
    childItems?: string[];
    connections?: Array<{
      from: string;
      to: string;
    }>;
    position?: { x: number; y: number };
    image?: string;
  }>;
  name?: string;
}

// Web result JSON format
export interface WebResultJson extends BaseFormat {
  type: 'webresult';
  url: string;
  title: string;
  snippet: string;
  metadata?: {
    lastUpdated?: string;
    source?: string;
    [key: string]: unknown;
  };
}

// Flashcards JSON format
export interface FlashcardsJson extends BaseFormat {
  type: 'flashcards';
  cards: Array<{
    id: string;
    front: string;
    back: string;
    tags?: string[];
    metadata?: {
      created?: string;
      lastReviewed?: string;
      difficulty?: number;
      [key: string]: unknown;
    };
  }>;
}

// Test JSON format
export interface TestJson extends BaseFormat {
  type: 'test';
  name: string;
  content: string;
  questions: Array<{
    id: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    question: string;
    options?: string[];
    correctAnswer: string | string[];
  }>;
}

// Presentation JSON format
export interface PresentationJson extends BaseFormat {
  type: 'presentation';
  title: string;
  slides: Array<{
    title: string;
    content: string[];
    imageUrl?: string;
    notes?: string;
  }>;
}

// Union type of all supported formats
export type SupportedFormat = GraphJson | WebResultJson | FlashcardsJson | GameJson | TestJson | PresentationJson;

// Format templates and metadata
export const formatTemplates = {
  webresult: {
    template: `\`\`\`json
{
  "type": "webResults",
  "results": [
    {
      "url": "string",
      "title": "string",
      "description": "string",
    }
  ]
}
json\`\`\``,
    description: 'For search results (webResults) it\'s important to write the webresults type',
    requirements: [],
  },
  graph: {
    template: `\`\`\`json
{
  "type": "graph",
  "items": [
    {
      "item": "string",
      "childItems": ["string"]
      "connections": [{
        "from": "string",
        "to": "string"
      }]
    }
  ],
}
\`\`\``,
    description: 'For graph data it\'s important to write the grapjson type',
    requirements:[]
  },
  flashcards: {
    template: `\`\`\`json
{
  "type": "flashcards",
  "cards": [
    {
      "id": "string",
      "front": "string",
      "back": "string",
      "tags": ["string"],
      "metadata": {
        "created": "string",
        "lastReviewed": "string",
        "difficulty": 0
      }
    }
  ]
}
\`\`\``,
    description: 'For flashcards it\'s important to write the flashcardsjson type',
    requirements:[]
  },
  game: {
    template: '```json\n{ "type": "game", "content": { "topic": "string", "description": "string", "explanation": "string", "code": "string" } }\n```',
    description: 'For game content it\'s important to write the json type',
    requirements: [
      'Game must use Phaser.js and JavaScript but written in the JSON format.',
      'The json must not have any comments or linebreaks.',
      'Parent should be the div with id="phaser-game"',
      'Do not use HTML.',
      'If you need assets you can use these small pixel art images and scale them up: /games/background.png, /games/currency.png, /games/dropzone.png /games/option_correct.png /games/option_wrong.png',
      'Should call the global function gameScore(gameName, points) if a user scored some points, it is essential to user experience',
      'Remove text when displaying right/wrong outputs',
      'Position game within container, not at end of body',
    ],
    defaultConfig: {
      type: 'Phaser.AUTO',
      width: 800,
      height: 600,
      backgroundColor: '#fff'
    }
  },
  test: {
    template: '```json\n{\n  "type": "test",\n  "name": "string",\n  "content": "string",\n  "questions": [\n    {\n      "id": "string",\n      "type": "multiple_choice | true_false | short_answer",\n      "question": "string",\n      "options": ["string"],\n      "correctAnswer": "string" or ["string"]\n    }\n  ]\n}\n```',
    description: 'For test content it\'s important to write the test type',
    requirements: [
      'Each question must have a unique id',
      'Question types must be one of: multiple_choice, true_false, short_answer',
      'Multiple choice questions must include options array',
      'True/false questions should have "True" or "False" as correctAnswer',
      'correctAnswer can be a string or an array of strings (for multiple correct answers)'
    ],
  },
  presentation: {
    template: `\`\`\`json
{
  "type": "presentation",
  "title": "string",
  "slides": [
    {
      "title": "string",
      "content": ["string"],
      "imageUrl": "string (optional)",
      "notes": "string (optional)"
    }
  ]
}
\`\`\``,
    description: 'For presentation content it\'s important to write the presentation type',
    requirements: [
      'Each slide should have a clear title',
      'Content should be provided as an array of strings, each representing a bullet point or paragraph',
      'Optional imageUrl can be included for slides that need visual elements',
      'Optional notes can be included for presenter notes'
    ],
  },
};

// Type guard functions
export const isGraphJson = (format: BaseFormat): format is GraphJson => {
  return format.type === 'graph';
};

export const isWebResultJson = (format: BaseFormat): format is WebResultJson => {
  return format.type === 'webresult';
};

export const isFlashcardsJson = (format: BaseFormat): format is FlashcardsJson => {
  return format.type === 'flashcards';
};

export const isGameJson = (format: BaseFormat): format is GameJson => {
  return format.type === 'game';
};

export const isTestJson = (format: BaseFormat): format is TestJson => {
  return format.type === 'test';
};

export const isPresentationJson = (format: BaseFormat): format is PresentationJson => {
  return format.type === 'presentation';
};

// SavedGame interface for Deno KV storage
export interface SavedGame {
  id: string;
  code: string;
  name: string;
  points: number;
  timestamp: string;
}

// Collection of saved games
export interface SavedGamesData {
  games: SavedGame[];
}
