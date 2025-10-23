import { Edit, Gavel, Play, Plus } from "lucide-preact";
import { Button } from "../../../../../components/Button.tsx";

interface VideoControlsProps {
  onCreateNew: () => void;
}

export default function VideoControls({ onCreateNew }: VideoControlsProps) {
  return (
    <div className="backdrop-blur-sm rounded-xl p-4 border border-gray-200">
      <div className="flex flex-wrap gap-3">
        <Button variant="primary">
          <Play />
          Play
        </Button>
        <Button
          variant="secondary"
          onClick={onCreateNew}
        >
          <Plus />
          Create New
        </Button>
        <Button variant="secondary">
          <Edit />
          Edit
        </Button>
        <Button variant="secondary">
          <Gavel />
          Save
        </Button>
        <Button variant="secondary">
          <Edit />
          Edit
        </Button>
      </div>
    </div>
  );
}
