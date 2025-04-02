import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { 
  requestGraphFormat, 
  requestWebResultFormat, 
  requestFlashcardsFormat, 
  requestGameFormat, 
  createFormatPrompt,
  type AIFormatResult 
} from '../../utils/aiFormatClient.ts';
import type { GraphJson, WebResultJson, FlashcardsJson, GameJson, SupportedFormat } from '../../types/formats.ts';

/**
 * Example component demonstrating the use of the AI format utilities
 */
export function FormatExtractionExample() {
  const [query, setQuery] = useState<string>('');
  const [formatType, setFormatType] = useState<string>('graph');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseData, setResponseData] = useState<SupportedFormat | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setResponseData(null);
    
    try {
      const message = createFormatPrompt(query, formatType);
      
      let result: AIFormatResult<SupportedFormat>;
      switch (formatType) {
        case 'graph':
          result = await requestGraphFormat([message]);
          break;
        case 'webresult':
          result = await requestWebResultFormat([message]);
          break;
        case 'flashcards':
          result = await requestFlashcardsFormat([message]);
          break;
        case 'game':
          result = await requestGameFormat([message]);
          break;
        default:
          throw new Error(`Unsupported format type: ${formatType}`);
      }
      
      if (result.state === 'success' && result.format) {
        setResponseData(result.format);
      } else {
        setErrorMessage(result.error || 'Failed to extract formatted data');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderFormatSelector = () => (
    <div class="format-selector mb-4">
      <label htmlFor="format-type" class="block text-sm font-medium text-gray-700 mb-1">Format Type</label>
      <select 
        id="format-type"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        value={formatType}
        onChange={(e) => setFormatType((e.target as HTMLSelectElement).value)}
      >
        <option value="graph">Graph</option>
        <option value="webresult">Web Results</option>
        <option value="flashcards">Flashcards</option>
        <option value="game">Game</option>
      </select>
    </div>
  );
  
  const renderQueryInput = () => (
    <div class="query-input mb-4">
      <label htmlFor="query-input" class="block text-sm font-medium text-gray-700 mb-1">Query</label>
      <textarea
        id="query-input"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        value={query}
        onChange={(e) => setQuery((e.target as HTMLTextAreaElement).value)}
        rows={3}
        placeholder={`Enter your query for ${formatType} data...`}
      />
    </div>
  );
  
  const renderGraphData = (data: GraphJson) => (
    <div class="graph-data">
      <h3 class="text-lg font-medium text-gray-900 mb-2">Graph Data</h3>
      <p class="mb-2">{data.items.length} items found</p>
      <ul class="list-disc pl-5 mb-4">
        {data.items.map((item) => (
          <li key={`graph-item-${item.item}`} class="mb-1">
            <strong>{item.item}</strong>
            {item.connections && item.connections.length > 0 && (
              <span class="text-sm text-gray-500"> → Connected to: {item.connections.map(c => c.to).join(', ')}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
  
  const renderWebResultData = (data: WebResultJson) => (
    <div class="web-result-data">
      <h3 class="text-lg font-medium text-gray-900 mb-2">Web Results</h3>
      <div class="divide-y divide-gray-200">
        <div class="py-3">
          <a href={data.url} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
            <h4 class="font-medium">{data.title}</h4>
          </a>
          <p class="text-sm text-gray-600">{data.snippet}</p>
          <p class="text-xs text-gray-500">{data.url}</p>
        </div>
      </div>
    </div>
  );
  
  const renderFlashcardsData = (data: FlashcardsJson) => (
    <div class="flashcards-data">
      <h3 class="text-lg font-medium text-gray-900 mb-2">Flashcards</h3>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.cards.map((card) => (
          <div key={`flashcard-${card.id}`} class="border border-gray-200 rounded-md overflow-hidden">
            <div class="bg-gray-50 p-3 border-b border-gray-200">
              <h4 class="font-medium">Front</h4>
              <p>{card.front}</p>
            </div>
            <div class="p-3">
              <h4 class="font-medium">Back</h4>
              <p>{card.back}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderGameData = (data: GameJson) => (
    <div class="game-data">
      <h3 class="text-lg font-medium text-gray-900 mb-2">Game</h3>
      <div class="bg-gray-50 p-4 rounded-md mb-4">
        <h4 class="font-medium mb-1">Topic</h4>
        <p class="mb-3">{data.content.topic}</p>
        
        {data.content.explanation && (
          <>
            <h4 class="font-medium mb-1">Explanation</h4>
            <p class="mb-3">{data.content.explanation}</p>
          </>
        )}
        
        {data.content.code && (
          <>
            <h4 class="font-medium mb-1">Game Code</h4>
            <pre class="bg-gray-800 text-white p-3 rounded-md overflow-x-auto">
              <code>{data.content.code}</code>
            </pre>
          </>
        )}
      </div>
    </div>
  );
  
  const renderResponse = () => {
    if (isLoading) {
      return <div class="loading text-center py-8">Loading...</div>;
    }
    
    if (errorMessage) {
      return <div class="error text-red-600 py-4">{errorMessage}</div>;
    }
    
    if (!responseData) {
      return null;
    }
    
    switch (responseData.type) {
      case 'graph':
        return renderGraphData(responseData as GraphJson);
      case 'webresult':
        return renderWebResultData(responseData as WebResultJson);
      case 'flashcards':
        return renderFlashcardsData(responseData as FlashcardsJson);
      case 'game':
        return renderGameData(responseData as GameJson);
      default:
        return <pre>{JSON.stringify(responseData, null, 2)}</pre>;
    }
  };
  
  return (
    <div class="format-extraction-example max-w-3xl mx-auto p-4">
      <h2 class="text-xl font-bold text-gray-900 mb-4">AI Format Extraction Example</h2>
      
      <form onSubmit={handleSubmit} class="mb-6">
        {renderFormatSelector()}
        {renderQueryInput()}
        
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          class="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : `Generate ${formatType} data`}
        </button>
      </form>
      
      <div class="response-container border-t border-gray-200 pt-4">
        {renderResponse()}
      </div>
    </div>
  );
} 