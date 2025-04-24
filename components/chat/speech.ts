import { signal } from "@preact/signals";
import { lang, messages, settings } from "./store.ts";

export const audioFileDict = signal<Record<number, Record<number, { audio: HTMLAudioElement; played: boolean }>>>({});
export const readAlways = signal(true);
export const stopList = signal<number[]>([]);
export const resetTranscript = signal(0);

export const toggleReadAlways = (value: boolean) => {
    readAlways.value = value;
    if (!value) {
        stopAndResetAudio();
        stopList.value = Object.keys(audioFileDict.value).map(Number);
    }
};

const cleanTextForSpeech = (text: string): string => {
    return text
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        // Remove inline code
        .replace(/`[^`]*`/g, '')
        // Remove URLs
        .replace(/https?:\/\/[^\s]+/g, '')
        // Remove markdown links
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove markdown bold/italic
        .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
        // Remove special characters but keep basic punctuation
        .replace(/[^a-zA-Z0-9\s.,!?;:'"()[\]-]/g, ' ')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        .trim();
};

export const getTTS = async (
    text: string,
    groupIndex: number,
    sourceFunction: string,
) => {
    console.log(`getTTS called for group ${groupIndex}, source: ${sourceFunction}`);
    
    // Don't process if it's a user message
    if (messages.value[groupIndex]?.role === "user") {
        console.log('Skipping user message');
        return;
    }
    
    // Don't process if readAlways is false and this is a stream request
    if (!readAlways.value && sourceFunction.startsWith("stream")) {
        console.log('Skipping due to readAlways false');
        return;
    }

    // Clean the text for speech
    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    // Don't process if we already have audio for this message
    if (audioFileDict.value[groupIndex]?.[0]?.audio) {
        console.log('Audio already exists for this message');
        if (readAlways.value) {
            audioFileDict.value[groupIndex][0].audio.play().catch(console.error);
        }
        return;
    }

    try {
        const response = await fetch("/api/tts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: cleanedText,
                textPosition: sourceFunction,
                voice: lang.value === "en" ? "Stefanie" : "Florian",
                ttsKey: settings.value.ttsKey,
                ttsUrl: settings.value.ttsUrl,
                ttsModel: settings.value.ttsModel,
                shopApiKey: settings.value.universalApiKey,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const audioData = await response.arrayBuffer();
        const audioBlob = new Blob([audioData], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        if (!audioFileDict.value[groupIndex]) {
            audioFileDict.value[groupIndex] = {};
        }

        audioFileDict.value[groupIndex][0] = {
            audio,
            played: false
        };

        audioFileDict.value = { ...audioFileDict.value };
        console.log('Created new audio for message');

        if (readAlways.value) {
            audio.play().catch(console.error);
        }

    } catch (error) {
        console.error("Error fetching TTS:", error);
    }
};

export const handleOnSpeakAtGroupIndexAction = (groupIndex: number) => {
    // Don't process if it's a user message
    if (messages.value[groupIndex]?.role === "user") return;

    if (!audioFileDict.value[groupIndex]) {
        const message = messages.value[groupIndex];
        if (!message || !message.content) return;
        
        const content = Array.isArray(message.content) 
            ? message.content.join("") 
            : message.content;
            
        getTTS(content, groupIndex, "handleOnSpeakAtGroupIndexAction");
        return;
    }

    const audio = audioFileDict.value[groupIndex][0]?.audio;
    if (!audio) return;

    if (!audio.paused) {
        stopAndResetAudio();
        stopList.value = [...stopList.value, groupIndex];
    } else {
        stopAndResetAudio();
        stopList.value = stopList.value.filter(item => item !== groupIndex);
        audio.play().catch(console.error);
    }

    audioFileDict.value = { ...audioFileDict.value };
};

export const stopAndResetAudio = () => {
    Object.values(audioFileDict.value).forEach(group => {
        Object.values(group).forEach(item => {
            if (!item.audio.paused) {
                item.audio.pause();
                item.audio.currentTime = 0;
            }
        });
    });
};
