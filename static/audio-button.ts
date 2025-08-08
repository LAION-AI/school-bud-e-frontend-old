// audio-button.ts - Standalone script for the AI-driven audio button

interface AudioButtonConfig {
  id?: string;
  color?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  size?: "small" | "medium" | "large";
  sttUrl?: string;
  sttKey?: string;
  sttModel?: string;
  avatarUrl?: string;
}

export class AudioButton extends HTMLElement {
  private shadow: ShadowRoot;
  private config: AudioButtonConfig;
  private isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(config: AudioButtonConfig = {}) {
    super();
    this.config = this.parseConfig(config);
    this.shadow = this.attachShadow({ mode: "open" });
    this.initialize();
  }

  private parseConfig(config: AudioButtonConfig): AudioButtonConfig {
    // Parse URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const queryConfig: AudioButtonConfig = {
      id: urlParams.get("id") || undefined,
      color: urlParams.get("color") || undefined,
      position: (urlParams.get("position") as AudioButtonConfig["position"]) ||
        "bottom-right",
      size: (urlParams.get("size") as AudioButtonConfig["size"]) || "medium",
      sttUrl: urlParams.get("sttUrl") || "",
      sttKey: urlParams.get("sttKey") || "",
      sttModel: urlParams.get("sttModel") || "",
    };

