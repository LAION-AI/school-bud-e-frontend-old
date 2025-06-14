import {
  IconBook,
  IconCalendar,
  IconEdit,
  IconFileExport,
  IconPlayerPlay,
  IconPlus,
  IconTag,
} from "@tabler/icons-preact";
import { useEffect, useState } from "preact/hooks";
import * as graphStore from "../../../../components/graph/store.ts";
import type { Test } from "../../../components/tests/store.ts";
import { Button } from "../../../../components/Button.tsx";

// Format date to be more compact
function formatDate(date: number | string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Format test data for document export
function formatTestForDocExport(test: Test, nodeName: string): string {
  let docContent = `# ${test.name}\n\n`;

  // Add metadata
  docContent += `**Topic:** ${nodeName || test.nodeId || "N/A"}\n`;
  docContent += `**Created:** ${formatDate(test.createdAt)}\n`;
  docContent += `**Last Updated:** ${
    formatDate(
      test.lastUpdatedAt || test.createdAt,
    )
  }\n\n`;

  // Add description if available
  if (test.content) {
    docContent += `## Description\n${test.content}\n\n`;
  }

  // Add questions
  docContent += "## Questions\n\n";

  test.questions.forEach((question, index) => {
    docContent += `### Question ${index + 1}\n${question.question}\n\n`;

    // Add image reference if available
    if (question.imageUrl) {
      docContent += `[Image for Question ${index + 1}]\n\n`;
    }

    if (question.type === "multiple_choice" && question.options) {
      docContent += "**Type:** Multiple Choice\n\n";
      question.options.forEach((option, optIndex) => {
        docContent += `${String.fromCharCode(65 + optIndex)}. ${option}\n`;
      });
      docContent += `\n**Correct Answer:** `;

      if (typeof question.correctAnswer === "number" && question.options) {
        const answerLetter = String.fromCharCode(65 + question.correctAnswer);
        docContent += `${answerLetter}. ${
          question.options[question.correctAnswer]
        }\n\n`;
      } else if (Array.isArray(question.correctAnswer)) {
        const answerLetters = question.correctAnswer.map((ans) =>
          typeof ans === "number" ? String.fromCharCode(65 + ans) : ans
        );
        docContent += `${answerLetters.join(", ")}\n\n`;
      } else {
        docContent += `${question.correctAnswer}\n\n`;
      }
    } else if (question.type === "true_false") {
      docContent += "**Type:** True/False\n\n";
      docContent += `**Correct Answer:** ${question.correctAnswer}\n\n`;
    } else if (question.type === "short_answer") {
      docContent += "**Type:** Short Answer\n\n";
      docContent += "**Correct Answer:** " + question.correctAnswer + "\n\n";
    }
  });

  return docContent;
}

// Function to export test to a document file
function exportTestToDocument(test: Test, nodeName: string) {
  const formattedContent = formatTestForDocExport(test, nodeName);

  // Create a Blob with the content
  const blob = new Blob([formattedContent], { type: "text/plain" });

  // Create a download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${
    test.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
  }_test.txt`;

  // Trigger the download without affecting browser history
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Format test data for Google Docs export
function formatTestForGoogleDocs(test: Test, nodeName: string): string {
  let docContent = `# ${test.name}\n\n`;

  // Add metadata
  docContent += `**Topic:** ${nodeName || test.nodeId || "N/A"}\n`;
  docContent += `**Created:** ${formatDate(test.createdAt)}\n`;
  docContent += `**Last Updated:** ${
    formatDate(
      test.lastUpdatedAt || test.createdAt,
    )
  }\n\n`;

  // Add test description
  if (test.content) {
    docContent += `## Description\n${test.content}\n\n`;
  }

  // Add questions
  docContent += "## Questions\n\n";

  test.questions.forEach((question, index) => {
    docContent += "### Question " + (index + 1) + "\n" + question.question +
      "\n\n";

    // Add image reference if available
    if (question.imageUrl) {
      docContent += "[Image for Question " + (index + 1) + "]\n\n";
    }

    if (question.type === "multiple_choice" && question.options) {
      docContent += "**Type:** Multiple Choice\n\n";
      question.options.forEach((option, optIndex) => {
        docContent += String.fromCharCode(65 + optIndex) + ". " + option + "\n";
      });
      docContent += "\n**Correct Answer:** ";

      if (typeof question.correctAnswer === "number" && question.options) {
        const answerLetter = String.fromCharCode(65 + question.correctAnswer);
        docContent += answerLetter +
          ". " +
          question.options[question.correctAnswer] +
          "\n\n";
      } else if (Array.isArray(question.correctAnswer)) {
        const answerLetters = question.correctAnswer.map((ans) =>
          typeof ans === "number" ? String.fromCharCode(65 + ans) : ans
        );
        docContent += answerLetters.join(", ") + "\n\n";
      } else {
        docContent += question.correctAnswer + "\n\n";
      }
    } else if (question.type === "true_false") {
      docContent += "**Type:** True/False\n\n";
      docContent += "**Correct Answer:** " + question.correctAnswer + "\n\n";
    } else if (question.type === "short_answer") {
      docContent += "**Type:** Short Answer\n\n";
      docContent += "**Correct Answer:** " + question.correctAnswer + "\n\n";
    }
  });

  return docContent;
}

