import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.BASE_PATH || "/project-manager-training-5/",
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
