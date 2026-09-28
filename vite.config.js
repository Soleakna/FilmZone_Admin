import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    port: 5174,
    proxy: {
      "/cinema-api": {
        target: "https://cinema-booking-api.eunglyzhia.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/cinema-api/, ""),
      },
    },
  },
});
