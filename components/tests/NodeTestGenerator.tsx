import { useSignal } from "@preact/signals";
import { useEffect, useState } from "preact/hooks";
import { 
  createTestForNode, 
  getTestForNode, 
  hasTestForNode, 
  setSelectedTest,
  updateTest,
  Test,
  TestQuestion
} from "./store.ts";
import { addMessage, messages } from "../../components/chat/store.ts";
import { startStream } from "../../components/chat/stream.ts";
import { extractTestData } from "../../utils/formatParser.ts";
import { formatTemplates } from "../../types/formats.ts";

interface NodeTestGeneratorProps {
  nodeId: string;
  nodeName: string;
  onClose: () => void;
}

export default function NodeTestGenerator({ nodeId, nodeName, onClose }: NodeTestGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [existingTest, setExistingTest] = useState<Test | null>(null);
  const [showTestPreview, setShowTestPreview] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<TestQuestion[]>([]);
  const difficulty = useSignal<"beginner" | "intermediate" | "advanced">("intermediate");
  const questionCount = useSignal(5);
  const includeMultipleChoice = useSignal(true);
  const includeTrueFalse = useSignal(true);
  const includeShortAnswer = useSignal(true);

  // Check if a test already exists for this node
  useEffect(() => {
    const test = getTestForNode(nodeId);
    if (test) {
      setExistingTest(test);
      if (test.questions && test.questions.length > 0) {
        setGeneratedQuestions(test.questions);
      }
    }
  }, [nodeId]);

  // Set up listener for new assistant messages
  useEffect(() => {
    // This effect will run when messages change
    // We'll check the last assistant message for JSON test data
    const messagesValue = messages.value;
    if (messagesValue.length > 0) {
      const lastMessage = messagesValue[messagesValue.length - 1];
      if (lastMessage.role === 'assistant' && isGenerating) {
        // Try to extract test data from the message
        const content = typeof lastMessage.content === 'string' 
          ? lastMessage.content 
          : Array.isArray(lastMessage.content) 
            ? lastMessage.content.join('') 
            : '';

        const extractedData = extractTestData(content);
        if (extractedData.success && extractedData.format) {
          // We have successfully extracted test data
          const testData = extractedData.format;
          
          // Map the questions to our TestQuestion format
          const questions: TestQuestion[] = testData.questions.map(q => ({
            id: q.id || `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: q.type as "multiple_choice" | "true_false" | "short_answer",
            question: q.question,
            options: q.options,
            correctAnswer: Array.isArray(q.correctAnswer) && q.type === "multiple_choice" 
              ? q.correctAnswer 
              : q.correctAnswer
          }));
          
          console.log(questions);
          setGeneratedQuestions(questions);
          
          // If we have an existing test, update it
          if (existingTest) {
            const updatedTest = {
              ...existingTest,
              content: testData.content || existingTest.content,
              name: testData.name || existingTest.name,
              questions: questions,
              lastUpdatedAt: Date.now()
            };
            updateTest(updatedTest);
            setExistingTest(updatedTest);
          } else {
            // Create a new test with the generated questions
            const newTest = createTestForNode(nodeId, nodeName);
            const updatedTest = {
              ...newTest,
              content: testData.content || `Test for ${nodeName}`,
              name: testData.name || newTest.name,
              questions: questions,
              lastUpdatedAt: Date.now()
            };
            updateTest(updatedTest);
            setExistingTest(updatedTest);
          }
          
          setIsGenerating(false);
          setShowTestPreview(true);
        }
      }
    }
  }, [messages.value, isGenerating, existingTest]);

  const handleViewExistingTest = () => {
    if (existingTest) {
      setSelectedTest(existingTest.id);
      window.location.href = `/tests/view/${existingTest.id}`;
    }
  };

  const handleGenerateTest = async () => {
    setIsGenerating(true);
    
    try {
      // Create a new test for the node if it doesn't exist
      let testToUse = existingTest;
      if (!testToUse) {
        testToUse = createTestForNode(nodeId, nodeName);
        setExistingTest(testToUse);
      }
      
      // Prepare prompt for test generation
      const questionTypes = [];
      if (includeMultipleChoice.value) questionTypes.push("multiple_choice");
      if (includeTrueFalse.value) questionTypes.push("true_false");
      if (includeShortAnswer.value) questionTypes.push("short_answer");
      
      // Get the test template for JSON structure guidance
      const testTemplate = formatTemplates.test.template;
      
      const prompt = `Generate a ${difficulty.value} level test about "${nodeName}".
Include ${questionCount.value} questions with a mix of ${questionTypes.join(", ")} questions.
For each question, provide the correct answer.

The output MUST be a JSON object following this structure:
${testTemplate}

Make sure to:
1. Set a descriptive name for the test
2. Include an introduction/instructions in the content field
3. Generate exactly ${questionCount.value} questions
4. Assign a unique ID to each question
5. Correctly specify the question type (${questionTypes.join(", ")})
6. Include options array for multiple choice questions
7. Provide the correct answer for each question

DO NOT include any explanations or text outside the JSON structure.
The output should be ONLY the JSON object in the specified format.`;

      // Use the chat stream functionality to generate the test
      addMessage({ role: "user", content: prompt });
      
      // Wait for the response and handle it (in the useEffect hook above)
      await startStream(prompt);
      
    } catch (error) {
      console.error("Error generating test:", error);
      setIsGenerating(false);
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-800">Generate Test for Node: {nodeName}</h2>
        <button
          onClick={onClose}
          class="text-gray-500 hover:text-gray-800"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {existingTest ? (
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div class="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <span class="font-medium text-blue-800">A test already exists for this node</span>
          </div>
          <p class="text-blue-700 text-sm mb-3">
            You can either view the existing test or generate a new one with different parameters.
          </p>
          <div class="flex flex-wrap gap-3 justify-end">
            <button 
              onClick={handleViewExistingTest}
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Existing Test ({existingTest.questions.length} Questions)
            </button>
          </div>
        </div>
      ) : null}

      {showTestPreview && generatedQuestions.length > 0 && (
        <div class="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div class="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span class="font-medium text-green-800">Test Generated Successfully!</span>
          </div>
          <p class="text-green-700 text-sm mb-3">
            Generated {generatedQuestions.length} questions for this test.
          </p>
          <div class="flex justify-end">
            <button 
              onClick={handleViewExistingTest}
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              View Test
            </button>
          </div>
        </div>
      )}

      <div class="space-y-4">
        {isGenerating && (
          <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 animate-pulse">
            <div class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="font-medium text-blue-800">Generating your test...</span>
            </div>
            <p class="text-blue-700 text-sm mt-2">
              This may take a few moments as we're crafting {questionCount.value} questions at {difficulty.value} level.
            </p>
          </div>
        )}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
          <select
            value={difficulty.value}
            onChange={(e) => difficulty.value = (e.target as HTMLSelectElement).value as any}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
          <input
            type="number"
            min="1"
            max="20"
            value={questionCount.value}
            onInput={(e) => questionCount.value = parseInt((e.target as HTMLInputElement).value) || 5}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Question Types</label>
          <div class="space-y-2">
            <label class="inline-flex items-center">
              <input
                type="checkbox"
                checked={includeMultipleChoice.value}
                onChange={() => includeMultipleChoice.value = !includeMultipleChoice.value}
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span class="ml-2">Multiple Choice</span>
            </label>
            <br />
            <label class="inline-flex items-center">
              <input
                type="checkbox"
                checked={includeTrueFalse.value}
                onChange={() => includeTrueFalse.value = !includeTrueFalse.value}
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span class="ml-2">True/False</span>
            </label>
            <br />
            <label class="inline-flex items-center">
              <input
                type="checkbox"
                checked={includeShortAnswer.value}
                onChange={() => includeShortAnswer.value = !includeShortAnswer.value}
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span class="ml-2">Short Answer</span>
            </label>
          </div>
        </div>

        <div class="pt-2">
          <button
            onClick={handleGenerateTest}
            disabled={isGenerating}
            class={`w-full px-4 py-2 text-white rounded-md transition-colors ${
              isGenerating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isGenerating ? 'Generating Test...' : 'Generate New Test'}
          </button>
        </div>
      </div>
    </div>
  );
} 