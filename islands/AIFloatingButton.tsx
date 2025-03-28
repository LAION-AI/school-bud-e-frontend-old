import { useEffect, useRef, useState } from "preact/hooks";
import { useSignal, useSignalEffect } from "@preact/signals";
import { IconMicrophone, IconMessageCircle, IconVolume, IconLoader2, IconX, IconPlus, IconArrowRight } from "@tabler/icons-preact";
import { settings } from "../components/chat/store.ts";
import { getLLMResponse } from "./chat/getLLMResponse.ts";
import ChatHistory from "../components/chat/ChatHistory.tsx";
import { messages as storeMessages, addMessage, startNewChat } from "../components/chat/store.ts";
import { startStream } from "../components/chat/stream.ts";
import { IS_BROWSER } from "$fresh/runtime.ts";

type ButtonState = "idle" | "mode_select" | "chat" | "listening" | "processing" | "responding";

export default function AIFloatingButton() {
  const [buttonState, setButtonState] = useState<ButtonState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isProcessing = useSignal(false);

  // Don't render on chat pages
  const isOnChatPage = IS_BROWSER ? location.pathname.startsWith('/chat') : false;
  if (isOnChatPage) return null;

  // Voice recording functions
  const startRecording = async () => {
    try {
      setButtonState("listening");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await processAudio(audioBlob);
      };
      
      mediaRecorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      setButtonState("idle");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setButtonState("processing");
  };

  // Chat functions
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleChatSubmit = async () => {
    const userMessage = inputRef.current?.value.trim();
    if (!userMessage || isProcessing.value) return;

    inputRef.current.value = "";
    addMessage({ role: "user", content: userMessage });
    setTimeout(scrollToBottom, 0);
    
    isProcessing.value = true;

    try {
      await startStream(userMessage, undefined, []);
      setTimeout(scrollToBottom, 0);
    } catch (error) {
      console.error("Chat error:", error);
      addMessage({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      });
    } finally {
      isProcessing.value = false;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  // Shared functions
  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      
      const serverConfig = settings.peek();
      formData.append("sttUrl", serverConfig.sttUrl);
      formData.append("sttKey", serverConfig.sttKey);
      formData.append("sttModel", serverConfig.sttModel);
      
      const sttResponse = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });
      
      if (!sttResponse.ok) throw new Error("Failed to transcribe audio");
      
      const transcript = await sttResponse.text();
      const response = await getLLMResponse(transcript);
      await playResponse(response);
    } catch (error) {
      console.error("Error processing audio:", error);
      setButtonState("idle");
    }
  };

  const playResponse = async (text: string) => {
    try {
      setButtonState("responding");
      
      const ttsResponse = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          textPosition: `stream${1}`,
          voice: "alloy",
          ttsKey: settings.value.ttsKey,
          ttsUrl: settings.value.ttsUrl,
          ttsModel: settings.value.ttsModel,
        }),
      });
      
      if (!ttsResponse.ok) throw new Error("Failed to convert text to speech");
      
      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }
      
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.onended = () => {
        setButtonState("idle");
      };
      
      audioPlayerRef.current.onerror = () => {
        setButtonState("idle");
      };
      
      await audioPlayerRef.current.play();
    } catch (error) {
      console.error("Error playing response:", error);
      setButtonState("idle");
    }
  };

  const handleButtonClick = () => {
    switch (buttonState) {
      case "idle":
        setButtonState("mode_select");
        break;
      case "mode_select":
      case "chat":
        setButtonState("idle");
        break;
      case "listening":
        stopRecording();
        break;
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && buttonState === "chat") setButtonState("idle");
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [buttonState]);

  const getButtonContent = () => {
    switch (buttonState) {
      case "idle":
        return <IconMessageCircle size={24} />;
      case "mode_select":
        return <IconX size={24} />;
      case "listening":
        return <IconMicrophone size={24} />;
      case "processing":
        return <IconLoader2 size={24} style={{ animation: "spin 1s linear infinite" }} />;
      case "responding":
        return <IconVolume size={24} />;
      case "chat":
        return <IconX size={24} />;
    }
  };

  const getButtonClass = (isActive: boolean) => `
    flex items-center justify-center
    rounded-full
    transition-all duration-300 ease-in-out
    border-white border-4
    ${isActive ? "bg-gradient-to-r from-blue-500 to-purple-600" : "bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600"}
    text-white
    w-[50px] h-[50px]
    ${isActive ? "shadow-[0_0_15px_rgba(0,123,255,0.8),0_0_30px_rgba(255,0,0,0.4),0_0_45px_rgba(0,255,0,0.3)]" : "shadow-[0_4px_12px_rgba(0,0,0,0.25)]"}
  `;

  return (
    <div class="fixed md:bottom-4 bottom-20 right-4 z-[9999]">
      <div class="relative">
        {buttonState === "chat" && (
          <div class="absolute bottom-[80px] md:bottom-[80px] right-0 bg-white rounded-lg shadow-xl w-[calc(100vw-32px)] md:w-96 h-[60vh] md:h-[500px] flex flex-col overflow-hidden border border-gray-300">
            <div class="p-3 bg-white border-b border-gray-200 flex justify-between items-center">
              <h3 class="font-medium text-gray-800 flex items-center gap-2">
                <IconMessageCircle size={18} className="text-blue-500" />
                Chat Assistant
              </h3>
              <button
                type="button"
                onClick={() => startNewChat()}
                class="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Start new chat"
                title="Start new chat"
              >
                <IconPlus size={16} />
              </button>
            </div>

            <div ref={messagesContainerRef} class="flex-1 overflow-y-auto p-4 bg-gray-50">
              <ChatHistory messages={storeMessages.value} />
            </div>

            <div class="p-3 bg-white border-t border-gray-200">
              <div class="flex rounded-lg border border-gray-300 overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                <textarea
                  ref={inputRef}
                  placeholder="Type your message..."
                  class="flex-1 p-2 resize-none min-h-[40px] max-h-24 focus:outline-none"
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit();
                    }
                  }}
                  disabled={isProcessing.value}
                />
                <button
                  type="button"
                  onClick={handleChatSubmit}
                  disabled={isProcessing.value}
                  class={`px-3 flex items-center justify-center ${
                    isProcessing.value
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                  aria-label="Send message"
                >
                  <IconArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div class="bg-gradient-to-r from-blue-400/20 to-purple-500/20 backdrop-blur-sm p-2 rounded-full flex items-center gap-3">
          <button
            type="button"
            onClick={() => buttonState === "chat" ? setButtonState("idle") : setButtonState("chat")}
            class={getButtonClass(buttonState === "chat")}
            aria-label="Chat mode"
          >
            <IconMessageCircle size={20} />
          </button>
          
          <div class="w-px h-8 bg-white/20" />
          
          <button
            type="button"
            onMouseDown={() => buttonState === "idle" && startRecording()}
            onMouseUp={() => buttonState === "listening" && stopRecording()}
            disabled={buttonState === "processing" || buttonState === "responding"}
            class={getButtonClass(buttonState === "listening" || buttonState === "processing" || buttonState === "responding")}
            aria-label="Voice mode"
          >
            {buttonState === "listening" ? <IconMicrophone size={20} /> :
             buttonState === "processing" ? <IconLoader2 size={20} style={{ animation: "spin 1s linear infinite" }} /> :
             buttonState === "responding" ? <IconVolume size={20} /> :
             <IconMicrophone size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
} 