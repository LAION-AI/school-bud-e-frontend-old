import { PageProps } from "$fresh/server.ts";
import FloatingChat from "../../islands/chat/FloatingChat.tsx";

export default function CheckTestsPage(props: PageProps) {
  return (
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="p-6 bg-gradient-to-r from-blue-500 to-indigo-600">
          <h1 class="text-3xl font-bold text-white">Check Tests</h1>
          <p class="text-blue-100 mt-2">Upload and verify test answers</p>
        </div>
        
        <div class="p-6 space-y-6">
          <div class="bg-gray-50 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
            <form class="space-y-4">
              <div>
                <label htmlFor="test-pdf" class="block text-sm font-medium text-gray-700 mb-1">
                  Test Document (PDF)
                </label>
                <input
                  id="test-pdf"
                  type="file"
                  accept=".pdf"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="answers-pdf" class="block text-sm font-medium text-gray-700 mb-1">
                  Answer Sheet (PDF)
                </label>
                <input
                  id="answers-pdf"
                  type="file"
                  accept=".pdf"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="grading-scheme" class="block text-sm font-medium text-gray-700 mb-1">
                  Grading Scheme
                </label>
                <select
                  id="grading-scheme"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="points">Points Based</option>
                  <option value="percentage">Percentage Based</option>
                  <option value="letter">Letter Grade</option>
                </select>
              </div>
              <button
                type="submit"
                class="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                Check Answers
              </button>
            </form>
          </div>

          <div class="bg-gray-50 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Results</h2>
            <div class="text-gray-600">
              Upload your documents to see the results here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
