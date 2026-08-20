import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "pages",
  base: "/carbon-market-intelligence/",
  plugins: [react()],
  publicDir: "../public",
  build: {
    outDir: "../dist-pages",
    emptyOutDir: true,
  },
});
