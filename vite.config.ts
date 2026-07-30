import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig(({ mode }) => {
  return {
    server: {
      watch: {
        ignored: ["**/*.mp4", "**/*.mov", "**/*.avi"],
      },
    },
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      ...(mode === "production" ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : []),
      tanstackStart({
        server: { entry: "src/server.ts" },
      }),
      react(),
    ],
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Separar librerías grandes en su propio chunk cacheado
            if (id.includes("node_modules/xlsx")) return "vendor-xlsx";
            if (id.includes("node_modules/recharts") || id.includes("node_modules/d3")) return "vendor-charts";
            if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
            if (id.includes("node_modules/lucide-react")) return "vendor-lucide";
            if (id.includes("node_modules/@tanstack")) return "vendor-tanstack";
            if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "vendor-react";
            if (id.includes("node_modules/")) return "vendor-misc";
          },
        },
      },
    },
  };
});

