import { IconArrowLeft } from "@tabler/icons-preact";

interface TopAppBarProps {
  title: string;
  onBack?: () => void;
  backUrl?: string;
}

export default function TopAppBar({ title, onBack, backUrl }: TopAppBarProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      window.location.href = backUrl;
    } else {
      window.history.back();
    }
  };

  return (
    <div class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 md:hidden z-50">
      <div class="flex items-center h-14 px-4">
        <button
          onClick={handleBack}
          class="flex items-center justify-center w-10 h-10 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <IconArrowLeft size={24} />
        </button>
        <h1 class="flex-1 text-lg font-semibold text-gray-900 text-center pr-8">
          {title}
        </h1>
      </div>
    </div>
  );
}
