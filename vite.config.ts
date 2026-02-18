import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 8081,
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/milma-native/**', '**/android/**', '**/ios/**', '**/node_modules/**', '**/.git/**'],
    },
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
