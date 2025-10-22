# School Bud-E Frontend - Comprehensive Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Key Components](#key-components)
5. [Configuration Files](#configuration-files)
6. [Routing Structure](#routing-structure)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Styling Approach](#styling-approach)
10. [Build and Development](#build-and-development)
11. [Key Features](#key-features)
12. [Dependencies](#dependencies)
13. [Architecture Patterns](#architecture-patterns)
14. [Security & Privacy](#security--privacy)
15. [Internationalization](#internationalization)
16. [Deployment Options](#deployment-options)
17. [Project Metadata](#project-metadata)
18. [Bug Tracking & Known Issues](#bug-tracking--known-issues)

---

## Project Overview

**School Bud-E** is an AI-powered educational assistant frontend application designed to revolutionize the learning experience through intelligent, empathetic interaction. It's a web-based chat application that connects students with an AI tutor named "School Bud-E" created by LAION (Large-scale Artificial Intelligence Open Network).

### Key Purpose

- Provide real-time educational support through conversational AI
- Enable multimodal interaction (text, voice, images)
- Support student learning with empathetic, adaptive responses
- Facilitate knowledge retrieval from educational databases
- Support correction of student assignments with vision language models

### Status

Early prototype/experimental demo version (as of October 2024)

### Primary Users

Students and educators in school environments

### Supported Languages

German (de) and English (en)

---

## Technology Stack

### Framework & Runtime

- **Fresh Framework** (2.1.2)
  - Deno-based, full-stack web framework
  - File-based routing, islands architecture, and server-side rendering
  - Frontend rendered with Preact (lightweight React alternative)
  - TypeScript-first development

- **Deno Runtime**
  - JavaScript runtime - modern alternative to Node.js
  - Security and module management improvements
  - File-based imports using ES modules

### Frontend Libraries

- **Preact** (10.22.0) - Lightweight React-like UI framework
  - JSX support via `preact/jsx-runtime`
  - Hooks library: `@preact/hooks` for state management
  - Signals: `@preact/signals` (1.2.2) for reactive state
  - `@preact/signals-core` (1.5.1) - core signal implementation

### Styling

- **Tailwind CSS** (4.1.7) - Utility-first CSS framework
  - Configuration in `/tailwind.config.ts`
  - Custom animations: fade-in animation defined
  - Post-processing via Fresh's Tailwind plugin

### API & Data Handling

- **Fetch API** (Browser standard) - HTTP requests
- **EventSource** (@microsoft/fetch-event-source@2.0.1) - Server-Sent Events (SSE)
  - Used for streaming chat responses from LLM backend
  - Real-time message streaming without WebSocket overhead

### Additional Libraries

- **Buffer** (npm:buffer) - Node.js Buffer polyfill for browser
  - Used in TTS audio handling

### Development & Build Tools

- **TypeScript** - Type safety across codebase
- **Deno Linting** - Code quality checks
- **Deno Formatting** - Code consistency

---

## Project Structure

```
school-bud-e-frontend/
├── routes/                           # Server-side page routes (Fresh)
│   ├── _app.tsx                      # App layout wrapper
│   ├── _404.tsx                      # Error 404 page
│   ├── index.tsx                     # Home page (/)
│   ├── about.tsx                     # About page (/about)
│   └── api/                          # Backend API routes
│       ├── chat.ts                   # LLM chat endpoint
│       ├── tts.ts                    # Text-to-Speech endpoint
│       ├── stt.ts                    # Speech-to-Text endpoint
│       ├── wikipedia.ts              # Wikipedia search API
│       ├── papers.ts                 # Academic papers search API
│       └── bildungsplan.ts           # German education curriculum search API
│
├── islands/                          # Interactive client-side components
│   ├── ChatIsland.tsx                # Main chat interface container (1459 lines)
│   ├── ChatAgreement.tsx             # Terms & conditions agreement modal
│   ├── ChatAgreementOrIsland.tsx     # Router between agreement/chat
│   ├── Header.tsx                    # App header with logo
│   └── Menu.tsx                      # Navigation menu & language selector
│
├── components/                       # Reusable UI components
│   ├── ChatTemplate.tsx              # Chat message rendering & display
│   ├── ChatSubmitButton.tsx          # Submit/send button
│   ├── VoiceRecordButton.tsx         # Audio recording & STT integration
│   ├── ImageUploadButton.tsx         # Image upload for vision AI
│   ├── Settings.tsx                  # API key & configuration settings
│   └── Warning.tsx                   # Disclaimer/warning banner
│
├── internalization/                  # Localization (i18n)
│   ├── content.ts                    # Main content & prompts in EN/DE
│   └── agreement-content.ts          # Terms of service content
│
├── static/                           # Static assets
│   ├── favicon.ico
│   ├── logo.png                      # School Bud-E mascot (lion)
│   ├── lines.svg                     # Background pattern
│   ├── intro.mp3                     # German intro audio
│   ├── intro-en.mp3                  # English intro audio
│   └── styles.css                    # Tailwind directives
│
├── docker-compose/                   # Docker deployment
│   ├── docker-compose.yml            # Orchestration config
│   ├── .example.env                  # Environment template
│   ├── docker-rebuild.sh             # Build script
│   └── caddy/                        # Reverse proxy configuration
│
├── docker-webhook/                   # Webhook deployment utilities
│
├── node_modules/                     # Dependencies (Deno-managed)
│
├── .idea/                            # IDE settings
│
├── deno.json                         # Deno project config & task definitions
├── fresh.config.ts                   # Fresh framework configuration
├── fresh.gen.ts                      # Auto-generated route manifest
├── tailwind.config.ts                # Tailwind CSS configuration
├── main.ts                           # Production entry point
├── dev.ts                            # Development entry point
├── types.d.ts                        # Global TypeScript definitions
├── .example.env                      # Example environment variables
├── .gitignore                        # Git ignore patterns
├── README.md                         # Project documentation
└── banner.png                        # Project banner image
```

---

## Key Components

### Primary Islands (Interactive Components)

#### ChatIsland.tsx (1459 lines)

Core chat interface state management component.

**Key Responsibilities:**
- Handles message sending/receiving
- Audio playback management
- Settings persistence to localStorage
- Integration with all API endpoints
- Supports multiple chat sessions

**Key State Variables:**
```typescript
- messages: Message[]                  // Chat history
- audioFileDict: AudioFileDict         // Cached audio responses
- images: Image[]                      // Uploaded images for VLM
- settings: {                          // API configuration
  universalApiKey, apiUrl, apiKey, apiModel,
  ttsUrl, ttsKey, ttsModel,
  sttUrl, sttKey, sttModel,
  systemPrompt, vlmUrl, vlmKey, vlmModel, vlmCorrectionModel
}
- currentChatSuffix: string            // Multi-chat support
- isStreamComplete: boolean            // Streaming state
- readAlways: boolean                  // TTS always on setting
- autoScroll: boolean                  // Auto-scroll setting
```

**Key Methods:**
- `getTTS()` - Get text-to-speech audio
- `fetchWikipedia()` - Search Wikipedia
- `fetchPapers()` - Search academic papers (ORKG)
- `fetchBildungsplan()` - Search German education curriculum
- `handleChatSubmit()` - Send message to LLM API
- `handleEditMessage()` - Modify previous messages
- `handleOnSpeakAtGroupIndexAction()` - Play audio responses

**Location:** `islands/ChatIsland.tsx`

#### ChatAgreement.tsx

Terms & conditions modal that blocks access until user accepts.

**Features:**
- Checkbox for user agreement
- Stores agreement state in localStorage
- Blocks chat until accepted

**Location:** `islands/ChatAgreement.tsx`

#### Header.tsx

Application header component.

**Features:**
- Displays logo and app title
- Includes Menu component
- Responsive design with Tailwind

**Location:** `islands/Header.tsx`

#### Menu.tsx

Navigation and language selection component.

**Features:**
- Language selector (DE/EN)
- Navigation links (About, Imprint)
- Top-right positioning

**Location:** `islands/Menu.tsx`

### Reusable Components

#### ChatTemplate.tsx

Message rendering and display component.

**Features:**
- Renders message history
- Displays streaming responses
- Audio playback controls
- Message editing buttons
- Link rendering (DOI, URLs)
- Text formatting (bold text)
- Auto-scroll on new messages

**Location:** `components/ChatTemplate.tsx`

#### ChatSubmitButton.tsx

Submit button for sending messages.

**Features:**
- SVG arrow icon button
- Position: absolute bottom-right
- Disabled state styling
- Conditional rendering based on IS_BROWSER

**Location:** `components/ChatSubmitButton.tsx`

#### VoiceRecordButton.tsx

Audio recording component with STT integration.

**Features:**
- Web Audio API integration
- MediaRecorder for recording
- Browser SpeechRecognition API (fallback)
- Sends audio to `/api/stt` for transcription
- Async audio processing

**Location:** `components/VoiceRecordButton.tsx`

#### ImageUploadButton.tsx

Image upload component for vision AI.

**Features:**
- File input for image selection
- FileReader for base64 encoding
- Converts images to data URLs
- Supports multiple image upload
- Returns Image[] with base64 encoded content

**Location:** `components/ImageUploadButton.tsx`

#### Settings.tsx

API configuration component.

**Features:**
- Configuration form with provider detection
- Auto-fills API settings based on key prefix:
  - `AI*` → Google AI (Gemini)
  - `hypr-lab*` → HyprLab
  - `gsk_*` → Groq
- Advanced/basic toggle
- Settings persistence to localStorage
- Accepts both universal API keys and custom configurations

**Location:** `components/Settings.tsx`

#### Warning.tsx

Feature documentation banner.

**Features:**
- Yellow alert box with feature documentation
- Shows available commands (#wikipedia, #papers, #bildungsplan, #correction)
- Displays support email

**Location:** `components/Warning.tsx`

---

## Configuration Files

### deno.json

Deno project configuration file.

```json
{
  "lock": false,
  "tasks": {
    "check": "deno fmt --check && deno lint && deno check",
    "cli": "Fresh CLI runner",
    "manifest": "Generate Fresh manifest",
    "start": "deno run -A --watch=static/,routes/ dev.ts",
    "build": "deno run -A dev.ts build",
    "preview": "deno run -A main.ts",
    "update": "deno run -A -r https://fresh.deno.dev/update ."
  },
  "lint": { "rules": { "tags": ["fresh", "recommended"] } },
  "imports": {
    "$fresh/": "https://deno.land/x/fresh@1.7.2/",
    "preact": "https://esm.sh/preact@10.22.0",
    "@preact/signals": "https://esm.sh/*@preact/signals@1.2.2",
    "tailwindcss": "npm:tailwindcss@3.4.1",
    "$std/": "https://deno.land/std@0.216.0/"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  },
  "nodeModulesDir": "auto"
}
```

**Location:** `deno.json`

### fresh.config.ts

Fresh framework configuration.

```typescript
import tailwind from "$fresh/plugins/tailwind.ts";

export default defineConfig({
  plugins: [tailwind()],
});
```

**Location:** `fresh.config.ts`

### tailwind.config.ts

Tailwind CSS configuration.

```typescript
{
  content: ["{routes,islands,components}/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
      },
      animation: {
        "fade-in": "fadeIn 1s ease-out",
      },
    },
  },
  plugins: [],
}
```

**Location:** `tailwind.config.ts`

### types.d.ts

Global TypeScript type definitions including:
- SpeechRecognition API types
- Wikipedia Query/Result interfaces
- Papers API types
- Bildungsplan types
- Audio management interfaces
- Message and Image types
- Internationalization content types

**Location:** `types.d.ts`

### .example.env

Environment variable template.

```env
# Server Backend
SERVER_URL="http://...:8001"
SERVER_API_KEY="..."

# Speech-to-Text (Groq)
GROQ_API_KEY="gsk_..."
GROQ_API_MODEL="whisper-large-v3"

# LLM APIs
API_URL="https://.../v1/chat/completions"
API_KEY="api-key"
API_MODEL="gpt-4o"

# TTS APIs (optional)
TTS_KEY="..."
TTS_URL="..."
TTS_MODEL="..."
```

**Location:** `.example.env`

---

## Routing Structure

### Page Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `routes/index.tsx` | Home page with header & chat |
| `/about` | `routes/about.tsx` | About School Bud-E page |
| `/404` | `routes/_404.tsx` | Error 404 page |
| `*` | `routes/_app.tsx` | Layout wrapper (all pages) |

### API Routes

| Route | Method | File | Purpose |
|-------|--------|------|---------|
| `/api/chat` | POST | `routes/api/chat.ts` | LLM chat endpoint (streaming) |
| `/api/tts` | POST | `routes/api/tts.ts` | Text-to-Speech synthesis |
| `/api/stt` | POST | `routes/api/stt.ts` | Speech-to-Text transcription |
| `/api/wikipedia` | GET/POST | `routes/api/wikipedia.ts` | Wikipedia search |
| `/api/papers` | GET/POST | `routes/api/papers.ts` | Academic papers search (ORKG) |
| `/api/bildungsplan` | GET/POST | `routes/api/bildungsplan.ts` | German curriculum search |

### Query Parameters

**Home Page (`/?lang=de` or `/?lang=en`)**
- `lang`: Language selection (default: "de")

**About Page (`/about?lang=...`)**
- `lang`: Language selection (default: "de")

---

## State Management

### Client-Side State (Preact Hooks & localStorage)

#### localStorage Keys

```typescript
const stateKeys = {
  // Agreement
  "school-bud-e-agreement": "true|false",

  // Settings (API Configuration)
  "bud-e-universal-api-key": string,
  "bud-e-api-url": string,
  "bud-e-api-key": string,
  "bud-e-model": string,
  "bud-e-tts-url": string,
  "bud-e-tts-key": string,
  "bud-e-tts-model": string,
  "bud-e-stt-url": string,
  "bud-e-stt-key": string,
  "bud-e-stt-model": string,
  "bud-e-system-prompt": string,
  "bud-e-vlm-url": string,
  "bud-e-vlm-key": string,
  "bud-e-vlm-model": string,
  "bud-e-vlm-correction-model": string,

  // Multi-chat support
  // Pattern: "school-bud-e-chat-{suffix}"
  "school-bud-e-chat-0": JSON.stringify(messages)
}
```

#### React Hooks Used

- `useState()` - Component state
- `useEffect()` - Side effects (loading, cleanup)
- `useRef()` - DOM references (file inputs, media recorders)

**No Redux/Zustand** - Pure local component state + localStorage

#### Message Structure

```typescript
interface Message {
  role: "user" | "assistant" | "system";
  content: string | Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: {
      url: string;           // Base64 data URL for images
      detail: "high" | "low";
    };
  }>;
}
```

---

## API Integration

### Backend Communication Pattern

#### 1. Chat API (`/api/chat`)

**Method:** POST (streaming)

**Request Body:**
```typescript
{
  messages: Message[],          // Chat history
  lang: string,                 // "en" or "de"
  universalApiKey: string,      // Optional: "sbe-*" format
  llmApiUrl: string,            // Optional override
  llmApiKey: string,
  llmApiModel: string,
  systemPrompt: string,         // Optional custom prompt
  vlmApiUrl: string,            // Vision LLM endpoint
  vlmApiKey: string,
  vlmApiModel: string,
  vlmCorrectionModel: string    // For assignment correction
}
```

**Response:** Server-Sent Events (text/event-stream)
```
event: message
data: "{\"chunk\": \"Hello...\"}"
```

**Features:**
- Automatic system prompt selection based on language
- Image detection → routes to VLM API
- `#correction` / `#korrektur` hashtag detection → uses correction model
- Streaming response chunks
- Support for both universal and custom API keys

**Location:** `routes/api/chat.ts`

#### 2. Text-to-Speech API (`/api/tts`)

**Method:** POST

**Request:**
```typescript
{
  text: string,                 // Text to synthesize
  textPosition: string,         // For logging
  ttsUrl: string,               // Optional override
  ttsKey: string,               // API key
  ttsModel: string              // Model identifier
}
```

**Response:** `audio/mp3` binary data

**Supported Models:**
- MARS6 (proprietary)
- aura-helios-en (Deepgram)
- Generic OpenAI-compatible endpoints

**Processing:**
- Removes markdown bold syntax (`**text**`)
- Replaces "bud-e" with "buddy" for better pronunciation

**Location:** `routes/api/tts.ts`

#### 3. Speech-to-Text API (`/api/stt`)

**Method:** POST (FormData)

**Request:**
```typescript
FormData {
  audio: File,                  // WAV audio file
  sttUrl: string,               // Optional override
  sttKey: string,               // API key
  sttModel: string              // Model identifier
}
```

**Response:** Plain text transcription

**Supported Providers:**
- Groq (Whisper Large V3 Turbo) - auto-detected by `gsk_` prefix
- Generic OpenAI-compatible endpoints

**Location:** `routes/api/stt.ts`

#### 4. Wikipedia Search API (`/api/wikipedia`)

**Method:** GET or POST

**Request:**
```typescript
{
  text: string,                 // Search query
  collection: string,           // "English-ConcatX-Abstract" (default)
  n: number                     // Number of results (default: 2)
}
```

**Response:**
```typescript
WikipediaResult[] {
  Title: string,
  content: string,
  URL: string,
  score: string
}
```

**Backend:** Custom endpoint at `http://37.27.128.150:9999/search`

**Location:** `routes/api/wikipedia.ts`

#### 5. Papers Search API (`/api/papers`)

**Method:** GET or POST

**Request:**
```typescript
{
  query: string,                // Search query
  limit: number                 // Results (default: 5)
}
```

**Response:**
```typescript
{
  payload: {
    items: Array<{
      id: string,
      doi: string,
      date_published: string,
      title: string,
      abstract: string,
      authors: string[],
      subjects: string[]
    }>,
    total_hits: number,
    has_more: boolean
  }
}
```

**Backend:** ORKG (Open Research Knowledge Graph) API at `https://api.ask.orkg.org/index/search`

**Location:** `routes/api/papers.ts`

#### 6. Bildungsplan (Curriculum) API (`/api/bildungsplan`)

**Method:** GET or POST

**Request:**
```typescript
{
  query: string,                // Search query
  top_n: number                 // Results (default: 5)
}
```

**Response:**
```typescript
{
  results: Array<{
    score: number,
    text: string
  }>
}
```

**Backend:** German education curriculum search at `http://213.173.96.19:8020/query`

**Location:** `routes/api/bildungsplan.ts`

### Command Keywords

Users can trigger special features by including hashtags:

- `#wikipedia[:language[:top_n]]: search_term` - Wikipedia search
  - `#wikipedia_de: Berlin` - German Wikipedia
  - `#wikipedia_en: Berlin` - English Wikipedia
  - `#wikipedia: Berlin:5` - Limit to 5 results

- `#papers[:top_n]: search_term` - Academic papers search
  - `#papers: machine learning:3`

- `#bildungsplan[:top_n]: search_term` - German curriculum search
  - `#bildungsplan: mathematics`

- `#correction` or `#korrektur` + image - Assignment correction with VLM

---

## Styling Approach

### CSS Framework

Tailwind CSS (Utility-First)

### Tailwind Integration

- Processed by Fresh framework
- Configured in `tailwind.config.ts`
- Scans `{routes,islands,components}/**/*.{ts,tsx}` for class names
- Three Tailwind directive files:
  - `@tailwind base;` - Browser resets
  - `@tailwind components;` - Component classes
  - `@tailwind utilities;` - Utility classes

### Global Styles

File: `static/styles.css`

```css
html, body {
  background-color: #f4eecf;  /* Soft beige background */
}
```

### Custom Animations

```css
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

animation: fade-in 1s ease-out;
```

### Design System Colors

- Primary: Gray (`text-gray-600`, `bg-gray-400`)
- Accent: Blue links (`text-blue-600`)
- Warning: Yellow alert (`bg-yellow-200/75`)
- Success: Green (for ready states)
- Disabled: Gray-100 with reduced opacity

### Responsive Design

- Mobile-first approach
- Breakpoints: `md:` (medium screens)
- Max-width containers: `max-w-screen-md`, `max-w-4xl`
- Flex layouts for centering and alignment
- Absolute positioning for floating buttons

### Interactive Elements

- `:hover:` state styling
- `:disabled:` state styling (opacity-50, cursor-not-allowed)
- `:focus:` state handling
- Smooth transitions

---

## Build and Development

### Development Workflow

```bash
# Install dependencies
deno cache --reload deno.json

# Run development server (with hot reload)
deno task start
# Watches: static/ and routes/ directories
# Starts: http://localhost:8000

# Code quality checks
deno task check
# - deno fmt --check (formatting)
# - deno lint (linting)
# - deno check **/*.ts (TypeScript)
# - deno check **/*.tsx (TSX)

# Build for production
deno task build
# Generates optimized bundle

# Run production build locally
deno task preview
# Runs: main.ts
```

### Entry Points

#### Development (`dev.ts`)

```typescript
#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";
import "$std/dotenv/load.ts";

await dev(import.meta.url, "./main.ts", config);
```

- Loads `.env` via dotenv
- Watches static and routes directories
- Hot-reloads on file changes
- Serves on http://localhost:8000

**Location:** `dev.ts`

#### Production (`main.ts`)

```typescript
/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";
import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";

await start(manifest, config);
```

- Loads environment variables
- Uses pre-generated route manifest
- Ready for deployment

**Location:** `main.ts`

### Docker Deployment

#### docker-compose.yml

```yaml
services:
  school-bud-e-frontend:
    image: denoland/deno:latest
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./app:/school-bud-e-frontend
    command: |
      apt-get update && apt-get install -y git &&
      cd /school-bud-e-frontend &&
      deno task build &&
      deno task preview

  caddy:
    image: caddy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile
```

**Location:** `docker-compose/docker-compose.yml`

#### Deployment Commands

```bash
cd docker-compose
cp .example.env .env
nano .env  # Configure API keys
docker-compose up
```

### Build Output

- Auto-generated: `fresh.gen.ts` (route manifest)
- Optimized bundle in `_fresh/` directory
- Static assets copied from `static/`

---

## Key Features

### 1. Chat Interface

- Real-time streaming responses from LLM
- Message history with editing capability
- Welcome message on load
- Language-aware conversations

**Location:** `islands/ChatIsland.tsx`

### 2. Voice Interaction

#### Speech-to-Text (STT)

- Browser native SpeechRecognition API (fallback)
- Groq API for accurate transcription (via upload)
- MediaRecorder API for audio capture
- Automatic language detection (defaults to German)

**Location:** `components/VoiceRecordButton.tsx`, `routes/api/stt.ts`

#### Text-to-Speech (TTS)

- Synthesize assistant responses as audio
- Multiple TTS providers supported
- Sequential audio playback for long responses
- Audio download functionality

**Location:** `islands/ChatIsland.tsx:getTTS()`, `routes/api/tts.ts`

### 3. Image Processing (Vision AI)

- Upload images for LLM analysis
- Vision Language Model (VLM) for image understanding
- Automatic VLM routing when images detected
- Base64 encoding for transmission
- Support for high detail analysis

**Location:** `components/ImageUploadButton.tsx`, `routes/api/chat.ts`

### 4. Assignment Correction

- Special `#correction` / `#korrektur` mode
- Uses dedicated VLM correction model
- Provides detailed, empathetic feedback
- Multi-page document support
- Extracts and transcribes handwritten text

**Location:** `routes/api/chat.ts`

### 5. Knowledge Augmentation

#### Wikipedia Search

Retrieve educational content from Wikipedia.

- Multi-language support (EN, DE)
- Configurable result limits
- Score-ranked results

**Command:** `#wikipedia[:language[:top_n]]: search_term`

**Location:** `routes/api/wikipedia.ts`, `islands/ChatIsland.tsx:fetchWikipedia()`

#### Academic Papers

Search ORKG database for research papers.

- DOI links to full papers
- Abstracts and author information
- Publication date filtering

**Command:** `#papers[:top_n]: search_term`

**Location:** `routes/api/papers.ts`, `islands/ChatIsland.tsx:fetchPapers()`

#### Curriculum Search

Query German Bildungsplan (education curriculum).

- Education-specific content
- Aligned with learning objectives
- Configurable result limits

**Command:** `#bildungsplan[:top_n]: search_term`

**Location:** `routes/api/bildungsplan.ts`, `islands/ChatIsland.tsx:fetchBildungsplan()`

### 6. Multi-Chat Support

- Save multiple independent chat sessions
- Suffix-based session identification
- Each session stored separately in localStorage
- Switch between chats seamlessly

**Location:** `islands/ChatIsland.tsx`

### 7. Settings & Configuration

- **Universal API Key Mode:** Single key for all services
- **Custom Configuration:** Override individual API endpoints
- **Provider Detection:** Auto-config for Groq, Google AI, HyprLab
- **Advanced Settings:** Custom system prompts, VLM configuration
- **Persistent Storage:** All settings saved to localStorage

**Location:** `components/Settings.tsx`

### 8. Accessibility Features

- Language selection (EN/DE)
- Terms & conditions agreement
- Auto-scroll toggle
- Read-aloud toggle (TTS control)
- Warning banner with feature documentation

**Location:** `islands/Menu.tsx`, `islands/ChatAgreement.tsx`, `components/Warning.tsx`

### 9. Multi-Modal Content

- Text messages
- Voice messages (STT → text)
- Image uploads
- Audio responses (TTS → audio)
- Mixed content in single messages

---

## Dependencies

### Major Dependencies

#### Framework & Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| Fresh | 2.1.2 | Deno web framework |
| Preact | 10.26.6 | Lightweight React alternative |
| @preact/signals | 2.0.4 | Reactive signals library |
| @preact/hooks | - | React-like hooks for Preact |
| Deno std | 0.216.0 | Standard library |

#### Styling

| Package | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | 4.1.7 | Utility-first CSS framework |

#### API & Data

| Package | Version | Purpose |
|---------|---------|---------|
| @microsoft/fetch-event-source | 2.0.1 | Server-Sent Events client |
| Buffer | npm module | Binary data handling |

#### Type Definitions

- Built-in: Web APIs (SpeechRecognition, MediaRecorder, FileReader)
- Custom: `types.d.ts` for project-specific interfaces

### External Services/APIs

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Groq API | https://api.groq.com | STT & LLM inference |
| ORKG | https://api.ask.orkg.org | Academic papers database |
| Wikipedia Search | http://37.27.128.150:9999 | Wikipedia retrieval |
| Bildungsplan | http://213.173.96.19:8020 | German curriculum |
| Various LLM APIs | Configurable | Chat & vision models |
| TTS Providers | Configurable | Audio synthesis |

### Development Dependencies

- Deno linter (built-in)
- Deno formatter (built-in)
- Deno type checker (built-in)

### No Heavy Dependencies

- No Redux/Zustand (uses local state)
- No UI component library (custom components)
- No build tools beyond Deno
- Minimal npm dependencies (Buffer only)

---

## Architecture Patterns

### Component Architecture

#### Islands Architecture (Fresh)

- `islands/` components are hydrated on client (interactive)
- Other components are static on server (SSR)
- Clear separation of interactive vs. static content

#### Component Hierarchy

```
_app (layout wrapper)
├── index.tsx (home page)
│   ├── Header (island - interactive)
│   └── ChatAgreementOrIsland (island - conditional)
│       ├── ChatAgreement (island) - if not agreed
│       └── ChatIsland (island) - if agreed
│           ├── ChatTemplate (component)
│           ├── VoiceRecordButton (component)
│           ├── ImageUploadButton (component)
│           ├── ChatSubmitButton (component)
│           ├── Settings (component)
│           └── Warning (component)
```

### Data Flow

#### 1. User Input

- Text → ChatSubmitButton.onClick
- Voice → VoiceRecordButton → /api/stt → ChatIsland
- Image → ImageUploadButton → ChatIsland
- Command → Parsed in ChatIsland

#### 2. Processing

- ChatIsland receives input
- Detects command keywords (#wikipedia, #papers, #bildungsplan)
- Fetches augmentation data if needed
- Sends to /api/chat with message history

#### 3. Response

- /api/chat returns Server-Sent Events stream
- ChatIsland buffers chunks
- ChatTemplate renders in real-time
- If readAlways enabled → /api/tts called
- Audio played by ChatTemplate

### State Patterns

#### Lifting State Up

- ChatIsland holds message state
- Passes to ChatTemplate as prop
- ChatTemplate is pure render component

#### localStorage Sync

- Settings auto-saved on change
- Message history persisted per session
- Agreement state checked on mount

### Error Handling

- Try-catch blocks in async operations
- User-friendly error messages
- Graceful fallbacks (e.g., SpeechRecognition → STT API)
- HTTP status checking on all fetch calls

---

## Security & Privacy

### Frontend Security

- No secrets stored in code
- API keys stored in localStorage (client-side)
- Environment variables for server secrets only
- CORS likely handled by backend
- CSP headers set by backend

### Privacy Features

- Local operation possible (custom API keys)
- No data collection beyond what's sent to configured APIs
- User can control which API keys to use
- Agreement/consent system in place
- Open-source codebase for transparency

### Data Handling

- Images converted to base64 (no multipart uploads for VLM)
- Audio files sent as FormData
- All data sent via HTTPS (in production)
- No intermediate logging/caching on frontend

---

## Internationalization

### Languages Supported

- German (de) - Default
- English (en)

### Localization Files

- `internalization/content.ts` - Main UI strings & system prompts
- `internalization/agreement-content.ts` - Terms of service

### Content Categories

1. **headerContent** - Logo text & titles
2. **menuContent** - Navigation labels
3. **warningContent** - Feature documentation
4. **chatIslandContent** - Chat UI labels & welcome message
5. **chatTemplateContent** - Message template labels
6. **chatContent** - System prompts & correction instructions
7. **aboutContent** - About page text
8. **agreementContent** - T&C text
9. **settingsContent** - Settings UI labels

### Language Selection

- URL parameter: `/?lang=de` or `/?lang=en`
- Menu dropdown for switching
- Stored in URL (not persisted)

---

## Deployment Options

### Local Development

```bash
git clone https://github.com/LAION-AI/school-bud-e-frontend.git
cd school-bud-e-frontend
cp .example.env .env
# Edit .env with API keys
deno task start
# Open http://localhost:8000
```

### Production Build

```bash
deno task build
deno task preview
# Runs on http://localhost:8000 (can be proxied)
```

### Docker Deployment

```bash
cd docker-compose
cp .example.env .env
# Edit .env
docker-compose up
# Reverse proxy via Caddy
# http://localhost (auto HTTPS)
```

### Deployment Platforms

- Any Deno-compatible platform (Deno Deploy, etc.)
- Docker-based hosting
- Traditional VPS with Deno runtime

---

## Project Metadata

### Repository Information

- **Repository:** https://github.com/LAION-AI/school-bud-e-frontend
- **License:** MIT
- **Organization:** LAION (Large-scale Artificial Intelligence Open Network)
- **Status:** Experimental prototype
- **Project Size:** ~40MB (with node_modules)
- **Source Code Size:** Estimated ~50KB (excludes dependencies)

### Collaborators/Organizations

- LAION (primary developer)
- ELLIS Institute Tübingen
- Collabora
- Tübingen AI Center
- German Research Center for Artificial Intelligence (DFKI)
- Intel

### Recent Activity

**Last commits:**

1. `16fe137` - Work in progress before switching to main
2. `78617d4` - Beschreibe hier kurz deine Änderung
3. `743b835` - Revert "Kurze, sinnvolle Commit-Nachricht"
4. `7ac44f4` - Kurze, sinnvolle Commit-Nachricht
5. `01ddf2d` - TTSregen playback fix

**Current Status:** On work-in-progress branch, main branch available

---

## Summary

**School Bud-E Frontend** is a modern, well-architected Deno-based web application that demonstrates best practices in:

1. **Modern Web Architecture:** Fresh framework with islands architecture for optimal performance
2. **Responsive Design:** Tailwind CSS for consistent, mobile-first styling
3. **Modularity:** Clear separation between routes, islands, and components
4. **Internationalization:** Support for multiple languages with centralized content management
5. **Multi-Modal AI Interaction:** Text, voice, and image inputs with LLM/VLM backends
6. **Knowledge Integration:** Real-time access to Wikipedia, academic papers, and curriculum content
7. **Accessibility:** Terms agreement, language selection, configurable UI features
8. **Scalability:** Support for multiple chat sessions, custom API endpoints, and provider flexibility
9. **Security:** No hardcoded secrets, user-configurable API keys, transparent open-source code
10. **Deployment Flexibility:** Docker support, environment configuration, local development workflow

The codebase is clean, well-organized, and documented with proper error handling and user feedback mechanisms throughout.

---

## Key File Paths Reference

### Routes
- `routes/index.tsx` - Home page
- `routes/about.tsx` - About page
- `routes/_app.tsx` - Layout wrapper
- `routes/_404.tsx` - Error page
- `routes/api/chat.ts` - Chat API (streaming)
- `routes/api/tts.ts` - Text-to-Speech
- `routes/api/stt.ts` - Speech-to-Text
- `routes/api/wikipedia.ts` - Wikipedia search
- `routes/api/papers.ts` - Papers search
- `routes/api/bildungsplan.ts` - Curriculum search

### Islands
- `islands/ChatIsland.tsx` - Main chat (1459 lines)
- `islands/ChatAgreement.tsx` - T&C modal
- `islands/ChatAgreementOrIsland.tsx` - Conditional router
- `islands/Header.tsx` - Header component
- `islands/Menu.tsx` - Navigation menu

### Components
- `components/ChatTemplate.tsx` - Message rendering
- `components/ChatSubmitButton.tsx` - Submit button
- `components/VoiceRecordButton.tsx` - Audio recording
- `components/ImageUploadButton.tsx` - Image uploader
- `components/Settings.tsx` - API configuration
- `components/Warning.tsx` - Feature disclaimer

### Localization
- `internalization/content.ts` - UI strings (EN/DE)
- `internalization/agreement-content.ts` - T&C content

### Static Assets
- `static/styles.css` - Global styles
- `static/logo.png` - App logo
- `static/lines.svg` - Background pattern
- `static/favicon.ico` - Browser icon
- `static/intro.mp3` - German intro audio
- `static/intro-en.mp3` - English intro audio

### Configuration
- `deno.json` - Deno config
- `fresh.config.ts` - Fresh config
- `fresh.gen.ts` - Auto-generated manifest
- `tailwind.config.ts` - Tailwind config
- `types.d.ts` - Type definitions
- `main.ts` - Production entry
- `dev.ts` - Development entry
- `.example.env` - Env template

### Documentation
- `.claude/docs/BUGS.md` - Bug tracking and known issues

---

## Bug Tracking & Known Issues

### Bug Documentation

All bugs, issues, and their solutions are tracked in a dedicated bug tracking document:

**Location:** `.claude/docs/BUGS.md`

This document maintains a comprehensive record of:
- Active bugs currently affecting the application
- Resolved bugs with their solutions
- Bug reporting guidelines and procedures
- Workarounds for known issues

### IMPORTANT: Bug Tracking Protocol

**When you encounter a bug during development or maintenance:**

1. **Document Immediately:** Add the bug to `.claude/docs/BUGS.md` as soon as you discover it
2. **Include Details:** Follow the bug entry format with all relevant information:
   - Clear title and description
   - Reproduction steps
   - Expected vs. actual behavior
   - Affected files and components
   - Environment details
3. **Document Workarounds:** Even temporary solutions should be documented
4. **Update Progress:** As you investigate, add findings to the bug entry's "Notes" section
5. **Document Solutions:** When fixing a bug, update the "Solution" section with detailed explanation
6. **Move to Resolved:** Once fixed, move the bug to the "Resolved Bugs" section with resolution date and related commits

### Current Known Issues

For the most up-to-date list of bugs, always refer to `.claude/docs/BUGS.md`.

**Active bugs as of 2025-10-22:**

1. **Client-Side Redirects Not Working** (Medium severity)
   - Fresh framework client-side navigation/redirects not functioning
   - Affects: Navigation between routes, programmatic redirects
   - Workaround: Use `window.location.href` for full page redirects or `<a>` tags
   - Status: Under investigation
   - See: `.claude/docs/BUGS.md` for full details

### Why Bug Documentation Matters

- **Knowledge Preservation:** Prevents rediscovering the same bugs
- **Solution Sharing:** Documents working fixes for future reference
- **Context Retention:** Maintains technical details and investigation notes
- **Team Coordination:** Everyone (including AI assistants) stays informed
- **Learning Resource:** Historical record of problems and solutions

### Bug Documentation Best Practices

- **Be Specific:** Include file paths, line numbers, and code snippets
- **Be Complete:** Document all relevant context and environment details
- **Be Timely:** Update the document as soon as issues are found or resolved
- **Be Detailed:** Future you (or others) will appreciate thorough documentation
- **Cross-Reference:** Link bug entries in commit messages and code comments

### Quick Reference

- View all bugs: `.claude/docs/BUGS.md`
- Bug entry template: See "Bug Reporting Guidelines" in BUGS.md
- Severity levels: Critical > High > Medium > Low

---

*Generated: 2025-10-22*
