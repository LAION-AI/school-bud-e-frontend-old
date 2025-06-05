import type { Story } from "./types.ts";

interface StoryLibraryProps {
  stories: Story[];
  selectedStory: Story | null;
  onSelectStory: (story: Story) => void;
}

export default function StoryLibrary({
  stories,
  selectedStory,
  onSelectStory,
}: StoryLibraryProps) {
  return (
    <div className="bg-gray-100/90 backdrop-blur-sm rounded-xl p-5 border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Your Stories</h2>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {stories.length > 0
          ? (
            stories.map((story) => (
              <button
                key={story.id}
                type="button"
                className={`${
                  selectedStory?.id === story.id
                    ? "bg-gray-300"
                    : "bg-gray-200/80 hover:bg-gray-300"
                } transition-colors p-3 rounded-lg cursor-pointer border border-gray-300 flex items-center gap-3 w-full text-left`}
                onClick={() => onSelectStory(story)}
                aria-pressed={selectedStory?.id === story.id}
              >
                <div
                  className="w-16 h-16 bg-gray-300 rounded-md flex-shrink-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${story.previewImage}')`,
                  }}
                />
                <div>
                  <h3 className="font-medium text-gray-900">{story.title}</h3>
                  <p className="text-sm text-gray-600">
                    Created {story.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))
          )
          : (
            <div className="text-center py-8 text-gray-500">
              <p>No stories yet</p>
              <p className="text-sm mt-2">
                Create your first story to see it here
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
