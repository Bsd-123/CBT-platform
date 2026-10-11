import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

// Runs the real repositories against a local PostgREST + Postgres (see tests/integration/run.sh).
export default defineConfig({
  resolve: {
    alias: {
      "@": src,
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: { include: ["tests/integration/**/*.int.ts"], fileParallelism: false, testTimeout: 30_000 },
});
