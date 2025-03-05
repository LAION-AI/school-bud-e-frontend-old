import { Button } from "../../../../components/Button.tsx";

interface VideoControlsProps {
  onCreateNew: () => void;
}

export default function VideoControls({ onCreateNew }: VideoControlsProps) {
  return (
    <div className="bg-gray-100/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
      <div className="flex flex-wrap gap-3">
        <Button 
          type="button"
          className="bg-green-500 hover:bg-green-600 transition-colors px-5 py-2 rounded-md font-medium flex items-center gap-2 text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <title>Play icon</title>
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Play
        </Button>
        <Button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 transition-colors px-5 py-2 rounded-md font-medium flex items-center gap-2 text-gray-800"
          onClick={onCreateNew}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <title>Create icon</title>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Create New
        </Button>
        <Button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 transition-colors px-5 py-2 rounded-md font-medium flex items-center gap-2 text-gray-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <title>Edit icon</title>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Edit
        </Button>
        <Button
          type="button"
          className="bg-gray-200 hover:bg-gray-300 transition-colors px-5 py-2 rounded-md font-medium flex items-center gap-2 text-gray-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <title>Save icon</title>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Save
        </Button>
      </div>
    </div>
  );
} 