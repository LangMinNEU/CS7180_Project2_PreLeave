import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    reporters: ["default"],
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: ["src/**/*.ts"],
      exclude: [
        "node_modules/**",
        "tests/**",
        "**/*.config.ts",
        "dist/**",
        // Schedulers use setInterval and are tested indirectly via app behavior
        "src/services/etaRefreshScheduler.ts",
        "src/services/notificationScheduler.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
