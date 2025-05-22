import type { JSX } from "preact";
import { MessageContent } from "./MessageContent.tsx";
import EditIcon from "./icons/EditIcon.tsx";
import RefreshIcon from "./icons/RefreshIcon.tsx";
import SpeakIcon from "./icons/SpeakIcon.tsx";
import DownloadIcon from "./icons/DownloadIcon.tsx";

interface AudioItem {
  audio: HTMLAudioElement;
  played: boolean;
}

type AudioFileDict = Record<number, Record<number, AudioItem>>;

interface MessageProps {
  item: {
    role: string;
    content: string | string[];
  };
  groupIndex: number;
  currentEditIndex: number;
  audioFileDict: AudioFileDict;
  onEditAction: (groupIndex: number) => void;
  onRefreshAction: (groupIndex: number) => void;
  onSpeakAtGroupIndexAction: (groupIndex: number) => void;
  onDownloadAudio: (
    audioDict: Record<string, { audio: HTMLAudioElement }>,
  ) => void;
}

export function Message({
  item,
  groupIndex,
  currentEditIndex,
  audioFileDict,
  onEditAction,
  onRefreshAction,
  onSpeakAtGroupIndexAction,
  onDownloadAudio,
}: MessageProps): JSX.Element {
  return (
    <div
      class={`message-group flex flex-col group pb-2 ${
        item.role === "user" ? "items-end" : "items-start"
      }`}
    >
      <span
        class={`text-sm font-semibold flex justify-center items-center invisible group-hover:visible ${
          item.role === "user" ? "text-primary-600" : "text-gray-600"
        }`}
      >
        {groupIndex !== 0 && (
          <button onClick={() => onEditAction(groupIndex)} type="button">
            <EditIcon isActive={currentEditIndex === groupIndex} />
          </button>
        )}

        {item.role !== "user" && groupIndex !== 0 && (
          <button onClick={() => onRefreshAction(groupIndex)} type="button">
            <RefreshIcon />
          </button>
        )}
        {item.role !== "user" && (
          <button
            onClick={() => onSpeakAtGroupIndexAction(groupIndex)}
            type="button"
          >
            <SpeakIcon
              isPlaying={audioFileDict[groupIndex] &&
                Object.values(audioFileDict[groupIndex]).some(
                  (audioFile) => !audioFile.audio.paused,
                )}
            />
          </button>
        )}
        {item.role !== "user" &&
          audioFileDict[groupIndex] &&
          Object.keys(audioFileDict[groupIndex]).length > 0 && (
          <button
            onClick={() => onDownloadAudio(audioFileDict[groupIndex])}
            type="button"
          >
            <DownloadIcon />
          </button>
        )}
      </span>
      <div
        class={`message mt-1 rounded-3xl whitespace-pre-wrap [overflow-wrap:anywhere] max-w-xl ${
          item.role === "user"
            ? "bg-primary-100 rounded-tr-md ml-auto"
            : "bg-gray-100"
        } p-4`}
      >
        <MessageContent content={item.content} />
      </div>
    </div>
  );
}
