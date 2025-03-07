export default function Tutorials() {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Getting Started with Free API Keys</h1>
      
      <div class="space-y-8">
        <section>
          <h2 class="text-2xl font-semibold mb-4">Google AI Studio</h2>
          <div class="bg-white p-6 rounded-lg shadow">
            <p class="mb-4">Google AI Studio offers a generous free tier for getting started with AI:</p>
            <ol class="list-decimal ml-6 space-y-2">
              <li>Visit <a href="https://makersuite.google.com/app/apikey" class="text-primary-500 hover:underline">Google AI Studio</a></li>
              <li>Sign in with your Google account</li>
              <li>Click "Create API Key"</li>
              <li>Copy your API key and use it in School Bud-E</li>
            </ol>
            <p class="mt-4 text-sm text-gray-600">Note: Free tier has usage limits but is perfect for testing and small projects.</p>
          </div>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-4">OpenAI</h2>
          <div class="bg-white p-6 rounded-lg shadow">
            <p class="mb-4">OpenAI provides free credits for new accounts:</p>
            <ol class="list-decimal ml-6 space-y-2">
              <li>Go to <a href="https://platform.openai.com/api-keys" class="text-primary-500 hover:underline">OpenAI Platform</a></li>
              <li>Create an account or sign in</li>
              <li>Navigate to API Keys section</li>
              <li>Create a new API key</li>
            </ol>
            <p class="mt-4 text-sm text-gray-600">New accounts receive free credits to get started.</p>
          </div>
        </section>

        <section>
          <h2 class="text-2xl font-semibold mb-4">Best Practices</h2>
          <div class="bg-white p-6 rounded-lg shadow">
            <ul class="list-disc ml-6 space-y-2">
              <li>Keep your API keys secure and never share them</li>
              <li>Monitor your usage to stay within free tier limits</li>
              <li>Consider using different keys for development and production</li>
              <li>Regularly rotate your API keys for security</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
} 