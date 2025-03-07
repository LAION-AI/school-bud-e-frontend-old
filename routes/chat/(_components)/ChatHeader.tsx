import { JSX } from "preact";

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
}

export default function ChatHeader({ title, subtitle }: ChatHeaderProps): JSX.Element {
  return (
    <div class="bg-white border-b border-gray-200 py-4 px-6">
      <h1 class="text-2xl font-bold text-gray-800">{title}</h1>
      {subtitle && (
        <p class="text-gray-600 mt-1">{subtitle}</p>
      )}
    </div>
  );
} 