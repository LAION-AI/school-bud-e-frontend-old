import { bundle } from "https://deno.land/x/emit@0.31.1/mod.ts";
import { compress } from "https://deno.land/x/brotli@0.1.7/mod.ts";
import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/mod.js";

interface SizeMetrics {
  minJs: number;
  brJs: number;
  timestamp: string;
}

async function loadSizeHistory(): Promise<SizeMetrics[]> {
  try {
    const content = await Deno.readTextFile("static/size-history.json");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function saveSizeHistory(history: SizeMetrics[]) {
  await Deno.writeTextFile(
    "static/size-history.json",
    JSON.stringify(history, null, 2),
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getRandomMessage(type: "largest" | "smallest" | "zero"): string {
  const messages = {
    largest: [
      "🚨 Holy moly! This is the biggest build yet! Time to go on a diet? 😅",
      "🐘 Wow, she's a big one! Breaking size records today! 🏆",
      "🎈 The file size is expanding faster than the universe! 🌌",
    ],
    smallest: [
      "🎯 New record for smallest build! Marie Kondo would be proud! ✨",
      "🪶 Light as a feather! This is our most efficient build yet! 🎉",
      "🏃 Look at that slim build! Been hitting the gym? 💪",
    ],
    zero: [
      "Come on man, this is not fair, this is no performance improvement! 😤",
      "Zero bytes? What sorcery is this? 🤔",
      "Houston, we have a problem - the file has gone missing! 🚀",
    ],
  };
  const randomIndex = Math.floor(Math.random() * messages[type].length);
  return messages[type][randomIndex];
}

async function buildAudioButton() {
  try {
    // Bundle the TypeScript file
    const { code } = await bundle("static/audio-button.ts");

    // Minify the bundled code using esbuild
    const minified = await esbuild.transform(code, {
      minify: true,
      target: "es2015",
    });

    // Write the minified output
    await Deno.writeTextFile("static/audio-button.min.js", minified.code);

    // Read the minified output
    const minifiedContent = await Deno.readTextFile(
      "static/audio-button.min.js",
    );
    const minJsSize = new TextEncoder().encode(minifiedContent).length;

    // Create Brotli compressed version
    const compressedContent = compress(
      new TextEncoder().encode(minifiedContent),
    );
    await Deno.writeFile("static/audio-button.min.js.br", compressedContent);
    const brJsSize = compressedContent.length;

    // Load size history
    const sizeHistory = await loadSizeHistory();
    const currentMetrics: SizeMetrics = {
      minJs: minJsSize,
      brJs: brJsSize,
      timestamp: new Date().toISOString(),
    };

    // Calculate size changes and check records
    const lastBuild = sizeHistory[sizeHistory.length - 1];
    const minJsChange = lastBuild
      ? ((minJsSize - lastBuild.minJs) / lastBuild.minJs * 100).toFixed(2)
      : "0";
    const brJsChange = lastBuild
      ? ((brJsSize - lastBuild.brJs) / lastBuild.brJs * 100).toFixed(2)
      : "0";

    // Print build results
    console.log("\n📦 Build Results:");
    console.log(
      `Minified JS: ${formatBytes(minJsSize)} (${minJsChange}% change)`,
    );
    console.log(`Brotli JS: ${formatBytes(brJsSize)} (${brJsChange}% change)`);

    // Check for size records
    if (sizeHistory.length > 0) {
      const maxMinJs = Math.max(...sizeHistory.map((h) => h.minJs));
      const maxBrJs = Math.max(...sizeHistory.map((h) => h.brJs));
      const minMinJs = Math.min(...sizeHistory.map((h) => h.minJs));
      const minBrJs = Math.min(...sizeHistory.map((h) => h.brJs));

      if (minJsSize === 0 || brJsSize === 0) {
        console.log("\n" + getRandomMessage("zero"));
      } else {
        if (minJsSize > maxMinJs || brJsSize > maxBrJs) {
          console.log("\n" + getRandomMessage("largest"));
        } else if (minJsSize < minMinJs || brJsSize < minBrJs) {
          console.log("\n" + getRandomMessage("smallest"));
        }
      }
    }

    // Update history
    sizeHistory.push(currentMetrics);
    await saveSizeHistory(sizeHistory);

    console.log("\n✨ Build and compression completed successfully");
  } catch (error) {
    console.error("Build failed:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  buildAudioButton();
}
