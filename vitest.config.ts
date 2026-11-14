import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Les modules serveur importent « server-only » : neutralisé dans les tests.
      "server-only": path.resolve(__dirname, "tests/helpers/empty.ts"),
    },
  },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
