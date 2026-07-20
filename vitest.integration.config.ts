import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Dedicated config for the DB-backed integration suite.
//
// Integration tests share a single Postgres database and each file installs a
// `beforeEach` truncation hook. Running the files in parallel causes cross-file
// contamination (one file truncates while another is mid-assertion) and
// AccessExclusiveLock deadlocks on TRUNCATE. We therefore disable file-level
// parallelism and run the suite sequentially against the shared instance.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.integration.test.{ts,tsx}", "apps/**/*.integration.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/coverage/**"],
    fileParallelism: false,
    pool: "forks",
    singleFork: true,
    setupFiles: ["./tests/setup.ts", "./tests/vitest.setup.ts"],
    server: {
      deps: {
        inline: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/web/src"),
      "@herafino/types": path.resolve(__dirname, "./packages/types/src"),
      "@herafino/contracts": path.resolve(__dirname, "./packages/contracts/src"),
      "@herafino/shared": path.resolve(__dirname, "./packages/shared/src"),
      "@herafino/shared/*": path.resolve(__dirname, "./packages/shared/src/*"),
    },
  },
});
