import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { Button } from "../../../../components/Button.tsx";
import type { Test, TestQuestion } from "../../../../components/tests/store.ts";
import { startStream } from "../../../../components/chat/stream.ts";
import { addMessage, messages } from "../../../../components/chat/store.ts";
import { IconArrowLeft, IconEye, IconTrash, IconX, IconExclamationCircle } from "@tabler/icons-preact";

interface TestViewIslandProps {
  testId: string;
}

export default function TestViewIsland({ testId }: TestViewIslandProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submission, setSubmission] = useState<
    {
      answers: Record<string, string | string[]>;
      feedback?: Array<
        { questionIdx: number; isCorrect: boolean; explanation?: string }
      >;
    } | null
  >(null);
  const [checkingShortAnswers, setCheckingShortAnswers] = useState(false);
  const [revisitMode, setRevisitMode] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // References for input elements to manage focus
  const inputRefs = useRef<
    Record<string, HTMLInputElement | HTMLElement | null>
  >({});

  // Reference to store functions we need to use
  const [deleteTestFn, setDeleteTestFn] = useState<
    ((id: string) => void) | null
  >(null);

  useEffect(() => {
    if (testId) {
      // Import dynamically to avoid issues with server-side rendering
      import("../../../../components/tests/store.ts").then((module) => {
        const foundTest = module.tests.value.find((t) => t.id === testId) ||
          null;
        setTest(foundTest);
        setLoading(false);

        // Store the deleteTest function reference
        setDeleteTestFn(() => module.deleteTest);

        // Initialize selected answers
        if (foundTest) {
          const initialAnswers: Record<string, string | string[]> = {};
          for (const [idx, q] of foundTest.questions.entries()) {
            initialAnswers[idx.toString()] = q.type === "multiple_choice"
              ? []
              : "";
          }
          setSelectedAnswers(initialAnswers);
        }
      }).catch((error) => {
        console.error("Error importing test store:", error);
        setLoading(false);
      });
    }
  }, [testId]);

  // Add effect to listen for LLM responses when checking short answers
  useEffect(() => {
    if (!checkingShortAnswers || !messages.value.length) return;

    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage.role === "assistant") {
      // Process LLM response
      setCheckingShortAnswers(false);

      // Update the feedback with LLM's assessment
      if (submission?.feedback) {
        // The last message contains the LLM's assessment
        const updatedFeedback = [...submission.feedback];
        const shortAnswerQuestions = test?.questions.filter((q) =>
          q.type === "short_answer"
        ) || [];

        // Extract information from the assistant's response
        const response = typeof lastMessage.content === "string"
          ? lastMessage.content
          : Array.isArray(lastMessage.content)
          ? lastMessage.content.join("")
          : "";

        // Update feedback based on the response
        let additionalCorrect = 0;

        for (const question of shortAnswerQuestions) {
          const questionIndex = test?.questions.findIndex((q) =>
            q.id === question.id
          ) || 0;
          const feedbackIndex = updatedFeedback.findIndex((f) =>
            f.questionIdx === questionIndex
          );

          if (feedbackIndex !== -1) {
            // Look for comments about this specific question in the response
            const responseLines = response.split("\n");
            const questionIdentifier = `Question ${questionIndex + 1}:`;
            const relevantLines = responseLines.filter((line) =>
              line.includes(questionIdentifier) ||
              (responseLines.indexOf(line) > 0 &&
                responseLines[responseLines.indexOf(line) - 1].includes(
                  questionIdentifier,
                ))
            );

            if (relevantLines.length > 0) {
              updatedFeedback[feedbackIndex].explanation = relevantLines.join(
                " ",
              );

              // Try to determine if the answer is correct based on the LLM's assessment
              const answerCorrectness = relevantLines.join(" ").toLowerCase();
              if (
                answerCorrectness.includes("correct") ||
                answerCorrectness.includes("right") ||
                answerCorrectness.includes("good job")
              ) {
                updatedFeedback[feedbackIndex].isCorrect = true;
                additionalCorrect++;
              }
            }
          }
        }

        // Update the score with the additional correct answers
        if (additionalCorrect > 0) {
          setScore((prev) => ({
            ...prev,
            correct: prev.correct + additionalCorrect,
          }));
        }

        setSubmission({ ...submission, feedback: updatedFeedback });
      }
    }
  }, [messages.value, checkingShortAnswers, submission, test]);

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (!test) return;

    const question = test.questions[questionIndex];

    if (question.type === "multiple_choice") {
      const currentAnswers =
        selectedAnswers[questionIndex.toString()] as string[] || [];
      const newAnswers = currentAnswers.includes(answer)
        ? currentAnswers.filter((a) => a !== answer)
        : [...currentAnswers, answer];

      setSelectedAnswers({
        ...selectedAnswers,
        [questionIndex.toString()]: newAnswers,
      });
    } else {
      setSelectedAnswers({
        ...selectedAnswers,
        [questionIndex.toString()]: answer,
      });
    }
  };

  // Fix the deleteTest function to ensure it works properly
  const handleDeleteTest = useCallback(() => {
    if (!test || !deleteTestFn) {
      console.error("Cannot delete test: test or deleteTestFn is null");
      return;
    }

    try {
      console.log("Deleting test with ID:", test.id);
      deleteTestFn(test.id);
      console.log("Test deleted, redirecting to /tests");

      // Use window.location.href for client-side navigation
      window.location.href = "/tests";
    } catch (error) {
      console.error("Error deleting test:", error);
    }
  }, [test, deleteTestFn]);

  const checkShortAnswersWithLLM = async (
    feedback: Array<
      { questionIdx: number; isCorrect: boolean; explanation?: string }
    >,
  ) => {
    if (!test) return feedback;

    const shortAnswerQuestions = test.questions.filter((q) =>
      q.type === "short_answer"
    );
    if (shortAnswerQuestions.length === 0) return feedback;

    setCheckingShortAnswers(true);
    setSubmissionError(null);

    try {
      // Construct a prompt to evaluate the short answers
      let prompt =
        "I need you to evaluate some short answer test responses. For each question, I'll provide the correct answer and the student's response. Please tell me if each response is correct or not, and provide a brief explanation.";

      for (const question of shortAnswerQuestions) {
        const questionIndex = test.questions.findIndex((q) =>
          q.id === question.id
        );
        const userAnswer = selectedAnswers[questionIndex.toString()] as string ||
          "(No answer provided)";

        prompt += `\n\nQuestion ${questionIndex + 1}: ${question.question}\n`;
        prompt += `Correct answer: ${question.correctAnswer}\n`;
        prompt += `Student's answer: ${userAnswer}\n`;
        prompt +=
          "Is this correct? Please explain why or why not in 1-2 sentences.";
      }

      // Send to LLM for evaluation
      addMessage({ role: "user", content: prompt });
      await startStream(prompt);

      return feedback;
    } catch (error) {
      console.error("Error checking short answers with LLM:", error);
      setSubmissionError(
        "Unable to check short answer questions with AI. Your test has been submitted, but some answers may not be fully evaluated. Please check your AI credentials in settings."
      );
      
      // Update feedback to show error for short answer questions
      const updatedFeedback = feedback.map((item) => {
        const question = test.questions[item.questionIdx];
        if (question.type === "short_answer") {
          return {
            ...item,
            explanation: "❌ Unable to check answer - AI evaluation failed"
          };
        }
        return item;
      });
      
      return updatedFeedback;
    } finally {
      setCheckingShortAnswers(false);
    }
  };

  const handleSubmit = async () => {
    if (!test) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      let correctCount = 0;
      const feedbackItems: Array<
        { questionIdx: number; isCorrect: boolean; explanation?: string }
      > = [];

      for (const [idx, question] of test.questions.entries()) {
        const userAnswer = selectedAnswers[idx.toString()];
        let isCorrect = false;

        if (question.type === "multiple_choice") {
          // For multiple choice, check if selected answers match correct answers
          const selectedOptions = userAnswer as string[];
          const correctOptions = Array.isArray(question.correctAnswer)
            ? question.correctAnswer
            : [question.correctAnswer as string];

          isCorrect = selectedOptions.length === correctOptions.length &&
            selectedOptions.every((option) => correctOptions.includes(option));
        } else if (question.type === "true_false") {
          // For true/false, direct comparison with language normalization
          const normalizedUserAnswer = (userAnswer as string).toLowerCase();
          const normalizedCorrectAnswer = (question.correctAnswer as string)
            .toLowerCase();

          // Handle German/English equivalents
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer ||
            (normalizedUserAnswer === "falsch" &&
              normalizedCorrectAnswer === "false") ||
            (normalizedUserAnswer === "false" &&
              normalizedCorrectAnswer === "falsch") ||
            (normalizedUserAnswer === "wahr" &&
              normalizedCorrectAnswer === "true") ||
            (normalizedUserAnswer === "true" &&
              normalizedCorrectAnswer === "wahr");
        } else if (question.type === "short_answer") {
          // For short answer, we'll use fuzzy matching initially but will validate with LLM later
          const normalizedUserAnswer = (userAnswer as string).toLowerCase()
            .trim();
          const normalizedCorrectAnswer = (question.correctAnswer as string)
            .toLowerCase().trim();

          // Simple initial check - we'll validate further with LLM
          isCorrect = normalizedUserAnswer.includes(normalizedCorrectAnswer) ||
            normalizedCorrectAnswer.includes(normalizedUserAnswer);
        }

        if (isCorrect && question.type !== "short_answer") {
          correctCount++;
        }

        feedbackItems.push({
          questionIdx: idx,
          isCorrect,
          explanation: question.type === "short_answer"
            ? "Checking with AI..."
            : undefined,
        });
      }

      setScore({
        correct: correctCount,
        total: test.questions.length,
      });

      const submission = {
        answers: { ...selectedAnswers },
        feedback: feedbackItems,
      };

      setSubmission(submission);
      setShowResults(true);

      // Use LLM to validate short answers
      if (test.questions.some((q) => q.type === "short_answer")) {
        await checkShortAnswersWithLLM(feedbackItems);
      }
    } catch (error) {
      console.error("Error submitting test:", error);
      setSubmissionError(
        "Failed to submit test. Please try again or check your internet connection."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyboard events for the entire test form
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !showResults) {
      e.preventDefault();

      if (currentQuestionIndex < (test?.questions.length || 0) - 1) {
        // Move to next question on Enter
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Submit the test on Enter if on the last question
        handleSubmit();
      }
    }
  };

  // Focus the appropriate input when changing questions
  useEffect(() => {
    if (!showResults && test) {
      // Focus the first input of the current question
      const currentQuestionRef =
        inputRefs.current[`question-${currentQuestionIndex}`];
      if (currentQuestionRef) {
        setTimeout(() => {
          currentQuestionRef.focus();
        }, 50);
      }
    }
  }, [currentQuestionIndex, showResults, test]);

  const renderQuestion = (question: TestQuestion, index: number) => {
    const isCurrentQuestion = index === currentQuestionIndex;

    if (!isCurrentQuestion && !showResults) return null;

    return (
      <div
        key={`question-${index}`}
        class={`mb-12 ${
          showResults ? "block" : (isCurrentQuestion ? "block" : "hidden")
        }`}
        onKeyDown={handleKeyDown}
      >
        <h3 class="text-2xl font-semibold mb-6">
          Question {index + 1}: {question.question}
        </h3>

        {/* Display question image if available */}
        {question.imageUrl && (
          <div class="mb-6">
            <img
              src={question.imageUrl}
              alt={`Question ${index + 1} visual`}
              class="max-w-full rounded-lg border border-gray-200 max-h-64 mx-auto"
            />
          </div>
        )}

        {question.type === "multiple_choice" && (
          <div class="space-y-4">
            {question.options?.map((option, optIndex) => {
              const isSelected =
                Array.isArray(selectedAnswers[index.toString()]) &&
                (selectedAnswers[index.toString()] as string[]).includes(
                  option,
                );
              const isCorrect =
                showResults && Array.isArray(question.correctAnswer)
                  ? (question.correctAnswer as string[]).includes(option)
                  : question.correctAnswer === option;
              const isWrong = showResults && isSelected && !isCorrect;

              return (
                <label
                  key={`option-${option}-${index}`}
                  class={`block p-4 border-l-4 rounded transition-colors ${
                    isSelected
                      ? "border-l-primary-500 bg-primary-50"
                      : "border-l-transparent hover:border-l-gray-300 hover:bg-gray-50"
                  } ${
                    showResults && isCorrect
                      ? "border-l-green-500 bg-green-50"
                      : ""
                  }
                  ${isWrong ? "border-l-red-500 bg-red-50" : ""}`}
                >
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={showResults}
                      class="mr-4 h-5 w-5"
                      onChange={() =>
                        !showResults && handleAnswerSelect(index, option)}
                      ref={optIndex === 0
                        ? (el) => {
                          inputRefs.current[`question-${index}`] = el;
                        }
                        : null}
                      tabIndex={isCurrentQuestion ? 0 : -1}
                    />
                    <span class="text-lg">{option}</span>
                    {showResults && isCorrect && (
                      <span class="ml-auto text-green-600 text-xl">✓</span>
                    )}
                    {isWrong && (
                      <span class="ml-auto text-red-600 text-xl">✗</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {question.type === "true_false" && (
          <div class="space-y-4">
            {["True", "False"].map((option, optIndex) => {
              // Normalize the selected answer and correct answer for comparison
              const normalizedSelected =
                (selectedAnswers[index.toString()] as string || "")
                  .toLowerCase();
              const normalizedOption = option.toLowerCase();
              const normalizedCorrect = (question.correctAnswer as string || "")
                .toLowerCase();

              // Check if selected, considering language equivalents
              const isSelected = normalizedSelected === normalizedOption ||
                (normalizedSelected === "wahr" &&
                  normalizedOption === "true") ||
                (normalizedSelected === "falsch" &&
                  normalizedOption === "false");

              // Check if correct, considering language equivalents
              const isCorrect = showResults && (
                normalizedCorrect === normalizedOption ||
                (normalizedCorrect === "wahr" && normalizedOption === "true") ||
                (normalizedCorrect === "falsch" && normalizedOption === "false")
              );

              const isWrong = showResults && isSelected && !isCorrect;

              // Display the option in the user's preferred language
              const displayOption = option === "True"
                ? (normalizedSelected === "wahr" ? "Wahr" : "True")
                : (normalizedSelected === "falsch" ? "Falsch" : "False");

              return (
                <label
                  key={`tf-${option}-${index}`}
                  class={`block p-4 border-l-4 rounded transition-colors ${
                    isSelected
                      ? "border-l-primary-500 bg-primary-50"
                      : "border-l-transparent hover:border-l-gray-300 hover:bg-gray-50"
                  } ${
                    showResults && isCorrect
                      ? "border-l-green-500 bg-green-50"
                      : ""
                  }
                  ${isWrong ? "border-l-red-500 bg-red-50" : ""}`}
                >
                  <div class="flex items-center">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      checked={isSelected}
                      disabled={showResults}
                      class="mr-4 h-5 w-5"
                      onChange={() =>
                        !showResults && handleAnswerSelect(index, option)}
                      ref={optIndex === 0
                        ? (el) => {
                          inputRefs.current[`question-${index}`] = el;
                        }
                        : null}
                      tabIndex={isCurrentQuestion ? 0 : -1}
                    />
                    <span class="text-lg">{displayOption}</span>
                    {showResults && isCorrect && (
                      <span class="ml-auto text-green-600 text-xl">✓</span>
                    )}
                    {isWrong && (
                      <span class="ml-auto text-red-600 text-xl">✗</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {question.type === "short_answer" && (
          <div>
            <input
              type="text"
              class="w-full p-4 border-b-2 border-gray-300 focus:border-primary-500 outline-none text-lg bg-gray-50"
              value={selectedAnswers[index.toString()] as string}
              disabled={showResults}
              onInput={(e) =>
                !showResults &&
                handleAnswerSelect(index, (e.target as HTMLInputElement).value)}
              placeholder="Type your answer here..."
              ref={(el) => {
                inputRefs.current[`question-${index}`] = el;
              }}
              tabIndex={isCurrentQuestion ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (
                    currentQuestionIndex < (test?.questions.length || 0) - 1
                  ) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                  } else {
                    handleSubmit();
                  }
                }
              }}
            />
            {showResults && (
              <div class="mt-6 pl-4 border-l-4 border-l-primary-500 bg-primary-50 p-4">
                <p class="text-lg font-semibold">
                  Correct answer:{" "}
                  <span class="text-green-600">{question.correctAnswer}</span>
                </p>
                <p class="text-lg font-semibold mt-2">
                  Your answer:{" "}
                  <span
                    class={selectedAnswers[index.toString()] ===
                        question.correctAnswer
                      ? "text-green-600"
                      : "text-red-600"}
                  >
                    {selectedAnswers[index.toString()] as string ||
                      "(No answer provided)"}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleReturnToGraph = () => {
    window.location.href = "/graph";
  };

  const showTestResults = () => {
    setRevisitMode(true);
    setShowResults(true);
  };

  // Add a new section to render the detailed submissions, when available
  const renderDetailedResults = () => {
    if (!submission || !test) return null;

    return (
      <div class="mt-8 border-t border-gray-200 pt-8">
        <h2 class="text-2xl font-bold mb-6">Detailed Results</h2>

        {test.questions.map((question, idx) => {
          const feedback = submission.feedback?.find((f) =>
            f.questionIdx === idx
          );
          const userAnswer = submission.answers[idx.toString()];
          const isCorrect = feedback?.isCorrect || false;

          return (
            <div
              key={`result-question-${question.id}`}
              class="mb-8 p-4 rounded-lg border-l-4 border-gray-200"
            >
              <div
                class={`border-l-4 ${
                  isCorrect ? "border-green-500" : "border-red-500"
                } pl-4 -ml-4`}
              >
                <h3 class="text-xl font-medium mb-2">
                  Question {idx + 1}: {question.question}
                </h3>

                <div class="mt-4 space-y-2">
                  <p class="font-medium">
                    Correct answer:{" "}
                    <span class="text-green-600">
                      {Array.isArray(question.correctAnswer)
                        ? question.correctAnswer.join(", ")
                        : question.correctAnswer}
                    </span>
                  </p>

                  <p class="font-medium">
                    Your answer:{" "}
                    <span class={isCorrect ? "text-green-600" : "text-red-600"}>
                      {Array.isArray(userAnswer)
                        ? (userAnswer as string[]).join(", ")
                        : (userAnswer as string) || "(No answer provided)"}
                    </span>
                  </p>

                  {feedback?.explanation && (
                    <div class="mt-2 bg-gray-50 p-3 rounded">
                      <p class="font-medium text-gray-900">Feedback:</p>
                      <p class="text-gray-700">{feedback.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div class="container mx-auto px-6 py-10 text-gray-600">
        Loading test...
      </div>
    );
  }

  if (!test) {
    return (
      <div class="container mx-auto px-6 py-10 text-gray-600">
        Test not found
      </div>
    );
  }

  return (
    <div class="container mx-auto px-6 py-10 max-w-4xl">
      <div class="mb-8">
        <a
          href="/tests"
          class="inline-flex items-center text-primary-600 hover:text-primary-800"
        >
          <IconArrowLeft class="w-5 h-5 mr-2" />
          Back to all tests
        </a>
      </div>

      <div class="mb-12">
        <h1 class="text-4xl font-bold mb-4 text-gray-900">{test.name}</h1>
        <div class="flex justify-between items-start mb-6">
          <p class="text-gray-600">Created from node: {test.nodeId}</p>

          <div class="flex items-center space-x-4">
            {submission && !revisitMode && (
              <button
                onClick={showTestResults}
                class="text-primary-500 hover:text-primary-700 flex items-center"
                aria-label="View submissions"
                type="button"
              >
                <IconEye class="w-5 h-5 mr-1" />
                <span>View Submissions</span>
              </button>
            )}

            {!showDeleteConfirm
              ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  class="text-red-500 hover:text-red-700 flex items-center"
                  aria-label="Delete test"
                  type="button"
                >
                  <IconTrash class="w-5 h-5 mr-1" />
                  <span>Delete Test</span>
                </button>
              )
              : (
                <div class="flex items-center space-x-2">
                  <span class="text-red-600 font-medium">Are you sure?</span>
                  <button
                    onClick={handleDeleteTest}
                    class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-700"
                    aria-label="Confirm delete"
                    type="button"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    class="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    aria-label="Cancel delete"
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              )}
          </div>
        </div>

        <div class="prose max-w-none text-lg mb-10 border-b pb-8">
          {test.content}
        </div>

        {showResults && (
          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-900">Test Results</h2>
              <button
                onClick={() => setShowResults(false)}
                class="text-gray-600 hover:text-gray-800"
              >
                <IconX class="w-6 h-6" />
              </button>
            </div>

            <div class="mb-6">
              <div class="flex items-center justify-center gap-4 mb-4">
                <div class="text-center">
                  <div class="text-4xl font-bold text-green-500">
                    {score.correct}
                  </div>
                  <div class="text-sm text-gray-600">Correct</div>
                </div>
                <div class="text-4xl text-gray-300">/</div>
                <div class="text-center">
                  <div class="text-4xl font-bold text-gray-700">
                    {score.total}
                  </div>
                  <div class="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              {test.questions.map((question, index) => (
                <div key={index} class="p-4 rounded-lg bg-gray-50">
                  <h3 class="font-medium text-gray-900 mb-2">
                    Question {index + 1}: {question.question}
                  </h3>

                  {question.type === "multiple_choice" && question.options && (
                    <div class="ml-4 space-y-2">
                      {question.options.map((option, optIndex) => {
                        const isSelected = (selectedAnswers[index] as string[])
                          ?.includes(option);
                        const isCorrect = Array.isArray(question.correctAnswer)
                          ? question.correctAnswer.includes(optIndex)
                          : question.correctAnswer === optIndex;

                        return (
                          <div
                            key={optIndex}
                            class={`flex items-center p-2 rounded ${
                              isSelected
                                ? isCorrect
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                : isCorrect && showResults
                                ? "bg-green-50 text-green-800"
                                : "text-gray-700"
                            }`}
                          >
                            <span class="ml-2">{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {question.type === "true_false" && (
                    <div class="ml-4 space-y-2">
                      {["True", "False"].map((option) => {
                        const isSelected = selectedAnswers[index] === option;
                        const isCorrect = question.correctAnswer === option;

                        return (
                          <div
                            key={option}
                            class={`flex items-center p-2 rounded ${
                              isSelected
                                ? isCorrect
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                : isCorrect && showResults
                                ? "bg-green-50 text-green-800"
                                : "text-gray-700"
                            }`}
                          >
                            <span class="ml-2">{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {question.type === "short_answer" && (
                    <div class="ml-4">
                      <div class="mb-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Your Answer:
                        </label>
                        <div class="p-2 rounded bg-gray-100 text-gray-800">
                          {selectedAnswers[index] || "No answer provided"}
                        </div>
                      </div>
                      {showResults && (
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">
                            Correct Answer:
                          </label>
                          <div class="p-2 rounded bg-green-50 text-green-800">
                            {question.correctAnswer}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!showResults && (
          <div class="space-y-6">
            {test.questions.map((question, index) => (
              <div key={index} class="bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-xl font-medium text-gray-900 mb-4">
                  Question {index + 1}: {question.question}
                </h3>

                {question.type === "multiple_choice" && question.options && (
                  <div class="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => handleAnswerSelect(index, option)}
                        class={`w-full text-left p-3 rounded-lg border transition-colors ${
                          (selectedAnswers[index] as string[])?.includes(option)
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 hover:border-primary-200 hover:bg-primary-50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === "true_false" && (
                  <div class="space-y-2">
                    {["True", "False"].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswerSelect(index, option)}
                        class={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedAnswers[index] === option
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 hover:border-primary-200 hover:bg-primary-50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === "short_answer" && (
                  <div>
                    <textarea
                      value={selectedAnswers[index] as string}
                      onChange={(e) =>
                        handleAnswerSelect(
                          index,
                          (e.target as HTMLTextAreaElement).value,
                        )}
                      class="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                      rows={4}
                      placeholder="Enter your answer here..."
                    />
                  </div>
                )}
              </div>
            ))}

            {submissionError && (
              <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div class="flex items-start">
                  <IconExclamationCircle class="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 class="text-sm font-medium text-red-800 mb-1">Test Submission Error</h3>
                    <p class="text-sm text-red-700">{submissionError}</p>
                  </div>
                </div>
              </div>
            )}

            <div class="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = "/tests"}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={checkingShortAnswers || isSubmitting}
              >
                {isSubmitting 
                  ? "Submitting..." 
                  : checkingShortAnswers 
                  ? "Checking answers..." 
                  : "Submit Test"
                }
              </Button>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Delete Test</h2>
            <p class="text-gray-600 mb-6">
              Are you sure you want to delete this test? This action cannot be
              undone.
            </p>
            <div class="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteTest}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
