import { signal } from "@preact/signals";
import { chatIslandContent } from "../../internalization/content.ts";
import { lang, messages, settings } from "./store.ts";

export const audioFileDict = signal<
    AudioItem[][]
>([]);
export const readAlways = signal(true);
export const stopList = signal<number[]>([]);
export const resetTranscript = signal(0); // used for STT in Voice Record Button

// 1. toggleReadAlways
// - toggles readAlways state
// - stops all audio playback if readAlways is set to false
// - add all groupIndices to stopList if readAlways is set to false
export const toggleReadAlways = (value: boolean) => {
    readAlways.value = value;
    if (!value) {
        for (const group of audioFileDict.value) {
            for (const item of group) {
                if (!item.audio.paused) {
                    item.audio.pause();
                    item.audio.currentTime = 0;
                }
            }
        }
        stopList.value = Object.keys(audioFileDict).map(Number);
    }
};

export const getTTS = async (
    text: string,
    groupIndex: number,
    sourceFunction: string,
) => {
    // Only return early if readAlways is false AND this is a streaming request
    if (!readAlways && sourceFunction.startsWith("stream")) return;

    console.log("[LOG] getTTS");
    // console.log("text", text);
    // console.log("chatIslandContent[lang][welcomeMessage]", chatIslandContent[lang]["welcomeMessage"]);
    if (
        text === chatIslandContent[lang.value]["welcomeMessage"]
    ) {
        const audioFile = text === chatIslandContent["de"]["welcomeMessage"]
            ? "./intro.mp3"
            : "./intro-en.mp3";
        const audio = new Audio(audioFile);
        // audioFileDict.value[groupIndex] = {
        //   0: audio,
        // };
        const sourceFunctionIndex =
            Number(sourceFunction.replace("stream", "")) -
                1 || 0;
        if (audioFileDict.value[groupIndex]) {
            audioFileDict.value[groupIndex][sourceFunctionIndex] = {
                audio: audio,
                played: false,
            };
        } else {
            audioFileDict.value[groupIndex] = [];
            audioFileDict.value[groupIndex][sourceFunctionIndex] = {
                audio: audio,
                played: false,
            };
        }

        // all indices < groupIndex should be put to pause and added to stopList
        const newStopList = stopList;
        for (let i = 0; i < groupIndex; i++) {
            if (audioFileDict.value[i]) {
                (Object.values(audioFileDict.value[i]) as AudioItem[]).forEach(
                    (item) => {
                        if (!item.audio.paused) {
                            item.audio.pause();
                            item.audio.currentTime = 0;
                            newStopList.value.push(i);
                        }
                    },
                );
            }
        }

        stopList.value = newStopList.value;

        // // // TRYING DIFFERENT SETTER
        audioFileDict.value = [ ...audioFileDict.value ];

        // // // WORKING SETTER
        // audioFileDict.value = ((prev) => ({
        //   ...prev,
        //   [groupIndex]: audioFileDict.value[groupIndex],
        // }));
        // audioFileDict.value = ((prev) => ({ ...prev, [groupIndex]: audio }));
        console.log(
            "[LOG] Audio file loaded into audioQueue with groupIndex:",
            groupIndex,
        );
        if (sourceFunction === "handleOnSpeakAtGroupIndexAction") {
            handleOnSpeakAtGroupIndexAction(groupIndex);
        }
        return;
    }

    try {
        // // FOR PRODUCTION WHEN TTS SERVER IS WORKING
        console.log("text for /api/tts", sourceFunction, text);
        const response = await fetch("/api/tts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: text,
                textPosition: sourceFunction,
                voice: lang.value === "en" ? "Stefanie" : "Florian",
                ttsKey: settings.value.ttsKey,
                ttsUrl: settings.value.ttsUrl,
                ttsModel: settings.value.ttsModel,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const audioData = await response.arrayBuffer();
        const audioBlob = new Blob([audioData], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        const startsWithStream = sourceFunction.startsWith("stream");

        if (!audioFileDict.value[groupIndex]) {
            audioFileDict.value[groupIndex] = []
        }

        if (startsWithStream) {
            const sourceFunctionIndex =
                Number(sourceFunction.replace("stream", "")) - 1;
            audioFileDict.value[groupIndex][sourceFunctionIndex] = {
                audio: audio,
                played: false,
            };
        } else {
            audioFileDict.value[groupIndex][0] = { audio: audio, played: true };
        }

        // audioFileDict.value = (prev) => ({
        //     ...prev,
        //     [groupIndex]: audioFileDict.value[groupIndex],
        // });

        if (sourceFunction === "handleOnSpeakAtGroupIndexAction") {
            handleOnSpeakAtGroupIndexAction(groupIndex);
        }
    } catch (error) {
        console.error("Error fetching TTS:", error);
    }
};

// 3. handleOnSpeakAtGroupIndexAction
const handleOnSpeakAtGroupIndexAction = (groupIndex: number) => {
    console.log("[LOG] handleOnSpeakAtGroupIndexAction", groupIndex);
    if (!audioFileDict.value[groupIndex]) {
        console.log("No audio file found for groupIndex", groupIndex);
        console.log("AudioFileDict", audioFileDict);
        const lastMessage = Array.isArray(messages.value[groupIndex])
            ? messages.value[groupIndex][0]
            : messages.value[groupIndex];
        console.log("lastMessage", lastMessage);
        const parsedLastMessage = Array.isArray(lastMessage.content)
            ? lastMessage.content.join("")
            : lastMessage.content;
        if (parsedLastMessage === "") return;
        getTTS(
            parsedLastMessage as string,
            groupIndex,
            "handleOnSpeakAtGroupIndexAction",
        );
        return;
    } else {
        const indexThatIsPlaying = Object.entries(
            audioFileDict.value[groupIndex],
        )
            .findIndex(([_, item]) => !item.audio.paused);

        if (indexThatIsPlaying !== -1) {
            // Pause current audio
            // audioFileDict.value[groupIndex][indexThatIsPlaying].audio.pause();
            // audioFileDict.value[groupIndex][indexThatIsPlaying].audio.currentTime = 0;

            (Object.values(audioFileDict) as Record<number, AudioItem>[])
                .forEach(
                    (group) => {
                        (Object.values(group) as AudioItem[]).forEach(
                            (item) => {
                                if (!item.audio.paused) {
                                    item.audio.pause();
                                    item.audio.currentTime = 0;
                                }
                            },
                        );
                    },
                );

            stopList.value = [...stopList.value, groupIndex];
            // Force state update after pausing
            audioFileDict.value = [...audioFileDict.value];
        } else {
            stopList.value = stopList.value.filter((item) =>
                item !== groupIndex
            );
            // Stop all other playing audio
            (Object.values(audioFileDict) as Record<number, AudioItem>[])
                .forEach(
                    (group) => {
                        (Object.values(group) as AudioItem[]).forEach(
                            (item) => {
                                if (!item.audio.paused) {
                                    item.audio.pause();
                                    item.audio.currentTime = 0;
                                }
                            },
                        );
                    },
                );

            // Start playback of current group
            const firstAudio = audioFileDict.value[groupIndex][0].audio;
            firstAudio.play();

            // Set up sequential playback
            Object.keys(audioFileDict.value[groupIndex]).forEach((_, index) => {
                const currentAudio =
                    audioFileDict.value[groupIndex][index].audio;
                currentAudio.onended = () => {
                    if (audioFileDict.value[groupIndex][index + 1]) {
                        audioFileDict.value[groupIndex][index + 1].audio.play();
                    }
                    // Update state after each audio finishes
                    audioFileDict.value = [...audioFileDict.value];
                };
            });
        }

        // Force immediate state update when starting playback
        audioFileDict.value = [...audioFileDict.value];
    }
};

// 2. stopAndResetAudio
export const stopAndResetAudio = () => {
    for (const group of (audioFileDict.value || [])) {
        for (const item of group) {
            if (item.audio.paused) continue;

            item.audio.pause(); // Changed from audio.pause()
            item.audio.currentTime = 0; // Changed from audio.currentTime
        }
    }
    // TODO: Check if this is necessary
    // audioFileDict.value = {};
};
