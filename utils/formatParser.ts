import type { SupportedFormat, BaseFormat, GraphJson, WebResultJson, FlashcardsJson, GameJson, TestJson, PresentationJson } from '../types/formats.ts';

/**
 * Result of format extraction
 */
export interface FormatExtractionResult<T extends SupportedFormat = SupportedFormat> {
  success: boolean;
  format?: T;
  rawJson?: string;
  error?: string;
}

/**
 * Options for format extraction
 */
export interface FormatExtractionOptions {
  expectedType?: string;
  throwOnError?: boolean;
}

/**
 * Type guard for GraphJson
 */
export function isGraphJson(data: BaseFormat): data is GraphJson {
  return data.type === 'graph' && Array.isArray((data as GraphJson).items);
}

/**
 * Type guard for WebResultJson
 */
export function isWebResultJson(data: BaseFormat): data is WebResultJson {
  return data.type === 'webresult' && 'items' in data;
}

/**
 * Type guard for FlashcardsJson
 */
export function isFlashcardsJson(data: BaseFormat): data is FlashcardsJson {
  return data.type === 'flashcards' && Array.isArray((data as FlashcardsJson).cards);
}

/**
 * Type guard for GameJson
 */
export function isGameJson(data: BaseFormat): data is GameJson {
  return data.type === 'game' && 'description' in data;
}

/**
 * Type guard for TestJson
 */
export function isTestJson(data: BaseFormat): data is TestJson {
  return data.type === 'test' && Array.isArray((data as TestJson).questions);
}

/**
 * Type guard for PresentationJson
 */
export function isPresentationJson(data: BaseFormat): data is PresentationJson {
  return data.type === 'presentation' && Array.isArray((data as PresentationJson).slides);
}

/**
 * Extract formatted data from a string that contains markdown-style code blocks
 * 
 * @param text The text to extract formatted data from
 * @param options Options for extraction
 * @returns The extracted data or an error
 */
export function extractFormattedData<T extends SupportedFormat = SupportedFormat>(
  text: string,
  options: FormatExtractionOptions = {}
): FormatExtractionResult<T> {
  try {
    // Look for JSON code blocks in the text
    const jsonMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
    if (!jsonMatch || !jsonMatch[1]) {
      const error = 'No JSON code block found in the response';
      if (options.throwOnError) {
        throw new Error(error);
      }
      return { success: false, error };
    }
    
    const jsonStr = jsonMatch[1].trim();
    let parsedData: Record<string, unknown>;
    
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      const error = `Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`;
      if (options.throwOnError) {
        throw new Error(error);
      }
      return { success: false, error, rawJson: jsonStr };
    }
    
    // Check if the parsed data has a 'type' field
    if (!parsedData || typeof parsedData.type !== 'string') {
      const error = 'Extracted JSON does not contain a valid "type" field';
      if (options.throwOnError) {
        throw new Error(error);
      }
      return { success: false, error, rawJson: jsonStr };
    }
    
    // If an expected type is provided, validate against it
    if (options.expectedType && parsedData.type !== options.expectedType) {
      const error = `Expected format type "${options.expectedType}" but got "${parsedData.type}"`;
      if (options.throwOnError) {
        throw new Error(error);
      }
      return { success: false, error, rawJson: jsonStr };
    }
    
    // Return the parsed data as the requested type
    return { 
      success: true, 
      format: parsedData as T,
      rawJson: jsonStr
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (options.throwOnError) {
      throw error;
    }
    return { success: false, error: errorMessage };
  }
}

/**
 * Extract graph data from a string
 */
export function extractGraphData(
  text: string,
  options: FormatExtractionOptions = {}
): FormatExtractionResult<GraphJson> {
  const result = extractFormattedData<GraphJson>(
    text, 
    { ...options, expectedType: 'graph' }
  );
  
  if (result.success && result.format) {
    if (!isGraphJson(result.format)) {
      const error = 'Extracted data is not valid GraphJson format';
      if (options.throwOnError) {
        throw new Error(error);
      }
      return { success: false, error, rawJson: result.rawJson };
    }
  }
  
  return result;
}

/**
 * Extract web result data from a string
 */
export function extractWebResultData(
  text: string,
  options: FormatExtractionOptions = {}
): FormatExtractionResult<WebResultJson> {
  const result = extractFormattedData<WebResultJson>(
    text, 
    { ...options, expectedType: 'webresult' }
  );
  
  if (result.success && result.format) {
    if (!isWebResultJson(result.format)) {
      const error = 'Extracted data is not valid WebResultJson format';
      if (options.throwOnError) {
        throw new Error(error);
      }
      return { success: false, error, rawJson: result.rawJson };
    }
  }
  
  return result;
}

/**
 * Extract flashcards data from a string
 */
export function extractFlashcardsData(
  text: string,
  options: FormatExtractionOptions = {}
): FormatExtractionResult<FlashcardsJson> {
  const result = extractFormattedData<FlashcardsJson>(
    text, 
    { ...options, expectedType: 'flashcards' }
  );
  
  if (result.success && result.format) {
    if (!isFlashcardsJson(result.format)) {
      const error = 'Extracted data is not valid FlashcardsJson format';
      if (options.throwOnError) {
        throw new Error(error);
      }
      return { success: false, error, rawJson: result.rawJson };
    }
  }
  
  return result;
}

/**
 * Extract game data from a string
 */
export function extractGameData(
  text: string,
  options: FormatExtractionOptions = {}
): FormatExtractionResult<GameJson> {
  const result = extractFormattedData<GameJson>(
    text, 
    { ...options, expectedType: 'game' }
  );
  
  if (result.success && result.format) {
    if (!isGameJson(result.format)) {
      const error = 'Extracted data is not valid GameJson format';
      if (options.throwOnError) {
        throw new Error(error);
      }
      return { success: false, error, rawJson: result.rawJson };
    }
  }
  
  return result;
}

/**
 * Extract test data from a string
 */
export function extractTestData(
  text: string,
  options: FormatExtractionOptions = {}
): FormatExtractionResult<TestJson> {
  const result = extractFormattedData<TestJson>(
    text, 
    { ...options, expectedType: 'test' }
  );
  
  if (result.success && result.format) {
    if (!isTestJson(result.format)) {
      const error = 'Extracted data is not valid TestJson format';
      if (options.throwOnError) {
        throw new Error(error);
      }
      return { success: false, error, rawJson: result.rawJson };
    }
  }
  
  return result;
}

/**
 * Extract presentation data from a string
 */
export function extractPresentationData(
  text: string,
  options: FormatExtractionOptions = {}
): PresentationJson | null {
  try {
    // First try the standard extraction method
    const result = extractFormattedData<PresentationJson>(
      text, 
      { ...options, expectedType: 'presentation' }
    );
    
    if (result.success && result.format) {
      if (isPresentationJson(result.format)) {
        return result.format;
      }
    }
    
    // If standard extraction fails, try to find JSON directly in the text
    // This is useful for streaming responses where we might not have complete JSON with code blocks
    const jsonMatch = text.match(/\{[\s\S]*"type"\s*:\s*"presentation"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsedData = JSON.parse(jsonMatch[0]);
        if (isPresentationJson(parsedData)) {
          return parsedData;
        }
      } catch (e) {
        // If parsing fails, we'll return null below
        console.error("Failed to parse presentation JSON:", e);
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting presentation data:", error);
    return null;
  }
} 