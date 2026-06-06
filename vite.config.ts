import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// shescore.org — institutional data site. Standalone repo (shares components
// with the token site by copy, per the chosen architecture).
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8090,
    hmr: { overlay: false },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
