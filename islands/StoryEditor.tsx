import { useEffect, useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
// import { editStore } from "../components/video-novel/edit-store.ts";
import { useSignal } from "@preact/signals";
const editStore = {} as any;

interface StoryEditorProps {
  originalHash: string;
  segmentId: string;
  initialContent: string;
  onEditComplete?: (editHash: string) => void;
}

export default function StoryEditor(
  { originalHash, segmentId, initialContent, onEditComplete }: StoryEditorProps,
) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const editSession = useSignal(editStore.getEditSession());

  // Load initial content if not provided
  useEffect(() => {
    const loadContent = async () => {
      if (!initialContent) {
        try {
          const response = await fetch(
            `http://localhost:8083/segments/${originalHash}/segment-${segmentId}`,
          );
          if (!response.ok) throw new Error("Failed to load segment content");
          const data = await response.json();
          setContent(data.content);
        } catch (error) {
          console.error("Error loading segment content:", error);
        }
      }
      setIsLoading(false);
    };

    loadContent();
  }, [originalHash, segmentId, initialContent]);

  // Poll for edit status when we have an active session
  useEffect(() => {
    let interval: number | undefined;
    const session = editSession.value;

    if (
      session?.editHash && session.status !== "completed" &&
      session.status !== "error"
    ) {
      interval = setInterval(() => {
        if (session.editHash) {
          editStore.checkEditStatus(session.editHash);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [editSession.value]);

  // Notify parent when edit is complete
  useEffect(() => {
    const session = editSession.value;
    if (session?.status === "completed" && onEditComplete && session.editHash) {
      onEditComplete(session.editHash);
    }
  }, [editSession.value, onEditComplete]);

  const handleEdit = async () => {
    if (!content.trim()) return;

    setIsEditing(true);
    try {
      await editStore.editStorySegment(originalHash, segmentId, content);
    } catch (error) {
      console.error("Failed to edit story:", error);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500">
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
        class="w-full h-48 p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        placeholder="Edit your story segment here..."
        disabled={isEditing}
      />

      <div class="flex items-center justify-between">
        <Button
          type="button"
          onClick={handleEdit}
          disabled={isEditing || content === initialContent || !content.trim()}
          class={`px-4 py-2 ${
            isEditing || !content.trim()
              ? "bg-gray-300"
              : "bg-amber-500 hover:bg-amber-600"
          } text-white rounded-lg transition-colors`}
        >
          {isEditing ? "Editing..." : "Save Changes"}
        </Button>

        {editSession.value && (
          <div class="text-sm">
            {editSession.value.status === "error"
              ? <p class="text-red-600">{editSession.value.error}</p>
              : <p class="text-gray-600">Status: {editSession.value.status}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
