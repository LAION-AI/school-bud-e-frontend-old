import { Handlers } from "$fresh/server.ts";
import { Buffer } from "npm:buffer";
import { deductInputTokens } from "./chat/(_utils)/shop.ts";

const TTS_KEY = Deno.env.get("TTS_KEY") || "";
const TTS_URL = Deno.env.get("TTS_URL") || "";
const TTS_MODEL = Deno.env.get("TTS_MODEL") || "";

async function callMARS6API(
  text: string,
  ttsUrl: string,
  ttsKey: string,
) {
  async function createTTSTask(
    ttsUrl: string,
    ttsKey: string,
    voiceID: number = 20299,
    language: number = 1,
  ) {
    try {
      const response = await fetch(
        `${ttsUrl}/tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ttsKey,
          },
          body: JSON.stringify({
            text: text,
            voice_id: voiceID,
            language: language,
          }),
        },
      );
      const responseJSON = await response.json();
      console.log(`Status code for creating TTS: ${response.status}`);
      if (response.ok) {
        return responseJSON.task_id;
      }
      console.error(
        `Failed to create TTS task for MARS6. Status code: ${response.status}: ${response.statusText}`,
      );
    } catch (error) {
      console.error(`Error in createTTSTask: ${error}`);
    }
  }

  async function pollTTSTask(ttsUrl: string, ttsKey: string, taskID: string) {
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    try {
      const response = await fetch(`${ttsUrl}/tts/${taskID}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ttsKey,
        },
      });

      const responseJSON = await response.json();
      const status = responseJSON.status;
      console.log(`Polling: ${status}`);

      if (status === "SUCCESS") {
        return responseJSON.run_id;
      }
      await delay(1500); // Wait for 1.5 seconds before the next poll.
      return pollTTSTask(ttsUrl, ttsKey, taskID); // Recursive call for polling.
    } catch (error) {
      console.error("Error polling TTS task:", error);
      throw error;
    }
  }

  async function getTTSAudioResult(
    ttsUrl: string,
    ttsKey: string,
    runID: number,
  ) {
    try {
      const response = await fetch(
        `${ttsUrl}/tts-result/${runID}`,
        {
          method: "GET",
          headers: {
            "x-api-key": ttsKey,
          },
        },
      );
      if (response.ok) {
        return await response.arrayBuffer();
      } else {
        console.error(
          `Failed to fetch TTS audio file from MARS6. Status code: ${response.status}: ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error(`Error in fetching TTS audio file from MARS6: ${error}`);
    }
  }

  try {
    const taskID: string = await createTTSTask(
      ttsUrl,
      ttsKey,
    );
    const runID = await pollTTSTask(ttsUrl, ttsKey, taskID);
    return await getTTSAudioResult(ttsUrl, ttsKey, runID);
  } catch (error) {
    console.error(`Failed to call MARS6: ${error}`);
    throw error;
  }
}

async function textToSpeech(
  text: string,
  textPosition: string,
  ttsUrl: string,
  ttsKey: string,
  ttsModel: string,
  shopApiKey?: string,
): Promise<Buffer | null> {
  const boldTextRegex = /\*\*(.*?)\*\*/g;
  text = String(text).replace(boldTextRegex, "$1");

  // Lowercase all text
  text = text.toLowerCase();

  // Replace 'mit ' with 'mitt '
  text = text.replace(/mit /g, "mitt ");

  // Replace German umlauts and ß with ASCII equivalents
  text = text
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");

  const buddyRegex = /bud-e/gi;
  text = text.replace(buddyRegex, "buddy");

  console.log("textToSpeech", text);
  console.log("textPosition", textPosition);
  console.log("ttsUrl", ttsUrl);
  console.log("ttsKey", ttsKey);
  console.log("ttsModel", ttsModel);
  console.log("shopApiKey", shopApiKey);

  let useThisTttsUrl = ttsUrl !== "" ? ttsUrl : TTS_URL;
  let useThisTtsKey = ttsKey !== "" ? ttsKey : TTS_KEY;
  let useThisTtsModel = ttsModel !== "" ? ttsModel : TTS_MODEL;

  if (shopApiKey) {
    const { endpoint, apiKey, model } = await deductInputTokens(
      [{ role: "user", content: text }],
      shopApiKey,
      "de-de-Chirp3-HD-Leda" //"en-us-Chirp3-HD-Leda"
    );
    useThisTttsUrl = endpoint;
    useThisTtsKey = apiKey;
    useThisTtsModel = "de-de-Chirp3-HD-Leda"; //"en-us-Chirp3-HD-Leda"
  }

  console.log("useThisTttsUrl", useThisTttsUrl);
  console.log("useThisTtsKey", useThisTtsKey);
  console.log("useThisTtsModel", useThisTtsModel);  

  //   Deepgram random with 40 chars
  // 9371dfaed6d8b42e9eaf9458ba8604126fb373d0
  // STT
  // curl \
  //   -X POST \
  //   -H "Authorization: Token 6c4fa34dac9fb4c3aa6bc0421ca805e173e85ed3" \
  //   -H "Content-Type: application/json" \
  //   -d '{"url":"https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav"}' \
  //   "https://api.deepgram.com/v1/listen?language=en&model=nova-2"

  // TTS
  // curl \
  //   -X POST \
  //   -H "Authorization: Token YOUR_SECRET" \
  //   -H "Content-Type: text/plain" \
  //   -d "Deepgram is great for real-time conversations… and also, you can build apps for things like customer support, logistics, and more. What do you think of the voices?" \
  //   "https://api.deepgram.com/v1/speak?model=aura-helios-en" \
  //   -o audio.mp3

  try {
    switch (useThisTtsModel) {
      case "MARS6": {
        const audioData = await callMARS6API(
          text,
          ttsUrl,
          ttsKey,
        );
        if (audioData) {
          return Buffer.from(audioData);
        } else {
          console.error(`Failed to synthesize speech.`);
          break;
        }
      }
      case "aura-helios-en": {
        const startTime = Date.now();
        const response = await fetch(useThisTttsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "Authorization": `Token ${useThisTtsKey}`,
          },
          body: text,
        });
        if (response.ok) {
          const audioData = await response.arrayBuffer();
          console.log(
            `Audio file received for ${textPosition}, Latency:`,
            Date.now() - startTime,
          );
          return Buffer.from(audioData);
        } else {
          console.error(
            `Failed to synthesize speech. Status code: ${response.status}: ${response.statusText}`,
          );
        }
        break;
      }
      // Example: Replace "aura-helios-en" with the specific Google Voice Name
      // You might have multiple cases for different Google voices.
      case "de-de-Chirp3-HD-Leda": // <-- Replace with the desired Google Chirp/Standard/WaveNet voice name
      // Add other Google voice cases if needed:
      // case "en-US-News-K":
      // case "en-GB-Standard-A":
      {
        const startTime = Date.now();
        const googleApiKey = useThisTtsKey; // Assuming this holds your Google Cloud API Key
        const voiceName = "de-de-Chirp3-HD-Leda"; // The specific voice for this case block

        // Extract language code from voice name (e.g., "en-US" from "en-us-Chirp3-HD-Leda")
        // This is a basic assumption, might need adjustment for complex voice names
        const languageCode = voiceName.split("-").slice(0, 2).join("-");

        // Google TTS API v1 endpoint (works for Chirp models too)
        const googleTtsUrl =
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`;
        // Alternatively, use the API key in the header:
        // const googleTtsUrl = "https://texttospeech.googleapis.com/v1/text:synthesize";
        // And add header: "X-Goog-Api-Key": googleApiKey

        const requestBody = {
          input: {
            text: text, // The text to synthesize
          },
          voice: {
            languageCode: languageCode, // e.g., "en-US"
            name: voiceName, // e.g., "en-us-Chirp3-HD-Leda"
          },
          audioConfig: {
            audioEncoding: "MP3", // Common encoding. Others: LINEAR16, OGG_OPUS
            // Optional: Adjust speakingRate, pitch, volumeGainDb, sampleRateHertz etc.
            // speakingRate: 1.0,
            // pitch: 0,
          },
        };

        try {
          const response = await fetch(googleTtsUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              // If using header auth instead of query param:
              // "X-Goog-Api-Key": googleApiKey,
              // If using OAuth 2.0 Bearer Token instead of API Key:
              // "Authorization": `Bearer YOUR_ACCESS_TOKEN`,
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const responseData = await response.json(); // Google TTS returns JSON
            if (responseData.audioContent) {
              // audioContent is Base64 encoded, decode it into a Buffer
              const audioData = Buffer.from(
                responseData.audioContent,
                "base64",
              );
              console.log(
                `Audio file received for ${textPosition} using ${voiceName}, Latency:`,
                Date.now() - startTime,
                "ms",
              );
              return audioData; // Return the audio data as a Buffer
            } else {
              // Should not happen if response.ok, but good practice
              console.error(
                `Failed to synthesize speech with ${voiceName}: No audioContent in response.`,
                responseData,
              );
              return null; // Or throw an error
            }
          } else {
            // Log detailed error from Google Cloud TTS if possible
            let errorBody = null;
            try {
              errorBody = await response.json(); // Google usually returns JSON errors
            } catch (e) {
              errorBody = await response.text(); // Fallback if error response isn't JSON
            }
            console.error(
              `Failed to synthesize speech with ${voiceName}. Status: ${response.status} ${response.statusText}. Response:`,
              errorBody,
            );
            return null; // Or throw an error
          }
        } catch (error) {
          console.error(
            `Network or other error during TTS request for ${voiceName}:`,
            error,
          );
          return null; // Or throw an error
        }
        // Note: 'break;' is usually unreachable here because of 'return',
        // but keep it if you change the logic to not always return.
        // break;
      } // End of case block
      default: {
        const startTime = Date.now();
        const response = await fetch(useThisTttsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${useThisTtsKey}`,
          },
          body: JSON.stringify({
            model: useThisTtsModel,
            input: text,
            voice: "Fritz-PlayAI",
            response_format: "wav",
            // mp3_bitrate: 64,
            // opus_bitrate: -1000,
            // latency: "normal",
          }),
        });

        if (response.ok) {
          const audioData = await response.arrayBuffer();
          console.log(
            `Audio file received for ${textPosition}, Latency:`,
            Date.now() - startTime,
          );
          return Buffer.from(audioData);
        }
        console.error(
          `Failed to synthesize speech. Status code: ${response.status}: ${response.statusText}`,
        );
      }
    }
  } catch (error) {
    console.error(`Error in textToSpeech: ${error}`);
  }
  return null;
}

export const handler: Handlers = {
  async POST(req) {
    const { text, textPosition, ttsUrl, ttsKey, ttsModel, shopApiKey } = await req.json();
    // console.log("Text:", text);

    if (!text) {
      return new Response("No text provided", { status: 400 });
    }

    const audioData = await textToSpeech(
      text,
      textPosition,
      ttsUrl,
      ttsKey,
      ttsModel,
      shopApiKey,
    );

    if (audioData) {
      const response = new Response(audioData, {
        status: 200,
        headers: {
          "Content-Type": "audio/mp3", // Changed from audio/wav to audio/mp3
        },
      });
      return response;
    } else {
      return new Response("Failed to synthesize speech", {
        status: 500,
      });
    }
  },
};