    // Merge configurations with priority: query params > passed config > defaults
    return { ...queryConfig, ...config };
  }

  private initialize() {
    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      :host {
        position: fixed;
        ${this.getPositionStyles()}
        z-index: 9999;
      }

      .audio-button {
        border: none;
        border-radius: 50%;
        cursor: pointer;
        background-color: ${this.config.color || "#4A90E2"};
        padding: ${this.getSizeStyles()};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .audio-button:hover {
        transform: scale(1.1);
      }

      .audio-button.recording {
        animation: pulse 1.5s infinite;
        background-color: #FF4444;
      }

      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }

      .mic-icon {
        width: ${this.getIconSize()};
        height: ${this.getIconSize()};
        fill: white;
      }

      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        align-items: center;
        justify-content: center;
      }

      .modal.active {
        display: flex;
      }

      .modal-content {
        background-color: white;
        padding: 2rem;
        border-radius: 1rem;
        width: 90%;
        max-width: 400px;
        text-align: center;
      }

      @media (prefers-color-scheme: dark) {
        .modal-content {
          background-color: #1a1a1a;
          color: white;
        }
      }

      .avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        margin: 0 auto 1rem;
      }

      .recording-animation {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: #FF4444;
        margin: 1rem auto;
        animation: pulse 1.5s infinite;
      }
    `;

    // Create button element
    const button = document.createElement("button");
    button.className = "audio-button";
    button.innerHTML = this.getMicrophoneIcon();
    button.addEventListener("click", () => this.toggleRecording());

    // Create modal
    const modal = this.createModal();

    // Append elements to shadow DOM
    this.shadow.appendChild(style);
    this.shadow.appendChild(button);
    this.shadow.appendChild(modal);
  }

  private getPositionStyles(): string {
    switch (this.config.position) {
      case "bottom-right":
        return "bottom: 20px; right: 20px;";
      case "bottom-left":
        return "bottom: 20px; left: 20px;";
      case "top-right":
        return "top: 20px; right: 20px;";
      case "top-left":
        return "top: 20px; left: 20px;";
      default:
        return "bottom: 20px; right: 20px;";
    }
  }

  private getSizeStyles(): string {
    switch (this.config.size) {
      case "small":
        return "12px";
      case "large":
        return "20px";
      default:
        return "16px";
    }
  }

  private getIconSize(): string {
    switch (this.config.size) {
      case "small":
        return "16px";
      case "large":
        return "32px";
      default:
        return "24px";
    }
  }

  private getMicrophoneIcon(): string {
    return `
      <svg class="mic-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
    `;
  }

  private createModal() {
    const modal = document.createElement("div");
    modal.className = "modal";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = "/logo.png";
    avatar.alt = "School Bud-E Avatar";

    const recordingAnimation = document.createElement("div");
    recordingAnimation.className = "recording-animation";
    recordingAnimation.style.display = "none";

    modalContent.appendChild(avatar);
    modalContent.appendChild(recordingAnimation);
    modal.appendChild(modalContent);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });

    return modal;
  }

  private showModal() {
    const modal = this.shadow.querySelector(".modal");
    if (modal) {
      modal.classList.add("active");
    }
  }

  private closeModal() {
    const modal = this.shadow.querySelector(".modal");
    if (modal) {
      modal.classList.remove("active");
      if (this.isRecording) {
        this.stopRecording();
      }
    }
  }

  private async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.showModal();
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || undefined;
        const audioBlob = new Blob(this.audioChunks, mimeType ? { type: mimeType } : undefined);
        await this.sendAudioToServer(audioBlob);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.updateButtonState();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.updateButtonState();
    }
  }

  private async sendAudioToServer(audioBlob: Blob) {
    const tryAiSdk = async (): Promise<string | null> => {
      try {
        const serverUrl = this.config.sttUrl || "";
        let modelName = this.config.sttModel || "";
        const sttKey = this.config.sttKey || "";
        if (!sttKey) return null;
        if (sttKey.startsWith("gsk_")) {
          modelName = modelName || "whisper-large-v3-turbo";
        } else {
          modelName = modelName || "whisper-1";
        }
        // Dynamic import of SDKs in browser context
        const { transcribe } = await import("ai");
        const file = new File([audioBlob], "recording.webm", { type: audioBlob.type || "audio/webm" });
        if (sttKey.startsWith("gsk_") || /groq/i.test(serverUrl)) {
          const { createGroq } = await import("@ai-sdk/groq");
          const groq = createGroq({ apiKey: sttKey, baseURL: serverUrl || undefined });
          const model: unknown = (groq as unknown as Record<string, unknown>).audioTranscription
            ? (groq as unknown as { audioTranscription: (m: string) => unknown }).audioTranscription(modelName)
            : (groq as unknown as (m: string) => unknown)(modelName);
          const result = await transcribe({ model: model as any, file });
          return (result as any)?.text ?? null;
        } else {
          const { createOpenAI } = await import("@ai-sdk/openai");
          const openai = createOpenAI({ apiKey: sttKey, baseURL: serverUrl || undefined });
          const model: unknown = (openai as unknown as Record<string, unknown>).audioTranscription
            ? (openai as unknown as { audioTranscription: (m: string) => unknown }).audioTranscription(modelName)
            : (openai as unknown as (m: string) => unknown)(modelName);
          const result = await transcribe({ model: model as any, file });
          return (result as any)?.text ?? null;
        }
      } catch (_e) {
        return null;
      }
    };

    const tryDirect = async (): Promise<string | null> => {
      try {
        const serverUrl = this.config.sttUrl || "";
        const sttKey = this.config.sttKey || "";
        let modelName = this.config.sttModel || "";
        if (!serverUrl || !sttKey) return null;
        if (sttKey.startsWith("gsk_")) {
          modelName = modelName || "whisper-large-v3-turbo";
        }
        const fd = new FormData();
        fd.append("file", audioBlob, "recording.webm");
        fd.append("model", modelName || "whisper-1");
        const resp = await fetch(serverUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${sttKey}` },
          body: fd,
        });
        if (!resp.ok) return null;
        const data = await resp.json().catch(async () => ({ text: await resp.text() }));
        const text = typeof data === "string" ? data : (data?.text ?? "");
        return text || "";
      } catch (_e) {
        return null;
      }
    };

    const tryProxy = async (): Promise<string> => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("sttUrl", this.config.sttUrl || "");
      formData.append("sttKey", this.config.sttKey || "");
      formData.append("sttModel", this.config.sttModel || "");

      const response = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text());
      return await response.text();
    };

    try {
      const sdkText = await tryAiSdk();
      const directText = sdkText ?? await tryDirect();
      const text = directText ?? await tryProxy();
      this.dispatchEvent(new CustomEvent("transcription", { detail: text }));
    } catch (error) {
      console.error("Failed to transcribe audio:", error);
    }
  }

  private updateButtonState() {
    const button = this.shadow.querySelector(".audio-button");
    const recordingAnimation = this.shadow.querySelector(
      ".recording-animation",
    );

    if (button) {
      if (this.isRecording) {
        button.classList.add("recording");
        if (recordingAnimation) {
          recordingAnimation.style.display = "block";
        }
      } else {
        button.classList.remove("recording");
        if (recordingAnimation) {
          recordingAnimation.style.display = "none";
        }
        this.closeModal();
      }
    }
  }
}

// Register the custom element
customElements.define("audio-button", AudioButton);

// Initialize the button
const audioButton = new AudioButton();

// If an ID is provided, replace the target element
if (audioButton.config?.id) {
  const targetElement = document.getElementById(audioButton.config.id);
  if (targetElement) {
    targetElement.replaceWith(audioButton);
  }
} else {
  // Otherwise, append to body
  document.body.appendChild(audioButton);
}
