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
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      ...(mode === "production" ? [cloudflare({ viteEnvironment: { name: "ssr" } })] : []),
      tanstackStart({
        server: { entry: "src/server.ts" },
      }),
      react(),
    ],
  };
});

