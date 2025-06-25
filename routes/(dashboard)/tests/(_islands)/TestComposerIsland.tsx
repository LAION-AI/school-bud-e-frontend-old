import { useEffect, useRef, useState } from "preact/hooks";
import {
  IconArrowLeft,
  IconImageInPicture,
  IconMessageCircle,
  IconPhoto,
  IconPlus,
  IconTrash,
} from "@tabler/icons-preact";
import type { VNode } from "preact";
import type { Test, TestQuestion } from "../../../components/tests/store.ts";
import * as testStore from "../../../../components/tests/store.ts";
import * as graphStore from "../../../../components/graph/store.ts";
import ChatHistory from "../../../../components/chat/ChatHistory.tsx";
import { addMessage } from "../../../../components/chat/store.ts";
import { startStream } from "../../../../components/chat/stream.ts";
import { Button } from "../../../../components/Button.tsx";

interface TestComposerIslandProps {
  testId?: string; // Optional for new tests
  nodeId?: string; // Optional for tests not associated with a node
}

// Generate a unique ID for new questions
function generateId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default function TestComposerIsland(
  { testId, nodeId }: TestComposerIslandProps,
) {
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nodes, setNodes] = useState<Record<string, string>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(
    nodeId,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Image handling
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string | string[] }>
  >([]);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load test if editing
    if (testId) {
      const foundTest = testStore.tests.value.find((t) => t.id === testId) ||
        null;

      if (foundTest) {
        setTest({
          ...foundTest,
          // Ensure each question has an imageUrl property
          questions: foundTest.questions.map((q) => ({
            ...q,
            imageUrl: q.imageUrl || "",
          })),
        });
        setSelectedNodeId(foundTest.nodeId);
      } else {
        setErrorMessage("Test not found");
      }
    } else {
      // Create a new test
      setTest({
        id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: "",
        nodeId: selectedNodeId,
        content: "",
        questions: [],
        createdAt: Date.now(),
        lastUpdatedAt: Date.now(),
      });
    }

    // Load graph nodes for the dropdown
    if (graphStore.graphData.value?.items) {
      const nodeMap: Record<string, string> = {};
      for (const node of graphStore.graphData.value.items) {
        // The graph items have an 'item' property that contains the node name/id
        if (node.item) {
          nodeMap[node.item] = node.item; // Use the item name as both key and display value
        }
      }
      setNodes(nodeMap);
    }

    setLoading(false);
  }, [testId, selectedNodeId]);

  const handleNameChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (test) {
      setTest({
        ...test,
        name: target.value,
      });
    }
  };

  const handleContentChange = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    if (test) {
      setTest({
        ...test,
        content: target.value,
      });
    }
  };

  const handleNodeChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    if (test) {
      setTest({
        ...test,
        nodeId: target.value,
      });
      setSelectedNodeId(target.value);
    }
  };

  const addQuestion = () => {
    if (!test) return;

    const newQuestion: TestQuestion = {
      id: generateId(),
      type: "multiple_choice",
      question: "",
      options: ["", ""],
      correctAnswer: 0,
      imageUrl: "",
    };

    setTest({
      ...test,
      questions: [...test.questions, newQuestion],
    });
  };

  const removeQuestion = (index: number) => {
    if (!test) return;

    const updatedQuestions = [...test.questions];
    updatedQuestions.splice(index, 1);

    setTest({
      ...test,
      questions: updatedQuestions,
    });
  };

  const handleQuestionChange = (
    index: number,
    field: string,
    value: string | string[] | number,
  ) => {
    if (!test) return;

    const updatedQuestions = [...test.questions];

    if (field === "type") {
      // Handle type changes and set appropriate default values for correctAnswer
      const newType = value as
        | "multiple_choice"
        | "true_false"
        | "short_answer";

      if (newType === "multiple_choice") {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          type: newType,
          options: updatedQuestions[index].options || ["", ""],
          correctAnswer: 0,
        };
      } else if (newType === "true_false") {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          type: newType,
          options: undefined,
          correctAnswer: "true",
        };
      } else if (newType === "short_answer") {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          type: newType,
          options: undefined,
          correctAnswer: "",
        };
      }
    } else {
      // For other fields, just update the value
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        [field]: value,
      };
    }

    setTest({
      ...test,
      questions: updatedQuestions,
    });
  };

  const addOption = (questionIndex: number) => {
    if (!test) return;

    const updatedQuestions = [...test.questions];
    const question = updatedQuestions[questionIndex];

    if (question.type === "multiple_choice" && question.options) {
      updatedQuestions[questionIndex] = {
        ...question,
        options: [...question.options, ""],
      };

      setTest({
        ...test,
        questions: updatedQuestions,
      });
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (!test) return;

    const updatedQuestions = [...test.questions];
    const question = updatedQuestions[questionIndex];

    if (
      question.type === "multiple_choice" && question.options &&
      question.options.length > 2
    ) {
      const newOptions = [...question.options];
      newOptions.splice(optionIndex, 1);

      // Update correctAnswer if needed
      let correctAnswer = question.correctAnswer;
      if (typeof correctAnswer === "number") {
        if (correctAnswer === optionIndex) {
          correctAnswer = 0; // Reset to first option if the correct one was removed
        } else if (correctAnswer > optionIndex) {
          correctAnswer = correctAnswer - 1; // Adjust index if a previous option was removed
        }
      }

      updatedQuestions[questionIndex] = {
        ...question,
        options: newOptions,
        correctAnswer,
      };

      setTest({
        ...test,
        questions: updatedQuestions,
      });
    }
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    if (!test) return;

    const updatedQuestions = [...test.questions];
    const question = updatedQuestions[questionIndex];

    if (question.type === "multiple_choice" && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;

      updatedQuestions[questionIndex] = {
        ...question,
        options: newOptions,
      };

      setTest({
        ...test,
        questions: updatedQuestions,
      });
    }
  };

  const handleCorrectAnswerChange = (
    questionIndex: number,
    value: string | number,
  ) => {
    if (!test) return;

    const updatedQuestions = [...test.questions];
    const question = updatedQuestions[questionIndex];

    // Convert to number for multiple choice
    if (question.type === "multiple_choice" && typeof value === "string") {
      value = Number.parseInt(value, 10);
    }

    updatedQuestions[questionIndex] = {
      ...question,
      correctAnswer: value,
    };

    setTest({
      ...test,
      questions: updatedQuestions,
    });
  };

  const handleImageUpload = (questionIndex: number, e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.files || !target.files[0] || !test) return;

    const file = target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target || typeof event.target.result !== "string") return;

      const updatedQuestions = [...test.questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        imageUrl: event.target.result,
      };

      setTest({
        ...test,
        questions: updatedQuestions,
      });
    };

    reader.readAsDataURL(file);
  };

  const removeImage = (questionIndex: number) => {
    if (!test) return;

    const updatedQuestions = [...test.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      imageUrl: "",
    };

    setTest({
      ...test,
      questions: updatedQuestions,
    });

    // Reset the file input
    if (fileInputRefs.current[`question-${questionIndex}`]) {
      (fileInputRefs.current[`question-${questionIndex}`] as HTMLInputElement)
        .value = "";
    }
  };

  const triggerImageUpload = (questionIndex: number) => {
    if (fileInputRefs.current[`question-${questionIndex}`]) {
      fileInputRefs.current[`question-${questionIndex}`]?.click();
    }
  };

  const saveTest = () => {
    if (!test) return;

    // Validation
    if (!test.name.trim()) {
      setErrorMessage("Test name is required");
      return;
    }

    if (test.questions.length === 0) {
      setErrorMessage("At least one question is required");
      return;
    }

    // Validate each question
    for (let i = 0; i < test.questions.length; i++) {
      const q = test.questions[i];

      if (!q.question.trim()) {
        setErrorMessage(`Question ${i + 1} text is required`);
        return;
      }

      if (q.type === "multiple_choice") {
        if (!q.options || q.options.length < 2) {
          setErrorMessage(`Question ${i + 1} must have at least 2 options`);
          return;
        }

        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].trim()) {
            setErrorMessage(
              `Option ${j + 1} for Question ${i + 1} cannot be empty`,
            );
            return;
          }
        }
      } else if (q.type === "short_answer") {
        if (typeof q.correctAnswer !== "string" || !q.correctAnswer.trim()) {
          setErrorMessage(`Question ${i + 1} must have an answer`);
          return;
        }
      }
    }

    setSaving(true);

    try {
      const updatedTest = {
        ...test,
        lastUpdatedAt: Date.now(),
      };

      if (testId) {
        // Update existing test
        testStore.updateTest(updatedTest);
        setSuccessMessage("Test updated successfully");
      } else {
        // Add new test
        testStore.addTest(updatedTest);
        setSuccessMessage("Test created successfully");
      }

      // Clear error message if there was one
      setErrorMessage(null);

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/tests";
      }, 1500);
    } catch (error) {
      console.error("Error saving test:", error);
      setErrorMessage("Failed to save test. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Chat functions
  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  // Process AI response to extract test questions
  const processAIResponse = (response: string) => {
    try {
      // Look for JSON content in the response
      const jsonMatches = response.match(/```json\n([\s\S]*?)\n```/g);

      if (!jsonMatches) return;

      // Process each JSON block found
      for (const match of jsonMatches) {
        const jsonContent = match.replace(/```json\n/, "").replace(/\n```/, "");
        const parsedData = JSON.parse(jsonContent);

        // Check if it's a test question
        if (
          parsedData.type === "test" && parsedData.questions &&
          parsedData.questions.length > 0
        ) {
          // Found a complete test
          const newQuestions = parsedData.questions.map((q: {
            id?: string;
            type: string;
            question: string;
            options?: string[];
            correctAnswer: string | number;
            imageUrl?: string;
          }) => ({
            id: q.id || generateId(),
            type: q.type,
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            imageUrl: q.imageUrl || undefined,
          }));

          // Ask user if they want to add all questions
          if (
            confirm(
              `Add ${newQuestions.length} questions from the AI response to your test?`,
            )
          ) {
            setTest((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                questions: [...prev.questions, ...newQuestions],
              };
            });
            setSuccessMessage(
              `Added ${newQuestions.length} questions to your test!`,
            );
            setTimeout(() => setSuccessMessage(null), 3000);
          }
        } else if (parsedData.id && parsedData.type && parsedData.question) {
          // Found a single question
          const newQuestion = {
            id: parsedData.id || generateId(),
            type: parsedData.type,
            question: parsedData.question,
            options: parsedData.options || [],
            correctAnswer: parsedData.correctAnswer,
            imageUrl: parsedData.imageUrl || undefined,
          };

          // Ask user if they want to add this question
          if (
            confirm(
              `Add the following question to your test?\n\n${parsedData.question}`,
            )
          ) {
            setTest((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                questions: [...prev.questions, newQuestion],
              };
            });
            setSuccessMessage("New question added to your test!");
            setTimeout(() => setSuccessMessage(null), 3000);
          }
        }
      }
    } catch (error) {
      console.error("Error processing AI response:", error);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInputRef.current?.value.trim() || isProcessingChat) return;

    const userMessage = chatInputRef.current.value.trim();
    chatInputRef.current.value = "";

    // Add user message to local chat state
    const newUserMessage = { role: "user" as const, content: userMessage };
    setChatMessages((prev) => [...prev, newUserMessage]);

    // Also update global chat via store for consistency
    addMessage(newUserMessage);

    setIsProcessingChat(true);

    try {
      // Create context about the current test
      let testContext = "I'm creating a new test.";
      if (test) {
        testContext =
          `I'm currently working on a test titled "${test.name}" with ${test.questions.length} questions.`;
      }

      // Add instruction to format responses as JSON
      const enhancedPrompt = `${testContext} ${userMessage}
      
If you're generating test questions, please format them as JSON using this structure:
\`\`\`json
{
  "type": "test",
  "name": "Test Name",
  "content": "Test description",
  "questions": [
    {
      "id": "unique_id",
      "type": "multiple_choice|true_false|short_answer",
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Correct answer or index"
    }
  ]
}
\`\`\`
Or for a single question:
\`\`\`json
{
  "id": "unique_id",
  "type": "multiple_choice|true_false|short_answer",
  "question": "Question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "Correct answer or index"
}
\`\`\``;

      // Start the chat stream with context
      await startStream(enhancedPrompt, undefined, []);

      // Update local chat state with the latest messages
      // This assumes the global store has been updated by startStream
      const chatKey = "bude-chat-0";
      const storedChat = localStorage.getItem(chatKey);
      if (storedChat) {
        const latestMessages = JSON.parse(storedChat);
        setChatMessages(latestMessages);

        // Process the latest assistant message to extract test questions
        const lastMessage = latestMessages[latestMessages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          const content = Array.isArray(lastMessage.content)
            ? lastMessage.content.join("\n")
            : lastMessage.content;
          processAIResponse(content);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [...prev, {
        role: "assistant" as const,
        content: "Sorry, I encountered an error. Please try again.",
      }]);
    } finally {
      setIsProcessingChat(false);
      // Focus the input field again after sending the message
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 0);
    }
  };

  // Function to generate questions with AI
  const generateQuestionsWithAI = async () => {
    if (!test || !test.name) {
      setErrorMessage("Please enter a test name before generating questions");
      return;
    }

    setIsGeneratingQuestions(true);
    setErrorMessage(null);

    try {
      // Create a prompt based on the test information
      let prompt = `Generate ${
        test.questions.length > 0 ? "additional" : "new"
      } test questions for a test titled "${test.name}"`;

      if (test.content) {
        prompt += ` with the following description: "${test.content}"`;
      }

      if (test.nodeId && nodes[test.nodeId]) {
        prompt += `. The test is about the topic: "${nodes[test.nodeId]}"`;
      }

      prompt +=
        `. Please create 3 varied questions with a mix of multiple choice, true/false, and short answer types.`;

      if (test.questions.length > 0) {
        prompt +=
          ` I already have ${test.questions.length} questions, so please make these different.`;
      }

      prompt += `
Format your response as a JSON object with the following structure:
\`\`\`json
{
  "type": "test",
  "name": "${test.name}",
  "content": "${test.content || "Test description"}",
  "questions": [
    {
      "id": "unique_id",
      "type": "multiple_choice|true_false|short_answer",
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Correct answer or index"
    }
  ]
}
\`\`\``;

      // Add user message to chat
      addMessage({ role: "user", content: prompt });

      // Open the chat panel to show progress
      setIsChatOpen(true);

      // Start the stream with the prompt
      await startStream(prompt, undefined, []);

      // Update local chat state with the latest messages
      const chatKey = "bude-chat-0";
      const storedChat = localStorage.getItem(chatKey);
      if (storedChat) {
        const latestMessages = JSON.parse(storedChat);
        setChatMessages(latestMessages);

        // Process the latest assistant message to extract test questions
        const lastMessage = latestMessages[latestMessages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          const content = Array.isArray(lastMessage.content)
            ? lastMessage.content.join("\n")
            : lastMessage.content;
          processAIResponse(content);
        }
      }

      setSuccessMessage(
        "AI has generated questions! Review them in the chat and add them to your test.",
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error generating questions:", error);
      setErrorMessage("❌ Failed to generate questions. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  if (loading) {
    return <div class="container mx-auto px-6 py-10">Loading...</div>;
  }

  if (!test) {
    return (
      <div class="container mx-auto px-6 py-10">Failed to load test data</div>
    );
  }

  return (
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <div class="mb-8">
        <a
          href="/tests"
          class="inline-flex items-center text-primary-600 hover:text-primary-800"
        >
          <IconArrowLeft class="w-5 h-5 mr-2" />
          Back to Tests
        </a>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 class="text-3xl font-bold mb-6">
          {testId ? "Edit Test" : "Create New Test"}
        </h1>

        {errorMessage && (
          <div
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
            role="alert"
          >
            <span class="font-bold">Error:</span> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
            role="alert"
          >
            <span class="font-bold">Success:</span> {successMessage}
          </div>
        )}

        <div class="space-y-6">
          {/* Test Basic Information */}
          <div class="space-y-4">
            <div class="mb-4">
              <label
                htmlFor="test-name"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Test Name
              </label>
              <input
                id="test-name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter test name"
                value={test.name}
                onInput={handleNameChange}
                required
              />
            </div>

            <div>
              <label
                htmlFor="test-node"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Associated Topic/Node
              </label>
              <select
                id="test-node"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                value={test.nodeId}
                onChange={handleNodeChange}
              >
                <option value="">-- None --</option>
                {Object.entries(nodes).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="test-description"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Test Description
              </label>
              <textarea
                id="test-description"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Enter test description or instructions"
                value={test.content}
                onInput={handleContentChange}
              />
            </div>
          </div>

          {/* AI Question Generation Button */}
          <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 class="text-lg font-medium text-primary-800">
                  Generate Questions with AI
                </h3>
                <p class="text-sm text-primary-600">
                  Let AI help you create test questions based on your test
                  information
                </p>
              </div>
              <button
                type="button"
                onClick={generateQuestionsWithAI}
                disabled={isGeneratingQuestions}
                class={`px-4 py-2 rounded-lg text-white transition-colors flex items-center ${
                  isGeneratingQuestions
                    ? "bg-primary-400 cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700"
                }`}
              >
                {isGeneratingQuestions
                  ? (
                    <>
                      <svg
                        class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <title>Loading spinner</title>
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        />
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating...
                    </>
                  )
                  : (
                    <>
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <title>Lightning bolt icon</title>
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Generate Questions
                    </>
                  )}
              </button>
            </div>
          </div>

          {/* Questions Section */}
          <div>
            <h2 class="text-xl font-semibold mb-4">Questions</h2>

            {test.questions.length === 0
              ? (
                <div class="text-center py-8 bg-gray-50 rounded-lg">
                  <p class="text-gray-500 mb-4">No questions added yet</p>
                  <Button variant="primary" onClick={addQuestion}>
                    <IconPlus class="w-4 h-4 mr-2" />
                    Add First Question
                  </Button>
                </div>
              )
              : (
                <div class="space-y-8">
                  {test.questions.map((question, questionIndex) => (
                    <div
                      key={question.id}
                      class="border border-gray-200 rounded-lg p-6 bg-gray-50"
                    >
                      <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg font-medium">
                          Question {questionIndex + 1}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          class="text-red-500 hover:text-red-700"
                          aria-label={`Remove question ${questionIndex + 1}`}
                        >
                          <IconTrash class="w-5 h-5" />
                        </button>
                      </div>

                      <div class="space-y-4">
                        <div>
                          <label
                            htmlFor={`question-${questionIndex}-text`}
                            class="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Question Text
                          </label>
                          <textarea
                            id={`question-${questionIndex}-text`}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            rows={2}
                            placeholder="Enter question text"
                            value={question.question}
                            onInput={(e) =>
                              handleQuestionChange(
                                questionIndex,
                                "question",
                                (e.target as HTMLTextAreaElement).value,
                              )}
                            required
                          />
                        </div>

                        {/* Image Upload Section */}
                        <div class="border border-dashed border-gray-300 rounded-lg p-4">
                          <div class="flex items-center justify-between mb-2">
                            <label
                              htmlFor={`question-${questionIndex}-image`}
                              class="block text-sm font-medium text-gray-700"
                            >
                              Question Image (Optional)
                            </label>

                            {question.imageUrl
                              ? (
                                <button
                                  type="button"
                                  onClick={() => removeImage(questionIndex)}
                                  class="text-red-500 hover:text-red-700 text-sm"
                                >
                                  Remove Image
                                </button>
                              )
                              : null}
                          </div>

                          <input
                            type="file"
                            accept="image/*"
                            class="hidden"
                            ref={(el) =>
                              fileInputRefs
                                .current[`question-${questionIndex}`] = el}
                            onChange={(e) =>
                              handleImageUpload(questionIndex, e)}
                          />

                          {question.imageUrl
                            ? (
                              <div class="mt-2">
                                <img
                                  src={question.imageUrl}
                                  alt={`Image for question ${
                                    questionIndex + 1
                                  }`}
                                  class="max-h-48 max-w-full rounded-lg mx-auto"
                                />
                              </div>
                            )
                            : (
                              <button
                                type="button"
                                onClick={() =>
                                  triggerImageUpload(questionIndex)}
                                class="w-full flex items-center justify-center py-3 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <IconPhoto class="w-5 h-5 mr-2 text-gray-400" />
                                <span class="text-gray-500">
                                  Click to upload an image
                                </span>
                              </button>
                            )}
                        </div>

                        <div>
                          <label
                            htmlFor={`question-${questionIndex}-type`}
                            class="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Question Type
                          </label>
                          <select
                            id={`question-${questionIndex}-type`}
                            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            value={question.type}
                            onChange={(e) => handleQuestionChange(
                              questionIndex,
                              "type",
                              (e.target as HTMLSelectElement).value,
                            )}
                          >
                            <option value="multiple_choice">
                              Multiple Choice
                            </option>
                            <option value="true_false">True/False</option>
                            <option value="short_answer">Short Answer</option>
                          </select>
                        </div>

                        {/* Question Type Specific Fields */}
                        {question.type === "multiple_choice" && (
                          <div class="space-y-3">
                            <label
                              htmlFor={`question-${questionIndex}-options`}
                              class="block text-sm font-medium text-gray-700"
                            >
                              Options
                            </label>

                            {question.options?.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                class="flex items-center gap-2"
                              >
                                <input
                                  type="radio"
                                  id={`question-${questionIndex}-option-${optionIndex}-correct`}
                                  name={`question-${questionIndex}-correct`}
                                  checked={question.correctAnswer ===
                                    optionIndex}
                                  onChange={() =>
                                    handleCorrectAnswerChange(
                                      questionIndex,
                                      optionIndex,
                                    )}
                                  class="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                />
                                <input
                                  type="text"
                                  id={`question-${questionIndex}-option-${optionIndex}`}
                                  placeholder={`Option ${optionIndex + 1}`}
                                  value={option}
                                  onInput={(e) =>
                                    handleOptionChange(
                                      questionIndex,
                                      optionIndex,
                                      (e.target as HTMLInputElement).value,
                                    )}
                                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />

                                {question.options &&
                                  question.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeOption(questionIndex, optionIndex)}
                                    class="text-red-500 hover:text-red-700"
                                    aria-label={`Remove option ${
                                      optionIndex + 1
                                    }`}
                                  >
                                    <IconTrash class="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => addOption(questionIndex)}
                              class="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-800"
                            >
                              <IconPlus class="w-4 h-4 mr-1" />
                              Add Option
                            </button>
                          </div>
                        )}

                        {question.type === "true_false" && (
                          <div>
                            <label
                              htmlFor={`question-${questionIndex}-tf`}
                              class="block text-sm font-medium text-gray-700 mb-2"
                            >
                              Correct Answer
                            </label>
                            <div class="flex items-center space-x-4">
                              <label class="inline-flex items-center">
                                <input
                                  type="radio"
                                  name={`question-${questionIndex}-tf`}
                                  value="true"
                                  checked={question.correctAnswer === "true"}
                                  onChange={() =>
                                    handleCorrectAnswerChange(
                                      questionIndex,
                                      "true",
                                    )}
                                  class="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                />
                                <span class="ml-2">True</span>
                              </label>
                              <label class="inline-flex items-center">
                                <input
                                  type="radio"
                                  name={`question-${questionIndex}-tf`}
                                  value="false"
                                  checked={question.correctAnswer === "false"}
                                  onChange={() =>
                                    handleCorrectAnswerChange(
                                      questionIndex,
                                      "false",
                                    )}
                                  class="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                />
                                <span class="ml-2">False</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {question.type === "short_answer" && (
                          <div>
                            <label
                              htmlFor={`question-${questionIndex}-answer`}
                              class="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Correct Answer
                            </label>
                            <textarea
                              id={`question-${questionIndex}-answer`}
                              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                              rows={2}
                              placeholder="Enter the correct answer"
                              value={question.correctAnswer as string}
                              onInput={(e) =>
                                handleCorrectAnswerChange(
                                  questionIndex,
                                  (e.target as HTMLTextAreaElement).value,
                                )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addQuestion}
                    class="w-full py-3 border-2 border-gray-300 border-dashed rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                  >
                    <IconPlus class="w-5 h-5 mr-2" />
                    Add Another Question
                  </button>
                </div>
              )}
          </div>

          {/* Save Button */}
          <div class="flex justify-end pt-6">
            <Button
              variant="primary"
              onClick={saveTest}
              isLoading={saving}
              disabled={saving}
            >
              {saving ? "Saving..." : (testId ? "Update Test" : "Create Test")}
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Chat Button and Panel */}
      <div class="fixed bottom-4 right-4 z-50">
        {isChatOpen
          ? (
            <div class="bg-white rounded-lg shadow-xl w-96 h-[500px] flex flex-col overflow-hidden border border-gray-300">
              {/* Chat Header */}
              <div class="p-3 bg-white border-b border-gray-200 flex justify-between items-center">
                <h3 class="font-medium text-gray-800 flex items-center gap-2">
                  <IconMessageCircle size={18} class="text-primary-500" />
                  Test Assistant
                </h3>
                <button
                  type="button"
                  onClick={handleCloseChat}
                  class="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Close chat"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <title>Close chat</title>
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat History */}
              <div class="flex-1 overflow-y-auto p-4 bg-gray-50">
                <ChatHistory messages={chatMessages} />
              </div>

              {/* Chat Input */}
              <div class="p-3 bg-white border-t border-gray-200">
                <div class="flex rounded-lg border border-gray-300 overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500">
                  <textarea
                    ref={chatInputRef}
                    placeholder="Ask for help with your test..."
                    class="flex-1 p-2 resize-none min-h-[40px] max-h-24 focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSubmit();
                      }
                    }}
                    disabled={isProcessingChat}
                  />
                  <button
                    type="button"
                    onClick={handleChatSubmit}
                    disabled={isProcessingChat}
                    class={`px-3 flex items-center justify-center ${
                      isProcessingChat
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-primary-500 text-white hover:bg-primary-600"
                    }`}
                    aria-label="Send message"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <title>Send message</title>
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
          : (
            <button
              type="button"
              onClick={handleOpenChat}
              class="bg-primary-500 hover:bg-primary-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center transform transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-300"
              aria-label="Open chat"
            >
              <IconMessageCircle size={24} />
            </button>
          )}
      </div>
    </div>
  );
}
