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
        name: "Emergence — AI World Laboratory",
        short_name: "Emergence",
        description: "Build 3D worlds and train autonomous agents",
        theme_color: "#070b18",
        background_color: "#070b18",
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