// Function to export test to Google Docs
function exportToGoogleDocs(test: Test, nodeName: string) {
  const formattedContent = formatTestForGoogleDocs(test, nodeName);

  // Create a temporary textarea element to copy the content
  const textarea = document.createElement("textarea");
  textarea.value = formattedContent;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  // Select and copy the content
  textarea.select();
  document.execCommand("copy");

  // Remove the temporary element
  document.body.removeChild(textarea);

  // Open a new Google Doc in a new tab to avoid history issues
  window.open("https://docs.new", "_blank");

  // Show a notification to the user
  alert(
    "Test content copied to clipboard. Please paste (Ctrl+V or Cmd+V) into the new Google Doc that opened.",
  );
}

// Format test data for HTML document export
function formatTestForHTMLExport(test: Test, nodeName: string): string {
  // Create a modern grayscale HTML document
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${test.name} - Test Document</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.5;
          color: #000;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          font-size: 24px;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
        h2 {
          font-size: 20px;
          margin-top: 24px;
          margin-bottom: 12px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 4px;
        }
        h3 {
          font-size: 16px;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .metadata {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 20px;
          font-size: 14px;
          background-color: #f9f9f9;
        }
        .metadata p {
          margin: 4px 0;
        }
        .question {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 16px;
          margin-bottom: 24px;
          background-color: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .question-image {
          max-width: 100%;
          max-height: 300px;
          margin: 10px 0;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .question-content {
          font-weight: 500;
          margin-bottom: 12px;
        }
        .options {
          margin-left: 0;
        }
        .option {
          display: flex;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .option-checkbox {
          margin-right: 8px;
          margin-top: 3px;
        }
        .option-text {
          flex: 1;
        }
        .answer {
          margin-top: 12px;
          font-weight: bold;
          border-top: 1px dashed #ddd;
          padding-top: 8px;
          display: none;
        }
        .show-answers .answer {
          display: block;
        }
        .short-answer {
          margin-top: 12px;
        }
        .short-answer-input {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 8px;
          font-family: inherit;
          font-size: 14px;
          min-height: 60px;
        }
        .true-false {
          display: flex;
          gap: 16px;
          margin-top: 12px;
        }
        .true-false label {
          display: flex;
          align-items: center;
        }
        .true-false input {
          margin-right: 6px;
        }
        .btn {
          padding: 8px 16px;
          background-color: #f2f2f2;
          color: #000;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          margin-left: 8px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn:hover {
          background-color: #e6e6e6;
          border-color: #ccc;
        }
        .controls {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
        }
        @media print {
          body {
            padding: 0;
            font-size: 12px;
          }
          .no-print {
            display: none;
          }
          .answer {
            display: none !important;
          }
          /* Reduce margins for printing */
          @page {
            margin: 1cm;
          }
          /* Ensure questions don't break across pages */
          .question {
            page-break-inside: avoid;
            border: 1px solid #000;
            box-shadow: none;
            background: none;
          }
          .metadata {
            border: 1px solid #000;
            background: none;
          }
          .short-answer-input {
            border: 1px solid #000;
            background: none;
          }
          .btn {
            display: none;
          }
        }
      </style>
      <script>
        function toggleAnswers() {
          document.body.classList.toggle('show-answers');
          const button = document.getElementById('toggle-answers');
          if (document.body.classList.contains('show-answers')) {
            button.textContent = 'Hide Answers';
          } else {
            button.textContent = 'Show Answers';
          }
        }
      </script>
    </head>
    <body>
      <div class="controls no-print">
        <button id="toggle-answers" onclick="toggleAnswers()" class="btn">
          Show Answers
        </button>
        <button onclick="window.print()" class="btn">
          Print / Save as PDF
        </button>
      </div>
      
      <h1>${test.name}</h1>
      
      <div class="metadata">
        <p><strong>Topic:</strong> ${nodeName || test.nodeId || "N/A"}</p>
        <p><strong>Created:</strong> ${formatDate(test.createdAt)}</p>
        <p><strong>Last Updated:</strong> ${
    formatDate(
      test.lastUpdatedAt || test.createdAt,
    )
  }</p>
      </div>
  `;

  // Add test description
  if (test.content) {
    htmlContent += `
      <h2>Description</h2>
      <p>${test.content}</p>
    `;
  }

  // Add questions
  htmlContent += `<h2>Questions</h2>`;

  test.questions.forEach((question, index) => {
    htmlContent += `
      <div class="question">
        <h3>Question ${index + 1}: ${question.question}</h3>
    `;

    // Add image if available
    if (question.imageUrl) {
      htmlContent += `
        <div>
          <img src="${question.imageUrl}" alt="Question ${
        index + 1
      } visual" class="question-image">
        </div>
      `;
    }

    if (question.type === "multiple_choice" && question.options) {
      htmlContent += `<div class="options">`;

      question.options.forEach((option, optIndex) => {
        const optionLetter = String.fromCharCode(65 + optIndex);
        htmlContent += `
          <div class="option">
            <input type="checkbox" id="q${index}_opt${optIndex}" class="option-checkbox">
            <label for="q${index}_opt${optIndex}" class="option-text">${optionLetter}. ${option}</label>
          </div>
        `;
      });

      htmlContent += `</div>`;

      htmlContent += `<div class="answer">Correct Answer: `;

      if (typeof question.correctAnswer === "number" && question.options) {
        const answerLetter = String.fromCharCode(65 + question.correctAnswer);
        htmlContent += `${answerLetter}. ${
          question.options[question.correctAnswer]
        }`;
      } else if (Array.isArray(question.correctAnswer)) {
        const answerLetters = question.correctAnswer.map((ans) =>
          typeof ans === "number" ? String.fromCharCode(65 + ans) : ans
        );
        htmlContent += `${answerLetters.join(", ")}`;
      } else {
        htmlContent += `${question.correctAnswer}`;
      }

      htmlContent += `</div>`;
    } else if (question.type === "true_false") {
      htmlContent += `
        <div class="true-false">
          <label>
            <input type="radio" name="q${index}_tf" value="true"> True
          </label>
          <label>
            <input type="radio" name="q${index}_tf" value="false"> False
          </label>
        </div>
        <div class="answer">Correct Answer: ${question.correctAnswer}</div>
      `;
    } else if (question.type === "short_answer") {
      htmlContent += `
        <div class="short-answer">
          <textarea class="short-answer-input" placeholder="Write your answer here..."></textarea>
        </div>
        <div class="answer">Correct Answer: ${question.correctAnswer}</div>
      `;
    }

    htmlContent += `</div>`;
  });

  // Close HTML document
  htmlContent += `
    </body>
    </html>
  `;

  return htmlContent;
}

// Function to export test to a styled HTML document in a new tab
function openTestInNewTab(test: Test, nodeName: string) {
  try {
    const formattedContent = formatTestForHTMLExport(test, nodeName);

    // Open a new window and write the HTML content directly to it
    const newWindow = window.open("", "_blank");

    if (!newWindow) {
      alert("Please allow pop-ups to view the exported test document.");
      return false;
    }

    // Write the HTML content to the new window
    newWindow.document.write(formattedContent);
    newWindow.document.close();

    // Focus the new window
    newWindow.focus();

    return true; // Export successful
  } catch (error) {
    console.error("Failed to open test document:", error);
    alert("Failed to open test document. Please try again.");
    return false; // Export failed
  }
}

export default function TestsListIsland() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodesMap, setNodesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load all tests
    import("../../../../components/tests/store.ts").then((module) => {
      setTests(module.tests.value);
      setLoading(false);
    });

    // Get node names for the test references
    if (graphStore.graphData.value?.items) {
      const nodeMap: Record<string, string> = {};
      for (const node of graphStore.graphData.value.items) {
        // Access the item property directly from the graph node
        if (node.item) {
          nodeMap[node.item] = node.item;
        }
      }
      setNodesMap(nodeMap);
    }
  }, []);

  const handleGoToGraph = () => {
    window.location.href = "/graph";
  };

  const handleStartTest = (testId: string) => {
    window.location.href = `/tests/view/${testId}`;
  };

  const handleCreateTest = () => {
    window.location.href = "/tests/compose";
  };

  const handleExportToDocument = (e: Event, test: Test) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    try {
      const nodeName = test.nodeId ? nodesMap[test.nodeId] || "" : "";
      const success = openTestInNewTab(test, nodeName);

      if (!success) {
        console.error("Export failed");
      }
    } catch (error) {
      console.error("Error during export:", error);
      alert(
        "An error occurred while opening the test document. Please try again.",
      );
    }
  };

  return (
    <div class="container mx-auto px-6 py-10 h-screen overflow-auto">
      <div class="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Tests</h1>
          <p class="mt-2 text-gray-600">Create and manage your tests</p>
        </div>
        <div class="flex gap-4">
          <Button onClick={handleCreateTest}>
            <IconPlus class="w-5 h-5 mr-2" />
            Create Test
          </Button>
          <Button variant="outline" onClick={handleGoToGraph}>
            <IconBook class="w-5 h-5 mr-2" />
            Go to Graph
          </Button>
        </div>
      </div>

      <div class="">
        {loading
          ? <div class="text-gray-600">Loading tests...</div>
          : tests.length === 0
          ? (
            <div class="text-center py-12">
              <h3 class="text-lg font-medium text-gray-900 mb-2">
                No tests yet
              </h3>
              <p class="text-gray-600 mb-4">
                Get started by creating your first test
              </p>
              <Button variant="primary" onClick={handleCreateTest}>
                Create Test
              </Button>
            </div>
          )
          : (
            <div class="space-y-3">
              {tests.map((test) => (
                <div
                  key={test.id}
                  class="group border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-all px-4 py-3 rounded-md flex items-center cursor-pointer"
                  onClick={() => handleStartTest(test.id)}
                  role="button"
                  aria-label={`Take test: ${test.name}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleStartTest(test.id);
                    }
                  }}
                >
                  <div class="flex-1 min-w-0 mr-4">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h2 class="text-lg font-bold text-gray-800">
                        {test.name}
                      </h2>
                      <span class="bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded-full">
                        {test.questions.length} q
                      </span>
                    </div>
                    <div class="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      <span class="flex items-center gap-1">
                        <IconCalendar class="w-4 h-4" />
                        {formatDate(test.createdAt)}
                      </span>
                      {test.nodeId && (
                        <span class="flex items-center gap-1">
                          <IconTag class="w-4 h-4" />
                          {nodesMap[test.nodeId] || test.nodeId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div class="flex-shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      class="flex items-center justify-center opacity-80 hover:opacity-100 bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-600 hover:text-gray-800 transition-colors"
                      title="View Test Document"
                      onClick={(e) => handleExportToDocument(e, test)}
                      aria-label="View Test Document"
                    >
                      <IconFileExport class="w-5 h-5" />
                    </button>

                    <a
                      class="flex items-center justify-center opacity-80 hover:opacity-100 bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-600 hover:text-gray-800 transition-colors"
                      title="Edit Test"
                      href={`/tests/compose/${test.id}`}
                      aria-label="Edit Test"
                    >
                      <IconEdit class="w-5 h-5" />
                    </a>

                    <button
                      type="button"
                      class="flex items-center justify-center opacity-80 group-hover:opacity-100 bg-primary-100 group-hover:bg-primary-600 p-2 rounded-full text-primary-600 group-hover:text-white transition-colors"
                      title="Take Test"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTest(test.id);
                      }}
                    >
                      <IconPlayerPlay class="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
