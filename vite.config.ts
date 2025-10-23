import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    fresh(),
    tailwindcss(),
  ],
  define: {
    __dirname: JSON.stringify(__dirname),
    __filename: JSON.stringify(__filename),
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "Cannot assign to read only property" warnings
        if (warning.message.includes('prototype')) return;
        warn(warning);
      },
    },
  },
});
