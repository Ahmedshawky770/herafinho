import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts", "./tests/vitest.setup.ts"],
    include: [
      "tests/**/*.{test,spec}.{ts,tsx}",
      "packages/**/*.{test,spec}.{ts,tsx}",
      "apps/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/coverage/**", "tests/e2e/**"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["packages/**/src/**", "apps/web/src/**", "apps/workers/src/**"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.unit.test.{ts,tsx}",
        "**/*.integration.test.{ts,tsx}",
        "**/dist/**",
        "**/migrations/**",
        "**/seed.ts",
        "**/index.ts",
        "apps/web/src/components/**",
        "apps/web/src/app/**/page.tsx",
        "apps/web/src/app/**/layout.tsx",
        "apps/web/src/app/**/loading.tsx",
        "apps/web/src/app/**/error.tsx",
        "apps/web/src/app/**/not-found.tsx",
        "apps/web/src/app/**/template.tsx",
      ],
      thresholds: {
        "packages/shared/src/**": {
          statements: 50,
          branches: 40,
          functions: 50,
          lines: 50,
        },
        "packages/contracts/src/**": {
          statements: 50,
          branches: 40,
          functions: 50,
          lines: 50,
        },
        "apps/web/src/**": {
          statements: 10,
          branches: 10,
          functions: 10,
          lines: 10,
        },
      },
    },
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
