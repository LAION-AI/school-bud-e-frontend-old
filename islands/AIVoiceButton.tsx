import { useEffect, useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import type { JSX } from "preact";
import { IconMicrophone, IconVolume, IconLoader2 } from "@tabler/icons-preact";
import { settings } from "../components/chat/store.ts";
import { getLLMResponse } from "./chat/getLLMResponse.ts";

// States for the button
type ButtonState = "idle" | "listening" | "processing" | "responding";

function useAudioRecording() {
  const [buttonState, setButtonState] = useState<ButtonState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

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
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
    }
    
    setButtonState("processing");
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      
      const serverConfig = settings.peek();
      console.log(serverConfig);
      formData.append("sttUrl", serverConfig.sttUrl);
      formData.append("sttKey", serverConfig.sttKey);
      formData.append("sttModel", serverConfig.sttModel);
      
      const sttResponse = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });
      
      if (!sttResponse.ok) throw new Error("Failed to transcribe audio");
      
      // Get transcript
      const transcript = await sttResponse.text();
      
      // Wait a moment to ensure processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await getLLMResponse(transcript);
      // Play response
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

  const toggleRecording = async () => {
    if (buttonState === "idle") {
      await startRecording();
    } else if (buttonState === "listening") {
      stopRecording();
    }
  };

  return {
    buttonState,
    toggleRecording
  };
}

function AIVoiceButton(): JSX.Element {
  const { buttonState, toggleRecording } = useAudioRecording();
  
  const iconStyle = {
    width: "1.5rem", 
    height: "1.5rem",
    color: "currentColor"
  };

  const getButtonContent = () => {
    switch (buttonState) {
      case "idle":
        return null; // No icon in idle state
      case "listening":
        return <IconMicrophone style={iconStyle} />;
      case "processing":
        return (
          <IconLoader2 
            style={{ 
              ...iconStyle,
              animation: "spin 1s linear infinite" 
            }} 
          />
        );
      case "responding":
        return <IconVolume style={iconStyle} />;
    }
  };

  const getButtonClass = () => `
    flex items-center justify-center
    rounded-full
    transition-all duration-300 ease-in-out
    border-white border-4
    ${buttonState === "idle" ? "bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600" : ""}
    ${buttonState === "listening" ? "bg-red-600 hover:bg-red-700" : ""}
    ${buttonState === "processing" ? "bg-purple-600" : ""}
    ${buttonState === "responding" ? "bg-green-600" : ""}
    ${(buttonState === "listening" || buttonState === "responding") ? 
        "shadow-[0_0_15px_rgba(0,123,255,0.8),0_0_30px_rgba(255,0,0,0.4),0_0_45px_rgba(0,255,0,0.3)]" : 
        "shadow-[0_4px_12px_rgba(0,0,0,0.25)]"}
  `;

  const getAriaLabel = () => {
    switch (buttonState) {
      case "idle": return "Start voice recording";
      case "listening": return "Stop recording";
      case "processing": return "Processing audio";
      case "responding": return "Playing response";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[70px] h-[70px] block pointer-events-auto">
      <button
        onClick={toggleRecording}
        disabled={!IS_BROWSER || buttonState === "processing" || buttonState === "responding"}
        type="button"
        class={getButtonClass()}
        style={{
          position: "relative",
          zIndex: 2,
          width: "70px",
          height: "70px",
          cursor: "pointer"
        }}
        aria-label={getAriaLabel()}
      >
        {getButtonContent()}
      </button>
    </div>
  );
}

export default AIVoiceButton; 