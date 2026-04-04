import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "mask-icon.svg", "logo.png"],
      manifest: {
        name: "Architect Haven",
        short_name: "Architect Haven",
        description: "3D building modeling app",
        theme_color: "#111827",
        background_color: "#f9fafb",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: "localhost",
  },
  build: {
    // The 3D viewer ships a large Three.js chunk that is intentional for this app.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("three")) return "three";
          if (id.includes("convex")) return "convex";
          if (id.includes("lucide-svelte")) return "icons";

          return "vendor";
        },
      },
    },
  },
});
