# Streaming Text-to-Speech (TTS) Implementation

This document describes the new streaming TTS functionality that significantly improves performance for long texts.

## Overview

The streaming TTS system breaks long text into manageable chunks and generates audio incrementally, allowing playback to begin immediately as the first chunk is ready, rather than waiting for the entire audio file to be generated.

## Key Benefits

- **Reduced Latency**: Audio playback starts immediately for long texts
- **Better User Experience**: Users hear the beginning of long content while the rest is still being processed
- **Automatic Activation**: Automatically enabled for texts longer than 500 characters
- **Progressive Loading**: Audio chunks are queued and played seamlessly

## Technical Implementation

### Server-Side (`/api/tts-stream`)

- **Text Chunking**: Splits text into sentences/phrases (~250 characters each)
- **Parallel Processing**: Generates TTS for each chunk independently  
- **Server-Sent Events**: Streams audio data using SSE protocol
- **Multiple Providers**: Supports the same TTS providers as regular endpoint

### Client-Side

- **Audio Queue Management**: Manages seamless playback of audio chunks
- **Streaming State**: Tracks progress and provides real-time feedback
- **Automatic Fallback**: Falls back to regular TTS for short texts
- **Memory Management**: Properly cleans up audio resources

## Usage

### Web Client

The streaming TTS is automatically used for texts longer than 500 characters in the existing chat interface. No changes needed to existing code.

```typescript
import { getStreamingTTS } from "./components/chat/streaming-tts.ts";

// Streaming TTS (automatic for long texts)
await getStreamingTTS(longText, messageIndex, "source-function");

// Force streaming for any text
await getStreamingTTS(text, messageIndex, "source-function");
```

### Mobile Client

```typescript
import { apiService } from "./services/apiService";

// Use streaming TTS
for await (const { audioBlob, chunkInfo } of apiService.streamingTextToSpeech(text, 'en')) {
  // Play each audio chunk as it arrives
  playAudioBlob(audioBlob);
}
```

### API Endpoints

#### Regular TTS Endpoint: `/api/tts`
- Automatically redirects to streaming for texts > 500 characters
- Add `streaming: true` to force streaming for any text

#### Streaming TTS Endpoint: `/api/tts-stream`
- Returns Server-Sent Events with audio chunks
- Same request format as regular TTS endpoint

## Demo

Visit `/tts-demo` to see the streaming TTS in action with a side-by-side comparison.

## Event Format

The streaming endpoint sends these event types:

```json
// Chunk metadata
{
  "type": "metadata",
  "chunkIndex": 0,
  "totalChunks": 5,
  "text": "First chunk text...",
  "audioSize": 12345
}

// Audio data
{
  "type": "audio", 
  "chunkIndex": 0,
  "audioData": [/* Uint8Array as regular array */]
}

// Error handling
{
  "type": "error",
  "chunkIndex": 2,
  "message": "Failed to generate audio for this chunk"
}

// Completion signal
{
  "type": "complete",
  "totalChunks": 5
}
```

## Configuration

### Chunk Size
Default chunk size is 250 characters. Adjust in `routes/api/tts-stream.ts`:

```typescript
const chunks = splitTextIntoChunks(text, 250); // Adjust as needed
```

### Auto-Streaming Threshold
Default threshold is 500 characters. Adjust in `components/chat/speech.ts`:

```typescript
if (cleanedText.length > 500) { // Adjust threshold
  await getStreamingTTS(cleanedText, groupIndex, sourceFunction);
  return;
}
```

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support for Server-Sent Events
- **Mobile Browsers**: Supported with some audio playback limitations

## Performance Considerations

- **Memory Usage**: Audio chunks are cleaned up automatically
- **Network**: Uses Server-Sent Events for efficient streaming
- **CPU**: TTS generation is distributed across chunks
- **Storage**: No persistent audio caching for streaming (by design)

## Error Handling

- **Network Failures**: Graceful degradation with error events
- **TTS Failures**: Individual chunk failures don't stop the stream
- **Browser Compatibility**: Fallback to regular TTS if streaming fails

## Future Enhancements

- **Adaptive Chunking**: Dynamic chunk sizes based on content
- **Voice Consistency**: Ensure consistent voice across chunks
- **Caching**: Optional chunk-level caching for repeated content
- **Real-time Controls**: Pause/resume streaming mid-generation 