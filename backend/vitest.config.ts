import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Use default reporter. Do not use --reporter=html with "vitest run": the
    // built-in HTML reporter needs a Vite server context (viteModuleRunner) that
    // is only available in UI/watch mode and will throw in run mode.
    reporters: ["default"],
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
