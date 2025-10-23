import type { JSX } from "preact";
import { MessageContent } from "./MessageContent.tsx";
import { Edit, RefreshCw, Volume2 } from "lucide-preact";

interface AudioItem {
  audio: HTMLAudioElement;
  played: boolean;
}

type AudioFileDict = Record<number, Record<number, AudioItem>>;

interface MessageProps {
  item: {
    id?: string;
    role: string;
    content: string | (string | import("../types.d.ts").Image)[];
  };
  groupIndex: number;
  currentEditIndex: number;
  audioFileDict: AudioFileDict;
  onEditAction: (groupIndex: number) => void;
  onRefreshAction: (groupIndex: number) => void;
  onSpeakAtGroupIndexAction: (groupIndex: number) => void;
}

export function Message({
  item,
  groupIndex,
  currentEditIndex,
  audioFileDict,
  onEditAction,
  onRefreshAction,
  onSpeakAtGroupIndexAction,
}: MessageProps): JSX.Element {
  return (
    <div
      class={`message-group flex flex-col group pb-2 ${
        item.role === "user" ? "items-end" : "items-start"
      }`}
    >
      <div
        class={`text-sm font-semibold flex justify-center items-center gap-1 invisible group-hover:visible bg-white rounded-xl px-2 py-1 shadow-lg ${
          item.role === "user" ? "text-primary-600" : "text-gray-600"
        }`}
      >
        {groupIndex !== 0 && (
          <button 
            onClick={() => onEditAction(groupIndex)} 
            type="button" 
            className={`p-1 rounded-md transition-colors ${
              currentEditIndex === groupIndex 
                ? "bg-primary-100 text-primary-600" 
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <Edit size={20} />
          </button>
        )}

        {item.role !== "user" && groupIndex !== 0 && (
          <button 
            onClick={() => onRefreshAction(groupIndex)} 
            type="button" 
            className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
          >
            <RefreshCw size={20} />
          </button>
        )}
        
        {item.role !== "user" && (
          <button 
            onClick={() => onSpeakAtGroupIndexAction(groupIndex)} 
            type="button" 
            className={`p-1 rounded-md transition-colors ${
              audioFileDict[groupIndex] &&
              Object.values(audioFileDict[groupIndex]).some(
                (audioFile) => !audioFile.audio.paused
              )
                ? "bg-primary-100 text-primary-600"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <Volume2 size={20} />
          </button>
        )}
      </div>
      <div
        class={`message mt-1 rounded-3xl whitespace-pre-wrap [overflow-wrap:anywhere] max-w-xl ${
          item.role === "user"
            ? "bg-primary-100 rounded-tr-md ml-auto"
            : ""
        } px-4`}
      >
        <MessageContent content={item.content} />
      </div>
    </div>
  );
}
