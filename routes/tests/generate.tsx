import { PageProps } from "$fresh/server.ts";
import FloatingChat from "../../components/chat/FloatingChat.tsx";
import { useSignal } from "@preact/signals";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { addMessage } from "../../components/chat/store.ts";
import { startStream } from "../../components/chat/stream.ts";

export default function GenerateTestsPage(props: PageProps) {
  const subjectArea = useSignal("");
  const topics = useSignal("");
  const difficulty = useSignal("intermediate");
  const questionCount = useSignal(10);
  const isGenerating = useSignal(false);
  const generatedTest = useSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!IS_BROWSER) return;
    
    isGenerating.value = true;
    
    // Create a well-formatted prompt for test generation
    const prompt = `Please generate a ${difficulty.value} level test about ${subjectArea.value} 
    focusing on the following topics: ${topics.value}. 
    Include ${questionCount.value} questions with a mix of multiple choice, true/false, and short answer questions. 
    For each question, provide the correct answer. Format the output neatly with clear question numbering and sections.`;
    
    try {
      // Use the chat stream functionality to generate the test
      addMessage({ role: "user", content: prompt });
      await startStream(prompt, undefined, []);
      
      // The response will be shown in the chat interface
    } catch (error) {
      console.error("Error generating test:", error);
    } finally {
      isGenerating.value = false;
    }
  };

  return (
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="p-6 bg-gradient-to-r from-blue-500 to-indigo-600">
          <h1 class="text-3xl font-bold text-white">Generate Tests</h1>
          <p class="text-blue-100 mt-2">Create custom tests with AI assistance</p>
        </div>
        
        <div class="p-6 space-y-6">
          <div class="bg-gray-50 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Test Parameters</h2>
            <form class="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="subject-area" class="block text-sm font-medium text-gray-700 mb-1">
                  Subject Area
                </label>
                <input
                  id="subject-area"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Mathematics, History, Science"
                  value={subjectArea.value}
                  onInput={(e) => subjectArea.value = (e.target as HTMLInputElement).value}
                  required
                />
              </div>
              <div>
                <label htmlFor="topics" class="block text-sm font-medium text-gray-700 mb-1">
                  Topics
                </label>
                <textarea
                  id="topics"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter specific topics to cover"
                  value={topics.value}
                  onInput={(e) => topics.value = (e.target as HTMLTextAreaElement).value}
                  required
                />
              </div>
              <div>
                <label htmlFor="difficulty" class="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  id="difficulty"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={difficulty.value}
                  onChange={(e) => difficulty.value = (e.target as HTMLSelectElement).value}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label htmlFor="question-count" class="block text-sm font-medium text-gray-700 mb-1">
                  Number of Questions
                </label>
                <input
                  id="question-count"
                  type="number"
                  min="1"
                  max="50"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter number of questions"
                  value={questionCount.value}
                  onInput={(e) => questionCount.value = parseInt((e.target as HTMLInputElement).value) || 10}
                />
              </div>
              <button
                type="submit"
                class={`mt-6 w-full px-4 py-2 rounded-md text-white transition-colors ${
                  isGenerating.value 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
                disabled={isGenerating.value}
              >
                {isGenerating.value ? 'Generating...' : 'Generate Test'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <FloatingChat />
    </div>
  );
}
