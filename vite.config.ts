import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    port: 8080,
  },
  build: {
    outDir: "dist",
  },
});
