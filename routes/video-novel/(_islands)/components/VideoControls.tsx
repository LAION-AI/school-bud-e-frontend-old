import {
  IconEdit,
  IconGavel,
  IconPlayerPlay,
  IconPlus,
} from "@tabler/icons-preact";
import { Button } from "../../../../components/Button.tsx";

interface VideoControlsProps {
  onCreateNew: () => void;
}

export default function VideoControls({ onCreateNew }: VideoControlsProps) {
  return (
    <div className="backdrop-blur-sm rounded-xl p-4 border border-gray-200">
      <div className="flex flex-wrap gap-3">
        <Button variant="primary">
          <IconPlayerPlay />
          Play
        </Button>
        <Button
          variant="secondary"
          onClick={onCreateNew}
        >
          <IconPlus />
          Create New
        </Button>
        <Button variant="secondary">
          <IconEdit />
          Edit
        </Button>
        <Button variant="secondary">
          <IconGavel />
          Save
        </Button>
        <Button variant="secondary">
          <IconEdit />
          Edit
        </Button>
      </div>
    </div>
  );
}
