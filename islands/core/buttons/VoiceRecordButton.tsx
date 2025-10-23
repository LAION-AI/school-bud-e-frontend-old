import { useEffect, useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "fresh/runtime";
import type { JSX } from "preact";
import { Mic } from "lucide-preact";
import { addMessage, settings } from "../../../components/chat/store.ts";
import { experimental_transcribe } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onend: (() => void) | null;
  addEventListener: (
    type: string,
    callback: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
}

/**
 * VoiceRecordButton component.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Function} props.onFinishRecording - Callback function called when recording is finished. It receives the transcript as a parameter.
 * @param {Function} props.onInterimTranscript - Callback function called when interim transcript is available. It receives the interim transcript as a parameter.
 * @param {number} props.resetTranscript - A number used to trigger a reset of the transcript.
 * @param {string} props.sttUrl - The URL for the speech-to-text service.
 * @param {string} props.sttKey - The API key for the speech-to-text service.
 * @param {string} props.sttModel - The model to use for speech-to-text conversion.
 * @returns {JSX.Element} The VoiceRecordButton component.
 */
function VoiceRecordButton({
  onFinishRecording,
  onInterimTranscript,
  resetTranscript,
  shopApiKey,
}: {
  onFinishRecording: (transcript: string) => void;
  onInterimTranscript: (transcript: string) => void;
  resetTranscript: number;
  shopApiKey: string;
}): JSX.Element {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // deno-lint-ignore no-explicit-any
  (globalThis as any).SpeechRecognition =
    // deno-lint-ignore no-explicit-any
    (globalThis as any).SpeechRecognition ||
    // deno-lint-ignore no-explicit-any
    (globalThis as any).webkitSpeechRecognition;

  useEffect(() => {
    if (resetTranscript > 0) {
      console.log("Resetting transcript due to reset signal change.");
    }
    restartRecording();
  }, [resetTranscript]);

  function restartRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      // deno-lint-ignore no-explicit-any
      recognitionRef.current = new (globalThis as any).SpeechRecognition();
      (recognitionRef.current as SpeechRecognition).continuous = false;
      (recognitionRef.current as SpeechRecognition).lang = "de-DE";
      (recognitionRef.current as SpeechRecognition).interimResults = true;
      (recognitionRef.current as SpeechRecognition).onend = onEnd;
      (recognitionRef.current as SpeechRecognition).addEventListener(
        "result",
        onSpeak,
      );
      (recognitionRef.current as SpeechRecognition).start();
      setIsRecording(true);
    }
  }

  async function toggleRecording() {
    console.log("Current recording state:", isRecording);

    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording - set state first
      setIsRecording(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });
          audioChunksRef.current = [];
          await sendAudioToServer(audioBlob);
        };

        mediaRecorder.start();
      } catch (error) {
        console.error("Error starting recording:", error);
        setIsRecording(false); // Reset state if there's an error
      }
    }
  }

  const sendAudioToServer = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    console.log(settings.peek());
    let serverUrl = settings.peek().sttUrl;
    let modelName = settings.peek().sttModel;
    const sttKey = settings.peek().sttKey;

    if (sttKey.startsWith("gsk_")) {
      serverUrl = serverUrl === ""
        ? "https://api.groq.com/openai/v1/audio/transcriptions"
        : serverUrl;
      modelName = modelName === "" ? "whisper-large-v3-turbo" : modelName;
    }

    formData.append("sttUrl", serverUrl);
    formData.append("sttKey", sttKey);
    formData.append("sttModel", modelName);
    formData.append("shopApiKey", shopApiKey);

    try {
      const openai = createOpenAI({
        apiKey: settings.peek().apiKey,
        baseURL: "https://server.budecredits.de",
      });
      // Convert the Blob to a DataURL as a Uint8Array base64 string for compatibility
      const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            // Remove the data:...;base64, prefix to get only the base64 string
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const audioBase64 = await blobToBase64(audioBlob);

      const formDataAudio = formData.get("audio") as File;
      const arrayBuffer = await formDataAudio.arrayBuffer()
      const audio = new Uint8Array(arrayBuffer)
      const result = await experimental_transcribe({
        model: openai.transcription("openai/whisper-1"),
        audio: audio,
      });
      console.log(result);

      if (result.text) {
        console.log("Audio uploaded successfully");
        console.log("Text from VoiceRecordButton:", result.text);
        onFinishRecording(result.text);
      } else {
        console.error("Failed to upload audio", result.warnings);
        addMessage({
          role: "assistant",
          content: `❌ **Error**: ${result.warnings}`,
        });
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  };

  function onEnd() {
    console.log("Speech recognition has stopped. Starting again ...");
    setIsRecording(false);
    // restartRecording();
  }

  const prependToTranscript = "";

  // deno-lint-ignore no-explicit-any
  function onSpeak(event: any) {
    // console.log(resetTranscript);
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        console.log("Final transcript: ", event.results[i][0].transcript);
        interimTranscript = event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    // Here, you call onInterimTranscript with the interimTranscript
    if (interimTranscript) {
      console.log("Interim transcript: ", prependToTranscript);
      onInterimTranscript(prependToTranscript + interimTranscript);
    }
  }

  return (
    <button
      onClick={toggleRecording}
      disabled={!IS_BROWSER}
      class={`transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 ${
        isRecording
          ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
          : "border border-gray-200 hover:bg-gray-100"
      }`}
      type="button"
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      <Mic
        class={`icon w-5 h-5 ${isRecording ? "text-white" : "text-gray-500"}`}
      />
    </button>
  );
}

export default VoiceRecordButton;
