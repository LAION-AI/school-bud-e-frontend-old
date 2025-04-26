import { Button } from "../../components/Button.tsx";

export default function CheckTestsPage() {
  return (
    <div class="container mx-auto px-6 py-8 max-w-4xl">
      <div class="overflow-hidden">
        <div class="pb-5">
          <h1 class="text-3xl font-bold text-gray-900">Check Tests</h1>
          <p class="mt-2 text-gray-600">Upload and verify test answers</p>
        </div>

        <div class="space-y-6">
          <div class="bg-gray-50 rounded-lg p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">
              Upload Documents
            </h2>
            <form class="space-y-4">
              <div>
                <label
                  htmlFor="test-pdf"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Test Document (PDF)
                </label>
                <input
                  id="test-pdf"
                  type="file"
                  accept=".pdf"
                  class="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="answers-pdf"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Answer Sheet (PDF)
                </label>
                <input
                  id="answers-pdf"
                  type="file"
                  accept=".pdf"
                  class="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="grading-scheme"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Grading Scheme
                </label>
                <select
                  id="grading-scheme"
                  class="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="points">Points Based</option>
                  <option value="percentage">Percentage Based</option>
                  <option value="letter">Letter Grade</option>
                </select>
              </div>
              <Button>Check Answers</Button>
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
