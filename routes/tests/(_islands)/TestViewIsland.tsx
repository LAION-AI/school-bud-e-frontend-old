import { useEffect, useState, useCallback } from "preact/hooks";
import { Button } from "../../../components/Button.tsx";
import { ArrowLeft, Trash2, Eye, type LucideProps } from "lucide-preact";
import type { VNode } from "preact";
import type { Test, TestQuestion } from "../../../components/tests/store.ts";
import { startStream } from "../../../components/chat/stream.ts";
import { addMessage, messages } from "../../../components/chat/store.ts";

// Safe wrapper for Lucide icon
function SafeArrowLeft(props: LucideProps): VNode {
  return <ArrowLeft {...props} />;
}

function SafeTrash2(props: LucideProps): VNode {
  return <Trash2 {...props} />;
}

function SafeEye(props: LucideProps): VNode {
  return <Eye {...props} />;
}

interface TestViewIslandProps {
  testId: string;
}

export default function TestViewIsland({ testId }: TestViewIslandProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submission, setSubmission] = useState<{
    answers: Record<string, string | string[]>;
    feedback?: Array<{questionIdx: number, isCorrect: boolean, explanation?: string}>;
  } | null>(null);
  const [checkingShortAnswers, setCheckingShortAnswers] = useState(false);
  const [revisitMode, setRevisitMode] = useState(false);
  
  // Reference to store functions we need to use
  const [deleteTestFn, setDeleteTestFn] = useState<((id: string) => void) | null>(null);

  useEffect(() => {
    if (testId) {
      // Import dynamically to avoid issues with server-side rendering
      import("../../../components/tests/store.ts").then((module) => {
        const foundTest = module.tests.value.find(t => t.id === testId) || null;
        setTest(foundTest);
        setLoading(false);
        
        // Store the deleteTest function reference
        setDeleteTestFn(() => module.deleteTest);
        
        // Initialize selected answers
        if (foundTest) {
          const initialAnswers: Record<string, string | string[]> = {};
          for (const [idx, q] of foundTest.questions.entries()) {
            initialAnswers[idx.toString()] = q.type === "multiple_choice" ? [] : "";
          }
          setSelectedAnswers(initialAnswers);
        }
      }).catch(error => {
        console.error("Error importing test store:", error);
        setLoading(false);
      });
    }
  }, [testId]);

  // Add effect to listen for LLM responses when checking short answers
  useEffect(() => {
    if (!checkingShortAnswers || !messages.value.length) return;
    
    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage.role === 'assistant') {
      // Process LLM response
      setCheckingShortAnswers(false);
      
      // Update the feedback with LLM's assessment
      if (submission?.feedback) {
        // The last message contains the LLM's assessment
        const updatedFeedback = [...submission.feedback];
        const shortAnswerQuestions = test?.questions.filter(q => q.type === 'short_answer') || [];
        
        // Extract information from the assistant's response
        const response = typeof lastMessage.content === 'string' 
          ? lastMessage.content 
          : Array.isArray(lastMessage.content) 
            ? lastMessage.content.join('') 
            : '';
        
        // Update feedback based on the response
        shortAnswerQuestions.forEach((question) => {
          const questionIndex = test?.questions.findIndex(q => q.id === question.id) || 0;
          const feedbackIndex = updatedFeedback.findIndex(f => f.questionIdx === questionIndex);
          
          if (feedbackIndex !== -1) {
            // Look for comments about this specific question in the response
            const responseLines = response.split('\n');
            const questionIdentifier = `Question ${questionIndex + 1}:`;
            const relevantLines = responseLines.filter(line => 
              line.includes(questionIdentifier) || 
              (responseLines.indexOf(line) > 0 && 
              responseLines[responseLines.indexOf(line) - 1].includes(questionIdentifier))
            );
            
            if (relevantLines.length > 0) {
              updatedFeedback[feedbackIndex].explanation = relevantLines.join(' ');
              
              // Try to determine if the answer is correct based on the LLM's assessment
              const answerCorrectness = relevantLines.join(' ').toLowerCase();
              if (
                answerCorrectness.includes('correct') || 
                answerCorrectness.includes('right') || 
                answerCorrectness.includes('good job')
              ) {
                updatedFeedback[feedbackIndex].isCorrect = true;
                setScore(prev => ({...prev, correct: prev.correct + 1}));
              }
            }
          }
        });
        
        setSubmission({...submission, feedback: updatedFeedback});
      }
    }
  }, [messages.value, checkingShortAnswers, submission, test]);

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    if (!test) return;
    
    const question = test.questions[questionIndex];
    
    if (question.type === "multiple_choice") {
      const currentAnswers = selectedAnswers[questionIndex.toString()] as string[] || [];
      const newAnswers = currentAnswers.includes(answer)
        ? currentAnswers.filter(a => a !== answer)
        : [...currentAnswers, answer];
      
      setSelectedAnswers({
        ...selectedAnswers,
        [questionIndex.toString()]: newAnswers
      });
    } else {
      setSelectedAnswers({
        ...selectedAnswers,
        [questionIndex.toString()]: answer
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

  const checkShortAnswersWithLLM = async (feedback: Array<{questionIdx: number, isCorrect: boolean, explanation?: string}>) => {
    if (!test) return feedback;
    
    const shortAnswerQuestions = test.questions.filter(q => q.type === 'short_answer');
    if (shortAnswerQuestions.length === 0) return feedback;
    
    setCheckingShortAnswers(true);
    
    // Construct a prompt to evaluate the short answers
    let prompt = "I need you to evaluate some short answer test responses. For each question, I'll provide the correct answer and the student's response. Please tell me if each response is correct or not, and provide a brief explanation.";
    
    shortAnswerQuestions.forEach((question) => {
      const questionIndex = test.questions.findIndex(q => q.id === question.id);
      const userAnswer = selectedAnswers[questionIndex.toString()] as string || "(No answer provided)";
      
      prompt += `\n\nQuestion ${questionIndex + 1}: ${question.question}\n`;
      prompt += `Correct answer: ${question.correctAnswer}\n`;
      prompt += `Student's answer: ${userAnswer}\n`;
      prompt += "Is this correct? Please explain why or why not in 1-2 sentences.";
    });
    
    // Send to LLM for evaluation
    addMessage({ role: "user", content: prompt });
    await startStream(prompt);
    
    return feedback;
  };

  const handleSubmit = async () => {
    if (!test) return;
    
    let correctCount = 0;
    const feedbackItems: Array<{questionIdx: number, isCorrect: boolean, explanation?: string}> = [];
    
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
          selectedOptions.every(option => correctOptions.includes(option));
      } else if (question.type === "true_false") {
        // For true/false, direct comparison
        isCorrect = userAnswer === question.correctAnswer;
      } else if (question.type === "short_answer") {
        // For short answer, we'll use fuzzy matching initially but will validate with LLM later
        const normalizedUserAnswer = (userAnswer as string).toLowerCase().trim();
        const normalizedCorrectAnswer = (question.correctAnswer as string).toLowerCase().trim();
        
        // Simple initial check - we'll validate further with LLM
        isCorrect = normalizedUserAnswer.includes(normalizedCorrectAnswer) || 
                   normalizedCorrectAnswer.includes(normalizedUserAnswer);
      }
      
      if (isCorrect && question.type !== 'short_answer') {
        correctCount++;
      }
      
      feedbackItems.push({
        questionIdx: idx,
        isCorrect,
        explanation: question.type === 'short_answer' ? "Checking with AI..." : undefined
      });
    }
    
    setScore({
      correct: correctCount,
      total: test.questions.length
    });
    
    const submission = {
      answers: {...selectedAnswers},
      feedback: feedbackItems
    };
    
    setSubmission(submission);
    setShowResults(true);
    
    // Use LLM to validate short answers
    if (test.questions.some(q => q.type === 'short_answer')) {
      await checkShortAnswersWithLLM(feedbackItems);
    }
  };

  const renderQuestion = (question: TestQuestion, index: number) => {
    const isCurrentQuestion = index === currentQuestionIndex;
    
    if (!isCurrentQuestion && !showResults) return null;
    
    return (
      <div key={`question-${index}`} class={`mb-12 ${showResults ? 'block' : (isCurrentQuestion ? 'block' : 'hidden')}`}>
        <h3 class="text-2xl font-semibold mb-6">Question {index + 1}: {question.question}</h3>
        
        {question.type === "multiple_choice" && (
          <div class="space-y-4">
            {question.options?.map((option) => {
              const isSelected = Array.isArray(selectedAnswers[index.toString()]) && 
                (selectedAnswers[index.toString()] as string[]).includes(option);
              const isCorrect = showResults && Array.isArray(question.correctAnswer) 
                ? (question.correctAnswer as string[]).includes(option)
                : question.correctAnswer === option;
              const isWrong = showResults && isSelected && !isCorrect;
              
              return (
                <label 
                  key={`option-${option}-${index}`}
                  class={`block p-4 border-l-4 rounded transition-colors ${
                    isSelected ? 'border-l-blue-500 bg-blue-50' : 'border-l-transparent hover:border-l-gray-300 hover:bg-gray-50'
                  } ${showResults && isCorrect ? 'border-l-green-500 bg-green-50' : ''}
                  ${isWrong ? 'border-l-red-500 bg-red-50' : ''}`}
                >
                  <div class="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      disabled={showResults}
                      class="mr-4 h-5 w-5"
                      onChange={() => !showResults && handleAnswerSelect(index, option)}
                    />
                    <span class="text-lg">{option}</span>
                    {showResults && isCorrect && <span class="ml-auto text-green-600 text-xl">✓</span>}
                    {isWrong && <span class="ml-auto text-red-600 text-xl">✗</span>}
                  </div>
                </label>
              );
            })}
          </div>
        )}
        
        {question.type === "true_false" && (
          <div class="space-y-4">
            {["True", "False"].map((option) => {
              const isSelected = selectedAnswers[index.toString()] === option;
              const isCorrect = showResults && question.correctAnswer === option;
              const isWrong = showResults && isSelected && !isCorrect;
              
              return (
                <label 
                  key={`tf-${option}-${index}`} 
                  class={`block p-4 border-l-4 rounded transition-colors ${
                    isSelected ? 'border-l-blue-500 bg-blue-50' : 'border-l-transparent hover:border-l-gray-300 hover:bg-gray-50'
                  } ${showResults && isCorrect ? 'border-l-green-500 bg-green-50' : ''}
                  ${isWrong ? 'border-l-red-500 bg-red-50' : ''}`}
                >
                  <div class="flex items-center">
                    <input 
                      type="radio" 
                      name={`question-${index}`}
                      checked={isSelected}
                      disabled={showResults}
                      class="mr-4 h-5 w-5"
                      onChange={() => !showResults && handleAnswerSelect(index, option)}
                    />
                    <span class="text-lg">{option}</span>
                    {showResults && isCorrect && <span class="ml-auto text-green-600 text-xl">✓</span>}
                    {isWrong && <span class="ml-auto text-red-600 text-xl">✗</span>}
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
              class="w-full p-4 border-b-2 border-gray-300 focus:border-blue-500 outline-none text-lg bg-gray-50"
              value={selectedAnswers[index.toString()] as string}
              disabled={showResults}
              onInput={(e) => !showResults && handleAnswerSelect(index, (e.target as HTMLInputElement).value)}
              placeholder="Type your answer here..."
            />
            {showResults && (
              <div class="mt-6 pl-4 border-l-4 border-l-blue-500 bg-blue-50 p-4">
                <p class="text-lg font-semibold">Correct answer: <span class="text-green-600">{question.correctAnswer}</span></p>
                <p class="text-lg font-semibold mt-2">Your answer: <span class={selectedAnswers[index.toString()] === question.correctAnswer ? "text-green-600" : "text-red-600"}>
                  {selectedAnswers[index.toString()] as string || "(No answer provided)"}
                </span></p>
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
          const feedback = submission.feedback?.find(f => f.questionIdx === idx);
          const userAnswer = submission.answers[idx.toString()];
          const isCorrect = feedback?.isCorrect || false;
          
          return (
            <div key={`result-question-${question.id}`} class="mb-8 p-4 rounded-lg border-l-4 border-gray-200">
              <div class={`border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'} pl-4 -ml-4`}>
                <h3 class="text-xl font-medium mb-2">Question {idx + 1}: {question.question}</h3>
                
                <div class="mt-4 space-y-2">
                  <p class="font-medium">Correct answer: <span class="text-green-600">
                    {Array.isArray(question.correctAnswer) 
                      ? question.correctAnswer.join(', ') 
                      : question.correctAnswer}
                  </span></p>
                  
                  <p class="font-medium">Your answer: <span class={isCorrect ? "text-green-600" : "text-red-600"}>
                    {Array.isArray(userAnswer) 
                      ? (userAnswer as string[]).join(', ') 
                      : (userAnswer as string) || "(No answer provided)"}
                  </span></p>
                  
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
    return <div class="container mx-auto px-6 py-10">Loading test...</div>;
  }

  if (!test) {
    return <div class="container mx-auto px-6 py-10">Test not found</div>;
  }

  return (
    <div class="container mx-auto px-6 py-10 max-w-4xl">
      <div class="mb-8">
        <a href="/graph" class="inline-flex items-center text-blue-600 hover:text-blue-800">
          <SafeArrowLeft class="w-5 h-5 mr-2" />
          Back to Graph
        </a>
      </div>
      
      <div class="mb-12">
        <h1 class="text-4xl font-bold mb-4">{test.name}</h1>
        <div class="flex justify-between items-start mb-6">
          <p class="text-gray-600">Created from node: {test.nodeId}</p>
          
          <div class="flex items-center space-x-4">
            {submission && !revisitMode && (
              <button
                onClick={showTestResults}
                class="text-blue-500 hover:text-blue-700 flex items-center"
                aria-label="View submissions"
                type="button"
              >
                <SafeEye class="w-5 h-5 mr-1" />
                <span>View Submissions</span>
              </button>
            )}
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                class="text-red-500 hover:text-red-700 flex items-center"
                aria-label="Delete test"
                type="button"
              >
                <SafeTrash2 class="w-5 h-5 mr-1" />
                <span>Delete Test</span>
              </button>
            ) : (
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
          <div class="mb-10 py-6 px-8 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
            <h2 class="text-2xl font-bold mb-3">Test Results</h2>
            {checkingShortAnswers ? (
              <div class="flex items-center">
                <svg 
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Evaluating short answers with AI...</span>
              </div>
            ) : (
              <p class="text-xl">
                You scored <span class="font-bold">{score.correct}</span> out of <span class="font-bold">{score.total}</span> 
                ({Math.round((score.correct / score.total) * 100)}%)
              </p>
            )}
          </div>
        )}
        
        {showResults && submission && renderDetailedResults()}
        
        {!showResults && (
          <div>
            {test.questions.map((question, index) => renderQuestion(question, index))}
          </div>
        )}
        
        {!showResults && (
          <div class="mt-8 flex justify-between">
            <Button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              class="px-6 py-3 text-lg"
            >
              Previous
            </Button>
            
            {currentQuestionIndex < test.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIndex(Math.min(test.questions.length - 1, currentQuestionIndex + 1))}
                class="px-6 py-3 text-lg"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                class="px-6 py-3 text-lg bg-green-600 hover:bg-green-700"
              >
                Submit Test
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 