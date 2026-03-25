import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/prix-carburants": {
        target: "https://data.economie.gouv.fr",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/prix-carburants/, ""),
      },
    },
  },
});
