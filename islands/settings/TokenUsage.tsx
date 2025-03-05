import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

interface TokenUsageStats {
  totalInput: number;
  totalOutput: number;
  history: Array<{
    id: string;
    date: string;
    model: string;
    input: number;
    output: number;
  }>;
}

export default function TokenUsage({ lang = "en" }: { lang?: string }) {
  const tokenUsage = useSignal<TokenUsageStats | null>(null);
  const isLoading = useSignal(true);
  const error = useSignal<string | null>(null);

  useEffect(() => {
    // In a real implementation, this would fetch actual data from an API
    // For now, we're simulating data loading with dummy data
    const loadData = async () => {
      try {
        isLoading.value = true;
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dummy data with unique IDs
        const dummyData: TokenUsageStats = {
          totalInput: 12458,
          totalOutput: 35672,
          history: [
            { id: "1", date: "2023-06-01", model: "gemini-1.5-flash", input: 1245, output: 3567 },
            { id: "2", date: "2023-06-02", model: "gemini-1.5-flash", input: 2356, output: 4789 },
            { id: "3", date: "2023-06-03", model: "gemini-1.5-pro", input: 3467, output: 8765 },
            { id: "4", date: "2023-06-04", model: "llama-3.3-70b", input: 2341, output: 7896 },
            { id: "5", date: "2023-06-05", model: "llama-3.3-70b", input: 3049, output: 10655 },
          ]
        };
        
        tokenUsage.value = dummyData;
        isLoading.value = false;
      } catch (err) {
        console.error("Failed to fetch token usage data:", err);
        error.value = "Failed to load token usage data. Please try again later.";
        isLoading.value = false;
      }
    };

    if (IS_BROWSER) {
      loadData();
    }
  }, [tokenUsage, isLoading, error]); // Add dependencies

  if (isLoading.value) {
    return (
      <div class="p-4 flex justify-center items-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error.value || !tokenUsage.value) {
    return (
      <div class="p-4 text-center text-red-500">
        {error.value || "Could not load token usage data"}
      </div>
    );
  }

  return (
    <div class="space-y-6">
      <h3 class="text-lg font-medium text-gray-900">
        {lang === "de" ? "Token-Nutzung" : "Token Usage"}
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 truncate">
              {lang === "de" ? "Gesamt Eingabe-Tokens" : "Total Input Tokens"}
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">
              {tokenUsage.value.totalInput.toLocaleString()}
            </dd>
          </div>
        </div>
        
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <dt class="text-sm font-medium text-gray-500 truncate">
              {lang === "de" ? "Gesamt Ausgabe-Tokens" : "Total Output Tokens"}
            </dt>
            <dd class="mt-1 text-3xl font-semibold text-gray-900">
              {tokenUsage.value.totalOutput.toLocaleString()}
            </dd>
          </div>
        </div>
      </div>
      
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            {lang === "de" ? "Nutzungsverlauf" : "Usage History"}
          </h3>
        </div>
        <div class="border-t border-gray-200">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {lang === "de" ? "Datum" : "Date"}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {lang === "de" ? "Modell" : "Model"}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {lang === "de" ? "Eingabe" : "Input"}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {lang === "de" ? "Ausgabe" : "Output"}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {tokenUsage.value.history.map((entry) => (
                <tr key={entry.id}>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.date}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.model}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.input.toLocaleString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.output.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="text-sm text-gray-500 italic">
        {lang === "de" 
          ? "Hinweis: Dies sind Beispieldaten zu Demonstrationszwecken." 
          : "Note: This is sample data for demonstration purposes."}
      </div>
    </div>
  );
} 