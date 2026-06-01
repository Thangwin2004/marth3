import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 8080,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Force all PixiJS modules into a single chunk to prevent
        // code-splitting from breaking internal pipe registrations
        // and RenderGroup state, which causes updateRenderable crashes
        manualChunks(id) {
          if (id.includes('pixi.js') || id.includes('pixi')) {
            return 'pixi';
          }
        },
      },
    },
  },
});
