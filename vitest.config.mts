import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": src,
      // `server-only` throws outside the Next.js bundler.
      "server-only": fileURLToPath(
        new URL("./tests/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: { include: ["tests/**/*.test.ts"] },
});
