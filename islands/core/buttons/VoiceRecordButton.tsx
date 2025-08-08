import { useEffect, useRef, useState } from "preact/hooks";
import { IS_BROWSER } from "fresh/runtime";
import type { JSX } from "preact";
import { IconMicrophone } from "@tabler/icons-preact";
import { addMessage, settings } from "../../../components/chat/store.ts";
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
          // Use the actual recorder mime type if available; otherwise, let the browser infer
          const mimeType = mediaRecorderRef.current?.mimeType || undefined;
          const audioBlob = new Blob(audioChunksRef.current, mimeType ? { type: mimeType } : undefined);
          audioChunksRef.current = [];
          await transcribeAudio(audioBlob);
        };

        mediaRecorder.start();
      } catch (error) {
        console.error("Error starting recording:", error);
        setIsRecording(false); // Reset state if there's an error
      }
    }
  }

  const transcribeDirect = async (audioBlob: Blob): Promise<string | null> => {
    try {
      const serverUrl = settings.peek().sttUrl || "";
      let modelName = settings.peek().sttModel || "";
      const sttKey = settings.peek().sttKey || "";

      if (!serverUrl || !sttKey) return null; // signal to fallback

      // Apply GROQ defaults if key indicates GROQ
      if (sttKey.startsWith("gsk_")) {
        modelName = modelName === "" ? "whisper-large-v3-turbo" : modelName;
      }

      const sttFormData = new FormData();
      sttFormData.append("file", audioBlob, "recording.webm");
      sttFormData.append("model", modelName || "whisper-1");

      const resp = await fetch(serverUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sttKey}`,
        },
        body: sttFormData,
      });

      if (!resp.ok) {
        // Let caller decide to fallback
        console.warn("Direct STT call failed with status", resp.status);
        return null;
      }

      // Most STT endpoints return JSON with { text }
      const data = await resp.json().catch(async () => ({ text: await resp.text() }));
      const text = typeof data === "string" ? data : (data?.text ?? "");
      return text || "";
    } catch (err) {
      console.warn("Direct STT call errored; will fallback:", err);
      return null;
    }
  };

  const transcribeWithAiSdk = async (audioBlob: Blob): Promise<string | null> => {
    try {
      const serverUrl = settings.peek().sttUrl || "";
      let modelName = settings.peek().sttModel || "";
      const sttKey = settings.peek().sttKey || "";
      if (!sttKey) return null;

      if (sttKey.startsWith("gsk_")) {
        modelName = modelName || "whisper-large-v3-turbo";
      } else {
        modelName = modelName || "whisper-1";
      }

      // Dynamic import to avoid bundling issues when SDK isn't installed
      const { transcribe } = await import("ai");
      const useGroq = sttKey.startsWith("gsk_") || /groq/i.test(serverUrl);
      const file = new File([audioBlob], "recording.webm", { type: audioBlob.type || "audio/webm" });

      if (useGroq) {
        const { createGroq } = await import("@ai-sdk/groq");
        const groq = createGroq({ apiKey: sttKey, baseURL: serverUrl || undefined });
        // Try preferred API; fall back to generic model selector if needed
        const model: unknown = (groq as unknown as Record<string, unknown>).audioTranscription
          ? (groq as unknown as { audioTranscription: (m: string) => unknown }).audioTranscription(modelName)
          : (groq as unknown as (m: string) => unknown)(modelName);
        const result = await transcribe({ model: model as any, file });
        const text = (result as any)?.text as string | undefined;
        return text ?? null;
      } else {
        const { createOpenAI } = await import("@ai-sdk/openai");
        const openai = createOpenAI({ apiKey: sttKey, baseURL: serverUrl || undefined });
        const model: unknown = (openai as unknown as Record<string, unknown>).audioTranscription
          ? (openai as unknown as { audioTranscription: (m: string) => unknown }).audioTranscription(modelName)
          : (openai as unknown as (m: string) => unknown)(modelName);
        const result = await transcribe({ model: model as any, file });
        const text = (result as any)?.text as string | undefined;
        return text ?? null;
      }
    } catch (err) {
      console.warn("AI SDK transcribe unavailable or failed; will fallback:", err);
      return null;
    }
  };

  const transcribeViaProxy = async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const sttSettings = settings.peek();
    let serverUrl = sttSettings.sttUrl;
    let modelName = sttSettings.sttModel;
    const sttKey = sttSettings.sttKey;

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

    const response = await fetch("/api/stt", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || "Failed to upload audio");
    }

    return await response.text();
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    console.log(settings.peek());

    try {
      // Prefer AI SDK in-browser if available
      const sdkText = await transcribeWithAiSdk(audioBlob);
      if (sdkText && sdkText.trim() !== "") {
        console.log("Text from AI SDK:", sdkText);
        onFinishRecording(sdkText);
        return;
      }

      // Try direct call first if STT URL + Key are configured (frontend-only)
      const directText = await transcribeDirect(audioBlob);
      const text = directText ?? await transcribeViaProxy(audioBlob);
      console.log("Text from VoiceRecordButton:", text);
      onFinishRecording(text);
    } catch (error) {
      console.error("Error uploading/transcribing audio:", error);
      addMessage({
        role: "assistant",
        content: `❌ **Error**: ${error instanceof Error ? error.message : "Unknown error during transcription"}`,
      });
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
      class={`border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 ${
        isRecording ? "animate-pulse bg-red-600" : ""
      }`}
      type="button"
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      <IconMicrophone
        class={`icon w-5 h-5 ${isRecording ? "text-white" : "text-gray-500"}`}
      />
    </button>
  );
}

export default VoiceRecordButton;
