import { Button } from "../components/Button.tsx";

export default function Error404() {
  return (
    <>
      <head>
        <title>404 - Page not found</title>
      </head>
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="max-w-md w-full px-6 py-8 bg-white rounded-lg shadow-md">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p class="text-xl font-medium text-gray-700 mb-2">Page not found</p>
            <p class="text-gray-500 mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <a href="/">
              <Button variant="primary">Return Home</Button>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
