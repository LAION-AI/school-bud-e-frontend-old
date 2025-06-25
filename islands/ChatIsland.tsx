// The ChatIsland component is responsible for managing the chat messages and audio playback.
import ChatTemplate from "./ChatTemplate.tsx";
import ChatWarning from "../components/Warning.tsx";

// Necessary for streaming service
import { useEffect, useRef, useState } from "preact/hooks";

import { readAlways, stopList, handleOnSpeakAtGroupIndexAction, audioFileDict, clearCurrentChatAudioCache } from "../components/chat/speech.ts";
import {
  chats,
  chatSuffix,
  currentEditIndex,
  handleEditAction,
  handleRefreshAction,
  messages,
} from "../components/chat/store.ts";
import { initTourGuide } from "../utils/tourGuide.ts";

// Define the AudioItem interface if not already defined
interface AudioItem {
  audio: HTMLAudioElement;
  played: boolean;
}

// Define the AudioFileDict type - now chat-aware
type AudioFileDict = Record<number, Record<number, AudioItem>>;

export default function ChatIsland({ lang, id }: { lang: string; id: string }) {
  const previousChatId = useRef<string | null>(null);
  
  // Necessary to load the chat messages from localStorage only once
  useEffect(() => {
    const chatKey = `bude-chat-${id}`;
    if (!(chatKey in chats.value)) {
      chats.value = { ...chats.value, [chatKey]: [] };
    }
    
    // If we're switching chats, clear the previous chat's audio cache from memory
    // (but keep it in the global signal for potential return)
    if (previousChatId.current && previousChatId.current !== chatKey) {
      console.log(`Switching from chat ${previousChatId.current} to ${chatKey}`);
      // Stop any currently playing audio
      stopList.value = [];
    }
    
    chatSuffix.value = id;
    previousChatId.current = chatKey;
  }, [id]);

  // Get current chat audio dictionary from the global signal
  const getCurrentChatAudio = (): AudioFileDict => {
    const currentChatId = `bude-chat-${chatSuffix.value}`;
    return audioFileDict.value[currentChatId] || {};
  };

  const [isStreamComplete] = useState(true);
  const tourInitialized = useRef(false);

  const lastMessage = messages.value[messages.value.length - 1];
  useEffect(() => {
    if (isStreamComplete && lastMessage) {
      if ("content" in messages.value[messages.value.length - 1]) {
        let lastMessageFromBuddy: string;
        const lastMessageContent =
          messages.value[messages.value.length - 1].content;

        if (typeof lastMessageContent === "string") {
          lastMessageFromBuddy = lastMessageContent;
        } else {
          lastMessageFromBuddy = (lastMessageContent as string[]).join("");
        }

        if (lastMessageFromBuddy !== "") {
          messages.value[messages.value.length - 1]["content"] =
            lastMessageFromBuddy;
        }
      }
    }
  }, [isStreamComplete, lastMessage]);

  useEffect(() => {
    if (!readAlways.value) return;

    const currentChatAudio = getCurrentChatAudio();
    
    for (const [groupIndex, groupAudios] of Object.entries(currentChatAudio)) {
      const nextUnplayedIndex = findNextUnplayedAudio(groupAudios);

      if (nextUnplayedIndex === null) return;

      const isLatestGroup =
        Math.max(...Object.keys(currentChatAudio).map(Number)) <=
          Number(groupIndex);

      if (
        isLatestGroup &&
        canPlayAudio(
          Number(groupIndex),
          nextUnplayedIndex,
          groupAudios,
          stopList.value,
        )
      ) {
        playAudio(
          groupAudios[nextUnplayedIndex].audio,
          Number(groupIndex),
          nextUnplayedIndex,
          currentChatAudio,
        );
      }

      if (stopList.value.includes(Number(groupIndex))) {
        for (const item of Object.values(groupAudios) as AudioItem[]) {
          if (!(item as AudioItem).audio.paused) {
            (item as AudioItem).audio.pause();
            (item as AudioItem).audio.currentTime = 0;
          }
        }
      }
    }
  }, [audioFileDict.value, readAlways.value, stopList.value, chatSuffix.value]);

  // Initialize tour guide on client-side only once
  useEffect(() => {
    if (typeof window !== "undefined" && !tourInitialized.current) {
      initTourGuide();
      tourInitialized.current = true;
    }
  }, []);

  // Cleanup effect for when component unmounts
  useEffect(() => {
    return () => {
      // Stop any playing audio when component unmounts
      const currentChatAudio = getCurrentChatAudio();
      Object.values(currentChatAudio).forEach((groupAudios) => {
        Object.values(groupAudios).forEach((audioItem) => {
          if (!audioItem.audio.paused) {
            audioItem.audio.pause();
            audioItem.audio.currentTime = 0;
          }
        });
      });
    };
  }, []);

  // Helper functions for audio playback
  const findNextUnplayedAudio = (
    groupAudios: Record<number, AudioItem>,
  ): number | null => {
    const [nextUnplayed] = Object.entries(groupAudios)
      .sort(([a], [b]) => Number(a) - Number(b))
      .find(([_, item]) => !item.played) || [];
    return nextUnplayed ? Number(nextUnplayed) : null;
  };

  const canPlayAudio = (
    groupIndex: number,
    audioIndex: number,
    groupAudios: Record<number, AudioItem>,
    stopList: number[],
  ): boolean => {
    if (stopList.includes(Number(groupIndex))) return false;

    const previousAudio = groupAudios[audioIndex - 1];
    return audioIndex === 0 ||
      (previousAudio?.played && previousAudio?.audio.paused);
  };

  const playAudio = (
    audio: HTMLAudioElement,
    groupIndex: number,
    audioIndex: number,
    currentChatAudio: AudioFileDict,
  ) => {
    audio.play();
    currentChatAudio[groupIndex][audioIndex].played = true;
    // Update the global signal
    const currentChatId = `bude-chat-${chatSuffix.value}`;
    audioFileDict.value = {
      ...audioFileDict.value,
      [currentChatId]: currentChatAudio
    };
  };

  // MAIN CONTENT THAT IS RENDERED
  return (
    <div class="flex w-full h-[calc(100dvh-4rem)] md:h-screen">
      <ChatTemplate
        messages={messages.value}
        currentEditIndex={currentEditIndex.value}
        audioFileDict={getCurrentChatAudio()}
        onRefreshAction={handleRefreshAction}
        onEditAction={handleEditAction}
        onSpeakAtGroupIndexAction={handleOnSpeakAtGroupIndexAction}
      >
        <ChatWarning lang={lang} />
      </ChatTemplate>
    </div>
  );
}
