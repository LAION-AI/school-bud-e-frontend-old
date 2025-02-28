# AI Format Utilities

This module provides utilities for extracting and handling formatted data from AI responses in the School-Bud-E application.

## Overview

The AI format utilities consist of two main components:

1. **Format Parser** (`utils/formatParser.ts`) - Extracts and validates structured data from AI responses
2. **AI Format Client** (`utils/aiFormatClient.ts`) - Makes API calls to the chat endpoint and processes responses

These utilities make it easy to request specific format types from the AI and handle the responses in a structured way.

## Supported Formats

The following format types are supported:

- **Graph** - For representing connected concepts and relationships
- **Web Results** - For search results with URLs, titles, and snippets
- **Flashcards** - For question/answer pairs
- **Game** - For educational game content

## Usage

### Basic Usage

```typescript
import { requestGraphFormat, createFormatPrompt } from './utils/aiFormatClient.ts';

// Create a message requesting graph data
const message = createFormatPrompt("Show me a graph of solar system planets", "graph");

// Make the request
const result = await requestGraphFormat([message]);

// Check if the request was successful
if (result.state === 'success' && result.format) {
  // Use the structured graph data
  const graphData = result.format;
  console.log(`Got ${graphData.items.length} graph items`);
} else {
  // Handle error
  console.error(`Error: ${result.error}`);
}
```

### Format-Specific Functions

The module provides format-specific helper functions:

- `requestGraphFormat()` - Request graph data
- `requestWebResultFormat()` - Request web search results
- `requestFlashcardsFormat()` - Request flashcards
- `requestGameFormat()` - Request game content

### Direct Format Extraction

If you already have text containing formatted data, you can extract it directly:

```typescript
import { extractFormattedData } from './utils/formatParser.ts';

const aiResponse = "Here's your data:\n\n```json\n{\"type\":\"graph\",\"items\":[...]}\n```";

const result = extractFormattedData(aiResponse);
if (result.success && result.format) {
  // Use the extracted data
  console.log(result.format);
}
```

### Format-Specific Extraction

Format-specific extraction functions are also available:

- `extractGraphData()` - Extract graph data
- `extractWebResultData()` - Extract web result data
- `extractFlashcardsData()` - Extract flashcards data
- `extractGameData()` - Extract game data

## Example Component

An example component is provided in `components/examples/FormatExtractionExample.tsx`. This component demonstrates how to:

1. Request different format types from the AI
2. Handle the responses
3. Display the structured data in a user-friendly way

You can integrate this component in your application to test the AI format functionality.

## Error Handling

The utilities provide robust error handling:

- Validation of format types
- Extraction of JSON from text
- Parsing of JSON data
- Handling of API errors

Each utility function returns a structured result object that includes success/failure status and error information.

## Configuration

You can configure the format requests with various options:

```typescript
const options = {
  lang: 'en',                    // Language for the request
  throwOnError: true,            // Whether to throw errors
  showLoadingState: true,        // Whether to show loading state
  universalApiKey: 'your-key',   // API key for the service
  systemPrompt: 'custom prompt', // Custom system prompt
};

const result = await requestGraphFormat([message], options);
```

## Format Structures

The format types are defined in `types/formats.ts` and include:

- **GraphJson** - Items with connections between them
- **WebResultJson** - URL, title, and snippet for web results
- **FlashcardsJson** - Cards with front and back content
- **GameJson** - Game topic, description, explanation, and code

Each format type extends the `BaseFormat` interface, which includes a `type` field. 